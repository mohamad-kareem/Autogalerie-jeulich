// Shared within one server instance. The interval starts when work starts,
// not when it finishes, so a slow response does not add another cache delay.
export function createCheckPool({ intervalMs = 5_000, now = Date.now } = {}) {
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
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!complete) throw new Error("Verbindung unterbrochen – erneute Prüfung folgt.");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
