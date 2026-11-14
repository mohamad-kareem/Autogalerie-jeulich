// Shared within one server instance. The interval starts when work starts,
// not when it finishes, so a slow response does not add another cache delay.
export function createCheckPool({ intervalMs = 1_500, now = Date.now } = {}) {
  const jobs = new Map();
  return (key, run) => {
    const previous = jobs.get(key);
    if (previous && (!previous.done || now() - previous.startedAt < intervalMs)) return previous;
    const job = { startedAt: now(), events: [], listeners: new Set(), done: false };
    const emit = (event) => {
      job.events.push(event);
      for (const listener of job.listeners) listener(event);
    };
    jobs.set(key, job);
    job.promise = Promise.resolve().then(() => run(emit)).catch(() => {
      emit({ type: "error", error: "Prüfung fehlgeschlagen." });
    }).finally(() => {
      job.done = true;
      for (const listener of job.listeners) listener(null);
      job.listeners.clear();
      if (jobs.size > 50) {
        for (const [oldKey, oldJob] of jobs) {
          if (oldJob.done && oldJob !== job) jobs.delete(oldKey);
          if (jobs.size <= 50) break;
        }
      }
    });
    return job;
  };
}

export function streamCheck(job, signal) {
  const encoder = new TextEncoder();
  let detach = () => {};
  return new ReadableStream({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        detach();
        controller.close();
      };
      const send = (event) => {
        if (closed) return;
        if (event === null) return close();
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      detach = () => {
        job.listeners.delete(send);
        signal?.removeEventListener("abort", close);
      };
      for (const event of job.events) send(event);
      if (job.done || signal?.aborted) close();
      else {
        job.listeners.add(send);
        signal?.addEventListener("abort", close, { once: true });
      }
    },
    cancel() { detach(); },
  });
}

// Fetch chunks may split a JSON line or a UTF-8 character at any position.
export async function readCheckStream(response, onEvent) {
  if (!response.body) throw new Error("Keine Antwort vom Server.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete = false;
  const consume = (line) => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "error") throw new Error(event.error);
    if (event.type === "complete") complete = true;
    onEvent(event);
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        consume(buffer.slice(0, index));
        buffer = buffer.slice(index + 1);
      }
      if (done || complete) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!complete) throw new Error("Verbindung unterbrochen – erneute Prüfung folgt.");
  } finally {
    // Cancellation can itself stall. It must not keep the polling lock held.
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Bound the whole exchange, including auth, response headers and stream reads.
 * A stalled connection must release the portal's in-flight lock for a retry.
 */
export async function requestCheck(filters, source, {
  signal, onEvent, page = 1, timeoutMs = 15_000, fetchImpl = fetch,
} = {}) {
  const controller = new AbortController();
  let timedOut = false;
  let rejectStopped;
  const stopped = new Promise((_, reject) => { rejectStopped = reject; });
  const cancel = () => {
    controller.abort();
    rejectStopped(new DOMException("Abgebrochen", "AbortError"));
  };
  if (signal?.aborted) throw new DOMException("Abgebrochen", "AbortError");
  signal?.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    cancel();
  }, timeoutMs);
  try {
    const exchange = (async () => {
      const response = await fetchImpl("/api/neue-angebote", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters, source, page, stream: true }),
      });
      if (controller.signal.aborted) throw new DOMException("Abgebrochen", "AbortError");
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const error = new Error(data?.error || `Fehler ${response.status}`);
        error.status = response.status;
        throw error;
      }
      await readCheckStream(response, (event) => {
        if (!controller.signal.aborted) onEvent(event);
      });
    })();
    await Promise.race([exchange, stopped]);
  } catch (error) {
    if (timedOut) throw new Error("Antwort dauert zu lange – erneute Prüfung folgt.");
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
