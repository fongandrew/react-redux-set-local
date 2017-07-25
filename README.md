react-redux-set-local
=====================
[![Build Status](https://travis-ci.org/fongandrew/react-redux-set-local.svg?branch=master)](https://travis-ci.org/fongandrew/react-redux-set-local)

Local Redux state in React without writing your own reducers.

Like `react-redux`, we use a higher-order component to connect a
presentational component with a specific portion of our Redux state.
Unlike `react-redux` (and some other prior attempts to create "local"
Redux state), rather than passing down a dispatch function, we pass down
a `setLocal` function that we can use to replace existing state.

Why?
----
[Redux](http://redux.js.org/)'s dispatch / action / reducer architecture makes
it easy to reason about complex state management. Plus the dev tools and
overall community support is fantastic.

However, Redux is overkill for state that's local to a specific component
(e.g. is this dropdown open?). Redux's state management is, by design,
independent of React's component architecture. Separating presentation logic
from your state management code is great, but a standard React-Redux
implementation (even using the helpful
[react-redux](https://github.com/reactjs/react-redux) library) still requires
a lot of glue code to hold everything together. Even simple state changes
require all of the the following:

- An action to represent changes to the component state
- A reducer to apply the action to our store state
- Code to hook the reducer to the store
- The React component itself
- Container code hooking up the React component to code that dispatches
  our actions

The simplest alternative to this is to just use React's `setState`
function. But this deprives us of Redux's dev tools and other benefits.

This is where `react-redux-set-local` comes in. This package provides a
way to connect an isolated portion of a Redux store's state to your component
while still maintaining separation between presentation and state management.

Installation
------------

`npm install react-redux-set-local --save` or
`yarn add react-redux-set-local`

Requires React and React-Redux as peer dependencies.


Basic Usage
-----------

Install `react-redux-set-local`

Use `combineReducers` to isolate a portion of your store for
`react-redux-set-local` and hook up the reducer.  By convention, we use the
`local` property on our Redux state.

```jsx
import { createStore, combineReducers } from "redux";
import { reducer } from "react-redux-set-local";

const store = createStore(combineReducers({
  local: reducer
}));
```

Then use the `connect` function to apply a function that takes

```jsx
import { connect } from "react-redux-set-local";

// Presentation (component)
const DogShow = (props) => <div>
  <div>
    <span id="dogs">
      {props.dogs} {props.color} dog{props.dogs === 1 ? "" : "s"}
    </span>
    <button id="woof" onClick={props.onWoof}>
      Woof
    </button>
  </div>
</div>;

// State management code
const mapToProps = (localState, setLocal, ownProps) => {
  localState = localState || { dogs: 0 }; // localState can be undefined
  return {
    ...ownProps,
    ...locals,
    onWoof: () => setLocal({ dogs: locals.dogs + 1 })
  };
};

export const Container = connect(mapToProps)(DogShow);
```

By default, `localState` is specific to a specific component instance. It may
be undefined (e.g. when the component first mounts).

The `setLocal` function simply replaces the existing state. Unlike React's
`setState`, it does not merge changes or provide callbacks.

Like in `react-redux`, `ownProps` refers to the props passed to the container
element.


Connect Factory
---------------
If you use something other than `local` with `combineReducers` for the reducer,
you should invoke `connectFactory` insetad of `connect`.

```jsx

import { createStore, combineReducers } from "redux";
import { reducer, connectFactory } from "react-redux-set-local";

const store = createStore(combineReducers({
  localState: reducer
}));

const connect = connectFactory("localState");
```

Explicit Keys
-------------
You can provide an explicit key string, or a function that returns key strings
from props to synchronize state between components.

```jsx

export const Container = connect(mapToProps, {
  key: (props) => props.color
})(DogShow);

...

let c1 = <Container color="blue" />; // Displays the same dog count as c2
let c2 = <Container color="blue" />; // Displays the same dog count as c1
let c3 = <Container color="red" />; // May display different dog count

```

By default, the local Redux state will clear when the container is unmounted,
but you can persist the state with the `persist` option:

```jsx
export const Container = connect(mapToProps, {
  key: (props) => props.color,
  persist: true
})(DogShow);
```

Customizing Action Types
------------------------

By default, calling a `setLocal` function dispatches the `SET_LOCAL` action.
You can customize the type used by passing a second, type string to the
`setLocal` function:

```js
setLocal({ dogs: locals.dogs + 1 }, "WOOF");
```

You can also specify default action types for a component when connecting:

```jsx
export const Container = connect(mapToProps, {
  updateType: "WOOF", // Type for explicit calls to `setLocal`
  unmountType: "BARK" // Type for when this component unmounts
})(DogShow);
```

NB: RRSL's reducer doesn't care about types here. It instead looks to the
presence of `__setLocal` and `__payload` properties on the action. Specifying
a type here is solely for the purpose of debugging or to help RRSL play nice
with other reducers or middleware.

----

Inspired by:
* https://github.com/FormidableLabs/freactal/
* https://github.com/threepointone/redux-react-local
* https://medium.com/@jeswin/implementing-redux-is-tedious-but-it-doesnt-have-to-be-33702a1fb1dd
