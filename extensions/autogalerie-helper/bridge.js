(() => {
  // Läuft nur einmal je Seite und Erweiterungsstand (die Erweiterung setzt die Brücke nach
  // einem Update oder Neustart selbst in offene App-Tabs ein).
  if (window.__agHelperBridge) return;
  window.__agHelperBridge = true;
  const channel = "autogalerie.helper.v2";
  const version = 2;
  const connections = new Map();
  const routes = {
    "/Posteingang/ankauf/bestaetigung": "ankauf",
    "/marktanalyse": "marktanalyse",
    "/einstellungen": "settings",
  };

  function reply(requestId, kind, data = {}) {
    window.postMessage({ channel, from: "EXTENSION", bridge: 3, requestId, kind, ...data }, location.origin);
  }

  // Nach einem Update der Erweiterung ist diese alte Brücke tot; sie schweigt dann,
  // damit die neue Brücke antwortet.
  const alive = () => {
    try {
      return Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  };

  window.addEventListener("message", function onMessage(event) {
    if (!alive()) {
      window.removeEventListener("message", onMessage);
      return;
    }
    const message = event.data;
    // The app switches routes without reloading the document.
    if (event.source !== window || event.origin !== location.origin ||
      message?.channel !== channel || message.from !== "PAGE" ||
      typeof message.requestId !== "string" || message.requestId.length > 80) return;
    const { requestId, kind } = message;
    const route = routes[location.pathname.replace(/\/$/, "")];
    if (!route) return;

    if (kind === "CANCEL") {
      connections.get(requestId)?.disconnect();
      connections.delete(requestId);
      return;
    }
    if (kind === "SHOW_TAB") {
      connections.get(requestId)?.postMessage({ kind });
      return;
    }
    if (kind === "PING") {
      try {
        chrome.runtime.sendMessage({ kind: "PING", appUrl: location.href }, (response) => {
          if (!chrome.runtime.lastError && response?.version === version) {
            reply(requestId, "RESULT", { version: response.version });
          }
        });
      } catch {
        // The page can be reloaded after an extension update.
      }
      return;
    }
    // IMPORT: one mobile.de ad for "Ankauf bestätigen". FETCH: a portal page for the Marktanalyse.
    const allowed = kind === "IMPORT" && route === "ankauf" || kind === "FETCH" && route === "marktanalyse";
    if (!allowed || typeof message.url !== "string" || message.url.length > 2000 || connections.has(requestId) || connections.size > 40) return;

    try {
      const port = chrome.runtime.connect({ name: channel });
      connections.set(requestId, port);
      port.onMessage.addListener((response) => {
        reply(requestId, response.kind, { ...response, bridge: 3 });
        if (response.kind === "RESULT" || response.kind === "ERROR") {
          connections.delete(requestId);
          port.disconnect();
        }
      });
      port.onDisconnect.addListener(() => {
        const error = chrome.runtime.lastError;
        if (connections.get(requestId) !== port) return;
        connections.delete(requestId);
        reply(requestId, "ERROR", { error: error?.message || "Die Verbindung zur Erweiterung wurde beendet. Bitte erneut versuchen." });
      });
      port.postMessage({ kind, url: message.url, pageKind: message.pageKind === "search" ? "search" : "listing", appUrl: location.href });
    } catch {
      reply(requestId, "ERROR", { error: "Bitte die Seite nach der Installation der Erweiterung neu laden." });
    }
  });
})();
