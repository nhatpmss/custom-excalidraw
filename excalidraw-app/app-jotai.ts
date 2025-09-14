import { unstable_createStore } from "jotai";

export const appJotaiStore = unstable_createStore();

// Expose store to global window for actions to access
if (typeof window !== "undefined") {
  (window as any).appJotaiStore = appJotaiStore;
}
