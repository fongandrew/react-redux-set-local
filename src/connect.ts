/*
  Function to connect a React component to a localized part of the Redux
  store. Similar to react-redux's connect funciton.
*/

import * as React from "react";
import { Dispatch } from "redux";
import { connect as rrConnect } from "react-redux";
import * as Config from "./config";
import { SetLocalAction } from "./reducer";

export type ComponentClass<P> = React.ComponentClass<P>;
export type StatelessComponent<P> = React.StatelessComponent<P>;
export type Component<P> = React.ComponentClass<P> | StatelessComponent<P>;
export interface ComponentDecorator<OwnProps, ToProps> {
    (component: Component<ToProps>): ComponentClass<OwnProps>;
}

/*
  Type for the setLocal function we pass to the connected React component.

  On face, similar to React's setState, but unlike React, we don't do
  partial updates (i.e. calling this function completely replaces the
  existing state rather than merging). This is because (a) it's pretty
  trivial for the component itself to do the merging and (b) there are
  scenarios where merging is undesired behavior (e.g. I want to replace
  a var altogether and don't want stray undefined keys lying around).

  Since we're using Redux as well (which is synchronous), we don't need
  setState's callback behavior or for the function to accept another
  function with the most recent state.

  Optionally takes a type string for Redux logging purposes
*/
export interface SetLocalFn<S> { (s: S, type?: string): void; }

// Type of a function that takes props and returns string for key in store
interface KeyFn<OwnProps> {
  (p: OwnProps): string;
}

/*
  Type for the function `connect` expects to map local state and setLocals to
  to props in the connected React component.
*/
export interface MapToPropsFn<S, ToProps, OwnProps> {
  (localState: S|undefined,
   setLocal: SetLocalFn<S>,
   ownProps: OwnProps): ToProps;
}

// Helper function to return a unique default key for a component class when
// none specified
let currentLocalKeyIndex = 0;
const getLocalKey = () => Config.LOCAL_KEY_PREFIX + (currentLocalKeyIndex++);

/*
  Creates a connect function for a given store key. By default, uses
  the DEFAULT_STORE_KEY.
*/
export const connectFactory = (storeKey?: string) => {
  function connect<S, ToProps, OwnProps>(
    localKey: string|((p: OwnProps) => string),
    mapToProps: MapToPropsFn<S, ToProps, OwnProps>,
  ): ComponentDecorator<OwnProps, ToProps>;
  function connect<S, ToProps, OwnProps>(
    mapToProps: MapToPropsFn<S, ToProps, OwnProps>
  ): ComponentDecorator<OwnProps, ToProps>;
  function connect<S, ToProps, OwnProps>(
    firstArg: string|KeyFn<OwnProps>|MapToPropsFn<S, ToProps, OwnProps>,
    secondArg?: MapToPropsFn<S, ToProps, OwnProps>
  ): ComponentDecorator<OwnProps, ToProps> {
    // De-overload params
    const mapToProps = secondArg ||
      firstArg as MapToPropsFn<S, ToProps, OwnProps>;
    const localKey = secondArg ?
      firstArg as string|KeyFn<OwnProps> :
      getLocalKey();
    const keyFn = (ownProps: OwnProps) => typeof localKey === "function" ?
      localKey(ownProps) : localKey;

    return rrConnect(
      // mapStateToProps
      (state: any, ownProps: OwnProps): { localState: S } => ({
        localState: (state || {})[
          storeKey || Config.DEFAULT_STORE_KEY
        ][keyFn(ownProps)]
      }),

      // mapDispatchToProps
      (dispatch: Dispatch<SetLocalAction<string, S>>, ownProps: OwnProps): {
        setLocal: SetLocalFn<S>
      } => ({
        setLocal: (newState: S, type?: string) => dispatch({
          type: type || Config.DEFAULT_ACTION_TYPE,
          __setLocal: keyFn(ownProps),
          __payload: newState
        })
      }),

      // mergeProps
      (stateProps, dispatchProps, ownProps: OwnProps) => mapToProps(
        stateProps.localState,
        dispatchProps.setLocal,
        ownProps
      ));
  }

  return connect;
};

export const connect = connectFactory();
