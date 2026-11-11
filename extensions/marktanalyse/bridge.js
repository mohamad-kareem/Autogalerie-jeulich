(() => {
  const channel = "autogalerie.market-import.v1";
  const connections = new Map();

  function reply(requestId, kind, data = {}) {
    window.postMessage({ channel, from: "EXTENSION", requestId, kind, ...data }, location.origin);
  }

  window.addEventListener("message", (event) => {
    const message = event.data;
    // The app switches routes without reloading the document.
    if (event.source !== window || event.origin !== location.origin ||
      message?.channel !== channel || message.from !== "PAGE" ||
      typeof message.requestId !== "string" || message.requestId.length > 80) return;
    const { requestId, kind } = message;
    const path = location.pathname.replace(/\/$/, "");
    const importPage = ["/marktanalyse", "/Posteingang/ankauf/bestaetigung"].includes(path);
    if (!importPage && !(path === "/einstellungen" && kind === "PING")) return;

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
          if (!chrome.runtime.lastError && response?.version === 1) {
            reply(requestId, "RESULT", { version: response.version });
          }
        });
      } catch {
        // The page can be reloaded after an extension update.
      }
      return;
    }
    if ((kind !== "IMPORT" && !(path === "/marktanalyse" && kind === "SEARCH")) ||
      typeof message.url !== "string" || connections.has(requestId)) return;

    try {
      const port = chrome.runtime.connect({ name: channel });
      connections.set(requestId, port);
      port.onMessage.addListener((response) => {
        reply(requestId, response.kind, response);
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
      port.postMessage({ kind, url: message.url, appUrl: location.href });
    } catch {
      reply(requestId, "ERROR", { error: "Bitte die Seite nach der Installation der Erweiterung neu laden." });
    }
  });
})();
