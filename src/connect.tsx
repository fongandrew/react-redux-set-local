/*
  Function to connect a React component to a localized part of the Redux
  store. Similar to react-redux's connect funciton.
*/

import * as React from "react";
import { Dispatch } from "redux";
import { connect as rrConnect } from "react-redux";
import * as Config from "./config";
import { RefCounter } from "./refCounter";

// Helper types
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
export interface SetLocalFn<S> { (s: S|undefined, type?: string): void; }

/*
  Type for the function `connect` expects to map local state and setLocals to
  to props in the connected React component.
*/
export interface MapToPropsFn<S, ToProps, OwnProps> {
  (localState: S|undefined,
   setLocal: SetLocalFn<S>,
   ownProps: OwnProps): ToProps;
}

// Type of a function that takes props and returns string for key in store
export interface KeyFn<OwnProps> {
  (p: OwnProps): string;
}

export interface ConnectOpts<OwnProps> {
  /*
    Custom key for local state isolation -- can be a function that takes
    props and thereby allow "local" state shared across multiple component
    instances.
  */
  key?: string|KeyFn<OwnProps>;

  /*
    Should state persist after component unmount
  */
  persist?: boolean;

  /*
    Default types for dispatches by this component
  */
  updateType?: string;
  unmountType?: string;
}

// Helper function to return a unique default key for a component class when
// none specified
let currentLocalKeyIndex = 0;
const getInstanceKey = () => Config.LOCAL_KEY_PREFIX + (currentLocalKeyIndex++);

/*
  Creates a connect function for a given store key. By default, uses
  the DEFAULT_STORE_KEY.
*/
export const connectFactory = (storeKey?: string) => {
  function connect<S, ToProps, OwnProps>(
    mapToProps: MapToPropsFn<S, ToProps, OwnProps>,
    opts: ConnectOpts<OwnProps> = {}
  ): ComponentDecorator<OwnProps, ToProps> {
    /*
      Set up an object to track reference counts so we know when to de-persist
      Redux state.
    */
    const refCounts = new RefCounter();

    /*
      Call react-redux's connect with functions that add in Redux functions
      that our wrapper needs. Specify generics because typings don't seem
      to recognize factory functions all that well.
    */

    interface RState {
      localState?: S;
      keyFn: KeyFn<OwnProps>;
    }

    interface RDispatch {
      dispatch: Dispatch<any>;
    }

    interface WrapperProps {
      localKey: string;
      localState?: S;
      setLocal: SetLocalFn<S>;
      ownProps: OwnProps;
    }

    const withRedux = rrConnect<RState, RDispatch, OwnProps, WrapperProps>(

      /*
        mapStateToProps factory -- we use a factory because it lets us
        establish a key specific to a component instance if a prop-specific
        one isn't provided.
      */
      (initialState: any, ownProps: OwnProps) => {
        const instanceKey = opts.key || getInstanceKey();
        const keyFn = typeof instanceKey === "function" ?
          instanceKey : () => instanceKey;
        const thisStoreKey = storeKey || Config.DEFAULT_STORE_KEY;
        return (state: any, ownProps: OwnProps) => ({
          localState: (state || {})[thisStoreKey][keyFn(ownProps)],
          keyFn
        });
      },

      /*
        mapDispatchToProps -- just pass along. We'll hook up in mergeProps
        once we get keyFn from mapStateToProps factory.
      */
      (dispatch) => ({ dispatch }),

      // mergeProps
      (stateProps, dispatchProps, ownProps: OwnProps) => {
        const { localState, keyFn } = stateProps;
        const { dispatch } = dispatchProps;
        const localKey = keyFn(ownProps);
        const defaultType = opts.updateType || Config.DEFAULT_ACTION_TYPE;
        const setLocal = (newState: S, type?: string) => dispatch({
          type: type || defaultType,
          __setLocal: localKey,
          __payload: newState
        });
        return {
          localKey,
          localState,
          setLocal,
          ownProps
        };
      });

    /*
      Decorator function creates a wrapper component around the one we're
      targeting to handle mount / dismount behavior.
    */
    return (Comp: Component<ToProps>) => {
      class ConnectLocal extends React.Component<WrapperProps, {}> {
        render() {
          let { localState, setLocal, ownProps } = this.props;
          let props = mapToProps(localState, setLocal, ownProps);
          return <Comp {...props} />;
        }

        componentDidMount() {
          refCounts.incr(this.props.localKey);
        }

        componentDidUpdate(prevProps: WrapperProps) {
          let { localKey: oldKey } = prevProps;
          let { localKey } = this.props;
          if (localKey !== oldKey) {
            refCounts.incr(localKey);
            this.clearState(oldKey);
          }
        }

        componentWillUnmount() {
          this.clearState(this.props.localKey);
        }

        // Clean up old state if nothing is listening to it anymore
        private clearState(key: string) {
          if (!refCounts.decr(key) && !opts.persist) {
            let actionType = opts.unmountType || Config.UNMOUNT_ACTION_TYPE;
            this.props.setLocal(undefined, actionType);
          }
        }
      }
      return withRedux(ConnectLocal);
    };
  }

  return connect;
};

export const connect = connectFactory();
