import { expect } from "chai";
import { reducer, SetLocalAction } from "./reducer";

const makeAction = <K, V>(key: K, val: V): SetLocalAction<K, V> => ({
  type: "whatever",
  __setLocal: key,
  __payload: val
});

describe("reducer", () => {
  it("handles undefined state gracefully", () => {
    let state = reducer(undefined, { type: "@@INIT" });
    expect(state).to.deep.equal({});
  });

  it("ignores actions other our SetLocalAction", () => {
    let state = reducer({ dogs: 4 }, {
      type: "Hello",
      __payload: { cats: 5 }
    });
    expect(state).to.deep.equal({ dogs: 4 });
  });

  it("replaces keyed state without mutation", () => {
    let s1 = { dogs: 4, cats: 5 };
    let s2 = reducer(s1, makeAction("dogs", 5));
    expect(s1).to.deep.equal({ dogs: 4, cats: 5 });
    expect(s2).to.deep.equal({ dogs: 5, cats: 5 });
  });
});
