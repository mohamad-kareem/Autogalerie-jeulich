/** Reuse one audio context, unlocking it from a user click when necessary. */
export function createChime(getContext) {
  let context;
  return async () => {
    try {
      const Context = getContext();
      if (!Context) return false;
      if (!context || context.state === "closed") context = new Context();
      if (context.state !== "running") {
        let timer;
        try {
          await Promise.race([context.resume(), new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error("Audio blocked")), 1000);
          })]);
        } finally { clearTimeout(timer); }
      }
      if (context.state !== "running") return false;
      const now = context.currentTime;
      [880, 1320].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, now + index * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.16 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.16 + 0.3);
        oscillator.connect(gain).connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now + index * 0.16);
        oscillator.stop(now + index * 0.16 + 0.32);
      });
      return true;
    } catch { return false; }
  };
}

/** Foreground searches need desktop alerts too. Each ad gets its own tag. */
export function notifyArrivals(arrivals, { NotificationClass, formatPrice, onClick }) {
  if (!NotificationClass || NotificationClass.permission !== "granted") return false;
  for (const item of arrivals) {
    const note = new NotificationClass("Neues Fahrzeug gefunden!", {
      body: `${item.title}\n${formatPrice(item.price)}`,
      icon: item.image || undefined,
      tag: item.key,
      // The page controls sound independently; avoid a second OS sound.
      silent: true,
    });
    note.onclick = () => { onClick(item); note.close(); };
  }
  return true;
}
