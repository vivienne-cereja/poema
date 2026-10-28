import { app, BrowserWindow } from "electron";

app.whenReady().then(() => {
  const janela = new BrowserWindow({ width: 900, height: 700, title: "poema" });
  janela.loadFile("src/index.html");
});

app.on("window-all-closed", () => app.quit());
