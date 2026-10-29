# poema

This is the manual. It opens by itself the first time, and **alt+F1** brings it back in a new window whenever you want it. It opens as an untitled page: change it as much as you like, nothing you do here touches the real one.

## Writing

The page is markdown. Headings grow, *emphasis* and **bold** look like themselves, and the marks that make them (`#`, `*`, the backticks, the address of a [link](https://github.com/vivienne-cereja/poema)) step out of the way on every line except the one you're on.

Code blocks are coloured by their language, here and in the rendered view:

```ts
const verse = (line: string) => line.trim();
```

## Keys

| keys | what it does |
| --- | --- |
| ctrl+o | open a file |
| ctrl+s | save |
| ctrl+shift+s | save as another file |
| ctrl+shift+n | a new window with an empty page |
| ctrl+b | bold |
| ctrl+i | italic |
| ctrl+k | delete the line under the cursor |
| ctrl+e | source and rendered side by side |
| ctrl+shift+e | the rendered text in a window of its own |
| ctrl+shift+= / ctrl+shift+- | zoom in and out |
| ctrl+scroll | zoom in and out |
| ctrl+0 | back to the normal zoom |
| shift+alt+= / shift+alt+- | line height |
| ctrl+, | fonts for the editor, the rendered text and code |
| ctrl+f | find and replace |
| ctrl+z / ctrl+shift+z | undo, redo |
| alt+F1 | this manual, in a new window |

## From the terminal

`poema notes.md` opens straight into the file. A file that doesn't exist yet opens empty, and saving creates it. Several files open several windows.

## What it remembers

Zoom, line height and fonts are kept in `~/.config/poema/settings.json`, and come back the next time you open it.
