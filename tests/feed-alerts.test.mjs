import test from "node:test";
import assert from "node:assert/strict";
import { createChime, notifyArrivals } from "../lib/feed/alerts.js";

test("desktop alerts work for active searches and preserve separate cars", () => {
  const notes = [];
  class Notification {
    static permission = "granted";
    constructor(title, options) { this.title = title; this.options = options; notes.push(this); }
    close() { this.closed = true; }
  }
  let clicked;
  const cars = [{ key: "KA:1", title: "Ford", price: 5000 }, { key: "AS:2", title: "BMW", price: 9000 }];
  assert.equal(notifyArrivals(cars, { NotificationClass: Notification,
    formatPrice: (price) => `${price} EUR`, onClick: (item) => { clicked = item; } }), true);
  assert.equal(notes.length, 2);
  assert.notEqual(notes[0].options.tag, notes[1].options.tag);
  assert.match(notes[0].options.body, /Ford\n5000 EUR/);
  notes[1].onclick();
  assert.equal(clicked, cars[1]);
  assert.equal(notes[1].closed, true);
  Notification.permission = "denied";
  assert.equal(notifyArrivals(cars, { NotificationClass: Notification }), false);
  assert.equal(notes.length, 2);
});

test("sound resumes suspended context before scheduling tones and reuses it", async () => {
  let context;
  let started = 0;
  let resumed = 0;
  class Context {
    constructor() { context = this; this.state = "suspended"; this.currentTime = 10; }
    async resume() { resumed++; this.state = "running"; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    createOscillator() { return { frequency: {}, connect: (gain) => gain, disconnect() {},
      start() { assert.equal(context.state, "running"); started++; }, stop() {} }; }
  }
  const play = createChime(() => Context);
  assert.equal(await play(), true);
  const first = context;
  assert.equal(await play(), true);
  assert.equal(context, first);
  assert.equal(resumed, 1);
  assert.equal(started, 4);
  context.state = "closed";
  assert.equal(await play(), true);
  assert.notEqual(context, first);
});

test("unsupported or rejected audio produces a visible-failure result", async () => {
  assert.equal(await createChime(() => undefined)(), false);
  class Blocked {
    state = "suspended";
    resume() { return Promise.reject(new Error("NotAllowedError")); }
    createOscillator() { assert.fail("must not queue inaudible tones"); }
  }
  assert.equal(await createChime(() => Blocked)(), false);
});
