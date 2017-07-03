react-redux-set-local
=====================
Local Redux state in React without writing your own reducers.

Like `react-redux`, we use a higher-order component to connect a
presentational component with a specific portion of our Redux state.
Unlike `react-redux` (and some other prior attempts to create "local"
Redux state), rather than passing down a dispatch function, we pass down
a `setLocal` function that we can use to replace existing state.

**Work in progress. Somewhat functional but not yet published on NPM.**

Why?
----
Redux's dispatch / action / reducer architecture make it easy to reason
about complex state management. Plus the dev tools and overall community
support is fantastic.

However, Redux does not work particularly well with state that's local to a
specific component (e.g. is this dropdown open?). Redux's state management is,
by design, independent of React's component architecture, so to handle even
simple state changes in Redux, we have to write the following:

- An action to represent changes to the component state
- A reducer to apply component
- Code to hook the reducer
- The React component itself
- Container code hooking up the React component to code that dispatches
  our actions

The simplest alternative to this is to just use React's `setState`
function. But this deprives us of Redux's dev tools and other benefits.

This is where `react-redux-set-local` comes in. This package provides a
way to connect an isolated portion of a Redux store's state to your component
while still maintaining separation between presentation and state management.


Basic Usage
-----------

Use `combineReducers` to isolate a portion of your store for
`react-redux-set-local` and hook up the reducer.  By convention, we use the
`local` property on our Redux state.

```js
import { createStore, combineReducers } from "redux";
import { reducer } from "react-redux-set-local";

const store = createStore(combineReducers({
  local: reducer
}));
```

Then use the `connect` function to apply a function that takes

```js
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

```js

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

```js

export const Container = connect(
  mapToProps,
  (props) => props.color
)(DogShow);

...

let c1 = <Container color="blue" />; // Displays the same dog count as c2
let c2 = <Container color="blue" />; // Displays the same dog count as c1
let c3 = <Container color="red" />; // May display different dog count

```

----

Inspired by:
* https://github.com/threepointone/redux-react-local
* https://medium.com/@jeswin/implementing-redux-is-tedious-but-it-doesnt-have-to-be-33702a1fb1dd