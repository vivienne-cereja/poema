import type { execute, query } from "#bus";
import type { Settings } from "#settings";

// what preload.mts hands to the pages, as the pages see it

export type Bridge = {
  execute: typeof execute,
  query: typeof query,
  on(channel: "settings", listener: (settings: Settings) => void): void,
  on(channel: "text", listener: (shown: { text: string, title: string }) => void): void,
  zoom(level: number): void,
  renderApart(): Promise<void>,
  show(text: string, title: string): void,
};

declare global {
  interface Window {
    poema: Bridge;
  }
}
