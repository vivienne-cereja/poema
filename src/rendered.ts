import { dress } from "./look.ts";
import { toHtml, whenLanguageArrives } from "./render.ts";

const page = document.querySelector<HTMLElement>("#rendered")!;
let text = "";

const draw = () => {
  page.innerHTML = toHtml(text);
};

window.poema.on("text", (shown) => {
  text = shown.text;
  document.title = `${shown.title} (rendered)`;
  draw();
});

whenLanguageArrives(draw);
await dress();
