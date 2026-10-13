import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during server rendering and hydration, true afterwards; used to gate portals to document.body. */
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
