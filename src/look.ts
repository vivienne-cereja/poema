import type { Settings } from "#settings";

// every page wears the same settings the same way: fonts and line height as
// css variables, zoom as chromium's own

export let current: Settings | undefined;

const wear = (settings: Settings) => {
  current = settings;
  const style = document.documentElement.style;
  style.setProperty("--editor-font", `"${settings.editorFont}"`);
  style.setProperty("--rendered-font", `"${settings.renderedFont}"`);
  style.setProperty("--code-font", `"${settings.codeFont}"`);
  style.setProperty("--line-height", String(settings.lineHeight));
  window.poema.zoom(settings.zoom);
};

export const dress = async () => {
  window.poema.on("settings", wear);
  const settings = await window.poema.query("settings", {});
  if (settings.was === "answered") wear(settings.answer);
};
