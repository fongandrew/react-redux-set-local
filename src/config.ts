/*
  Globals we use to control default behavior. Can be altered, although
  there's probably some way to get what you want without doing so.
*/

/* tslint:disable:no-var-keyword */

// Prefix for local state keys when none specified
export var LOCAL_KEY_PREFIX = "redux-local-key-";

// Default type for a SetLocalAction
export var DEFAULT_ACTION_TYPE = "SET_LOCAL";

// Where in store state connect function should look for local state
export var DEFAULT_STORE_KEY = "local";
