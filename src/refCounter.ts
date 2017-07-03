/*
  Simple helper class for tracking references by key.
*/
export class RefCounter {
  constructor(public counts: Record<string, number> = {}) {}

  incr(key: string, count = 1) {
    let ret = this.counts[key] = (this.counts[key] || 0) + count;
    if (! ret) delete this.counts[key];
    return ret;
  }

  decr(key: string, count = 1) {
    return this.incr(key, -count);
  }
}
