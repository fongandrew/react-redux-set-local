import { expect } from "chai";
import { RefCounter } from "./refCounter";

describe("refCounter", () => {
  it("incrs by 1 for a key and returns current value after incr", () => {
    let counter = new RefCounter();
    expect(counter.incr("key1")).to.equal(1);
    expect(counter.incr("key1")).to.equal(2);
    expect(counter.incr("key2")).to.equal(1);
  });

  it("decrs by 1 for a key and returns current value after incr", () => {
    let counter = new RefCounter({ key1: 3, key2: 3 });
    expect(counter.decr("key1")).to.equal(2);
    expect(counter.decr("key1")).to.equal(1);
    expect(counter.decr("key2")).to.equal(2);
  });

  it("deletes key from counts property if 0", () => {
    let counter = new RefCounter();
    counter.incr("key1");
    counter.incr("key2");
    counter.decr("key1");
    expect(counter.counts).to.deep.equal({ key2: 1 });
  });
});