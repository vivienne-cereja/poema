# poema

A markdown editor, made by Vivienne and Leo.

## Install

Download `poema-<version>-linux-x64.tar.gz` from the [releases](https://github.com/vivienne-cereja/poema/releases), and unpack it wherever you keep applications:

```sh
tar xzf poema-<version>-linux-x64.tar.gz
cd poema-<version>-linux-x64
ln -s "$PWD/poema" ~/.local/bin/poema
cp poema.desktop ~/.local/share/applications/
cp poema.png ~/.local/share/icons/hicolor/512x512/apps/
```

## Keys

| keys | what it does |
| --- | --- |
| ctrl+o | open a file |
| ctrl+s | save |
| ctrl+shift+s | save as another file |
| ctrl+shift+n | a new window with an empty page |
| ctrl+e | source and rendered side by side |
| ctrl+shift+e | the rendered text in a window of its own |
| ctrl+shift+= / ctrl+shift+- | zoom in and out |
| shift+alt+= / shift+alt+- | line height |
| ctrl+, | fonts for the editor, the rendered text and code |

Zoom, line height and fonts are kept in `~/.config/poema/settings.json`.

## From the source

```sh
npm install
npm start
npm run release   # builds release/poema-<version>-linux-x64.tar.gz
```
