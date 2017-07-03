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

function getStore() {
  return createStore<any>(combineReducers({
    local: reducer
  }));
}

describe("Connect", () => {
  const BaseTests = (Container: React.ComponentClass<OwnProps>) => {
    it("passes ownProps down", () => {
      let wrapper = mount(<Provider store={getStore()}>
        <Container color="blue" />
      </Provider>);
      expect(wrapper.find("#dogs").text()).to.equal("0 blue dogs");
    });

    it("passes updated local state down", () => {
      let store = getStore();
      let wrapper = mount(<Provider store={store}>
        <Container color="blue" />
      </Provider>);
      wrapper.find("button#woof").simulate("click");
      wrapper.find("button#woof").simulate("click");
      expect(wrapper.find("#dogs").text()).to.equal("2 blue dogs");
    });

    it("isolates local state when remounting a component", () => {
      let store = getStore();

      // First mount
      let wrapper = mount(<Provider store={store}>
        <Container color="blue" />
      </Provider>);
      wrapper.find("button#woof").simulate("click");
      wrapper.find("button#woof").simulate("click");

      // Second mount - treat like new component
      wrapper = mount(<Provider store={store}>
        <Container color="blue" />
      </Provider>);
      wrapper.find("button#woof").simulate("click");
      expect(wrapper.find("#dogs").text()).to.equal("1 blue dog");
    });
  };

  describe(
    "with class-based component",
    () => BaseTests(connect(mapToProps)(ClsComponent))
  );

  describe(
    "with stateless component",
    () => BaseTests(connect(mapToProps)(StatelessComponent))
  );

  describe("with a key function", () => {
    const getColorContainer = () => connect(
      (p: OwnProps) => p.color,
      mapToProps,
    )(StatelessComponent);

    it("synchronizes state across components with the same key", () => {
      const ColorContainer = getColorContainer();
      const store = getStore();

      // First mount
      let wrapper1 = mount(<Provider store={store}>
        <ColorContainer color="blue" />
      </Provider>);
      wrapper1.find("button#woof").simulate("click");

      // Second mount
      let wrapper2 = mount(<Provider store={store}>
        <ColorContainer color="blue" />
      </Provider>);
      wrapper2.find("button#woof").simulate("click");
      wrapper2.find("button#woof").simulate("click");

      expect(wrapper1.find("#dogs").text()).to.equal("3 blue dogs");
      expect(wrapper2.find("#dogs").text()).to.equal("3 blue dogs");
    });

    it("isolates state across components with different keys", () => {
      const ColorContainer = getColorContainer();
      const store = getStore();

      // First mount
      let wrapper1 = mount(<Provider store={store}>
        <ColorContainer color="blue" />
      </Provider>);
      wrapper1.find("button#woof").simulate("click");

      // Second mount
      let wrapper2 = mount(<Provider store={store}>
        <ColorContainer color="red" />
      </Provider>);
      wrapper2.find("button#woof").simulate("click");
      wrapper2.find("button#woof").simulate("click");

      expect(wrapper1.find("#dogs").text()).to.equal("1 blue dog");
      expect(wrapper2.find("#dogs").text()).to.equal("2 red dogs");
    });

    it("cleans up store on unmount by default", () => {
      const ColorContainer = getColorContainer();
      const store = getStore();
      let wrapper = mount(<Provider store={store}>
        <ColorContainer color="blue" />
      </Provider>);
      wrapper.find("button#woof").simulate("click");
      wrapper.unmount();
      expect(store.getState().local.blue).to.be.undefined;
    });

    it("cleans up store on unmount only after all instances unmounted", () => {
      const ColorContainer = getColorContainer();
      const store = getStore();

      // First mount
      let wrapper1 = mount(<Provider store={store}>
        <ColorContainer color="blue" />
      </Provider>);
      wrapper1.find("button#woof").simulate("click");

      // Second mount
      let wrapper2 = mount(<Provider store={store}>
        <ColorContainer color="blue" />
      </Provider>);
      wrapper2.find("button#woof").simulate("click");

      // Unmount first
      wrapper1.unmount();
      expect(store.getState().local.blue).to.deep.equal({ dogs: 2 });

      // Unmount second (all unmounted now)
      wrapper2.unmount();
      expect(store.getState().local.blue).to.be.undefined;
    });
  });
});
