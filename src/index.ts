export {
  SetLocalAction,
  SetLocalStoreState,
  reducer
} from "./reducer";

export {
  SetLocalFn,
  MapToPropsFn,
  ConnectOpts,
  connectFactory,
  connect
} from "./connect";

import * as ConfObject from "./config";
export const Config = ConfObject;
