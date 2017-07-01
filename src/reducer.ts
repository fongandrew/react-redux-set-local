/*
  Reducer + action creator
*/
import { Action } from "redux";

export interface SetLocalAction<K = string, V = any> {
  type: string;

  /*
    Use this instead of type to decide what to do with our action.
    This lets the user override the "type" with something more useful
    for debugging / development purposes if they want.
  */
  __setLocal: K;
  __payload: V;
}

function isSetLocalAction(action: Action): action is SetLocalAction {
  return typeof (action as SetLocalAction).__setLocal === "string";
}

export interface SetLocalStoreState {
  [index: string]: any;
}

// Processes SetLocalActions
export function reducer<A extends Action>(
  state: SetLocalStoreState|undefined,
  action: A
): SetLocalStoreState {
  if (! state) return {};
  if (! isSetLocalAction(action)) return state;
  return {
    ...state,
    [action.__setLocal]: action.__payload
  };
}
