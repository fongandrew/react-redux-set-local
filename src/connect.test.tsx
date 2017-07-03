import * as React from "react";
import { expect } from "chai";
import { mount } from "enzyme";
import { createStore, combineReducers } from "redux";
import { Provider } from "react-redux";
import { connect, MapToPropsFn } from "./connect";
import { reducer } from "./reducer";

interface LocalState {
  dogs: number;
}

interface OwnProps {
  color: string;
}

interface Props extends LocalState, OwnProps {
  onWoof: () => void;
}

class ClsComponent extends React.Component<Props, {}> {
  render() {
    return StatelessComponent(this.props);
  }
}

const StatelessComponent = (props: Props) => <div>
  <div>
    <span id="dogs">
      {props.dogs} {props.color} dog{props.dogs === 1 ? "" : "s"}
    </span>
    <button id="woof" onClick={props.onWoof}>
      Woof
    </button>
  </div>
</div>;

const mapToProps: MapToPropsFn<LocalState, Props, OwnProps> = (
  localsParam,
  setLocal,
  ownProps
): Props => {
  let locals = localsParam || { dogs: 0 };
  return {
    ...ownProps,
    ...locals,
    onWoof: () => setLocal({ dogs: locals.dogs + 1 })
  };
};

const ClsContainer = connect(mapToProps)(ClsComponent);
const StatelessContainer = connect(mapToProps)(StatelessComponent);
const ColorContainer = connect(
  (p: OwnProps) => p.color,
  mapToProps,
)(StatelessComponent);

function getStore() {
  return createStore<any>(combineReducers({
    local: reducer
  }));
}

describe("Connect", () => {
  describe("with class-based component", () => {
    it("passes ownProps down", () => {
      let wrapper = mount(<Provider store={getStore()}>
        <ClsContainer color="blue" />
      </Provider>);
      expect(wrapper.find("#dogs").text()).to.equal("0 blue dogs");
    });

    it("passes updated local state down", () => {
      let store = getStore();
      let wrapper = mount(<Provider store={store}>
        <ClsContainer color="blue" />
      </Provider>);
      wrapper.find("button#woof").simulate("click");
      wrapper.find("button#woof").simulate("click");
      expect(wrapper.find("#dogs").text()).to.equal("2 blue dogs");
    });
  });

  // Isolate
  // Stores under correct key

  it("works", () => {
    getStore;
    ClsContainer;
    StatelessContainer;
    ColorContainer;
    expect(true).to.be.true;
  });
});
