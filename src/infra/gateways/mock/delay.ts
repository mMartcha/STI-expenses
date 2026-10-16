export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Latência simulada entre `min` e `max` ms. */
export function latency(min = 250, max = 700): Promise<void> {
  return delay(min + Math.random() * (max - min));
}
