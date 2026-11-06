/**
 * Plays a precomputed simulation in (scaled) real time.
 * `t` is the current simulation time; `null` means "show the whole run, no cursor".
 * Respects prefers-reduced-motion by jumping straight to the end.
 */
export class Player {
  t = $state<number | null>(null);
  playing = $state(false);
  tEnd: number;
  speed: number;
  #raf = 0;

  constructor(tEnd: number, speed = 1) {
    this.tEnd = tEnd;
    this.speed = speed;
  }

  play() {
    this.stop();
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof requestAnimationFrame === 'undefined') { this.t = null; return; }
    const start = performance.now();
    this.playing = true;
    this.t = 0;
    const tick = (now: number) => {
      const t = ((now - start) / 1000) * this.speed;
      if (t >= this.tEnd) { this.t = null; this.playing = false; return; }
      this.t = t;
      this.#raf = requestAnimationFrame(tick);
    };
    this.#raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.playing = false;
    this.t = null;
  }

  /** Index into an evenly sampled array of `n + 1` points spanning [0, tEnd]. */
  index(n: number): number {
    const t = this.t ?? this.tEnd;
    return Math.max(0, Math.min(n, Math.round((t / this.tEnd) * n)));
  }
}

/** Run `fn` once, the first time `el` scrolls into view. */
export function onFirstView(el: Element, fn: () => void) {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { threshold: 0.5 });
  io.observe(el);
  return () => io.disconnect();
}
