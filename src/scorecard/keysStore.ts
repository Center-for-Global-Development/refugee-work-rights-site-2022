// isCardKeyOpen lived in the global Vuex store (not the URL); a module-level
// store reproduces that: shared by the toolbar buttons and the panel, persists
// across map/list switches, resets on hard navigation.
import { useSyncExternalStore } from 'react';

const subscribers = new Set<() => void>();
let open = false;

function set(value: boolean) {
  open = value;
  subscribers.forEach((fn) => fn());
}

export const showCardKey = () => set(true);
export const hideCardKey = () => set(false);

export function useCardKeyOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    () => open,
    () => open,
  );
}
