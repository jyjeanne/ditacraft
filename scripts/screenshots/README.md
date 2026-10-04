# Screenshots

`shoot.js` takes the screenshots of the visual editor and the visual preview used by the README
(`docs/images/`) and the DITA user guide (`docs/user-guide/images/`). It runs a real VS Code
window with DitaCraft on the demo project in `demo/`, so retake them after a change to the
editor's look.

```bash
npm run compile                                  # the extension as it will run
node scripts/screenshots/shoot.js                # every shot, into docs/images and docs/user-guide/images
node scripts/screenshots/shoot.js menu fix       # some of them
node scripts/screenshots/shoot.js --out=shots    # into ./shots only, to review before replacing
```

Needs Node 22 or later. A VS Code window opens for about two minutes: leave it alone while the
script clicks and types in it. If the guide's screenshots changed, rebuild the guide
(`docs/user-guide`, `gradlew html pdf`) so its HTML5 and PDF output include them.

## The shots

| Name | File | What it shows |
|---|---|---|
| `hero` | `visual-editor.png` | The page and the text editor side by side, cursors on the same word (the README's first image) |
| `properties` | `visual-editor-properties.png` | The DitaCraft side bar (DITA Explorer, Properties) and an image given by a key, selected: resize handle, its attributes |
| `menu` | `visual-editor-context-menu.png` | The right-click menu on selected words, **Wrap in** open |
| `table` | `visual-editor-table.png` | A column border being dragged, the guide showing the new widths |
| `reuse` | `visual-editor-reuse.png` | A reused note selected: **Open source**, **Replace with copy** |
| `fix` | `visual-editor-quick-fix.png` | An image without alternative text, its quick fix (Ctrl+.) |
| `link` | `visual-editor-link-picker.png` | The link target picker (Ctrl+K) |
| `map` | `visual-editor-map.png` | The demo map in the visual editor, its XML beside: rows with their topics' titles, keys and kinds; a row selected |
| `reltable` | `visual-editor-reltable.png` | The demo map's relationship table: a cell selected, **Relationship table ▸** open |
| `preview` | `visual-preview.png` | The text editor with the visual preview beside it |
| `flags` | `condition-highlighting.png` | The install task in the text editor with `filters/windows.ditaval` as the preview filter (other platforms dimmed; an audience, a revision and conditions the filter does not name flagged), its visual preview beside it |
| `dark` | `visual-editor-dark.png` | The page in a dark theme |

The window is 1400 × 860 at 150 % (the PNGs are 2100 pixels wide); shots of the page alone are
cropped to the editor. The VS Code theme is Default Dark Modern, the page light.

## The demo project

`demo/` is a small user guide for a fictional desktop sync client: a map with keys (the
product name, topics, a diagram), two topic heads and a relationship table, a task with steps for
each platform, an audience, a product and a revision, a reference with a CALS table, shared notices
reused by `conref`, and a DITAVAL filter (`filters/windows.ditaval`, for the `flags` shot).
`topics/sync-options.dita` has an image **without alternative text on purpose** — the `fix` shot
shows its problem and quick fix. The script works on a copy in the system's temporary
folder, so the files here are never changed.

## How it works

- `shoot.js` starts VS Code — the build the integration tests download into `.vscode-test/`, or
  the executable in `DITACRAFT_SHOTS_CODE` — with a fresh user data folder and settings, this
  repository as the extension under development, and remote debugging on port 9333
  (`DITACRAFT_SHOTS_PORT`). The native title bar keeps "[Extension Development Host]" out of the
  shots, and VS Code's own file dialog (`files.simpleDialog.enable`) lets the script pick the
  DITAVAL filter by typing its path.
- `driver/` is a tiny extension loaded next to DitaCraft: it runs the script's steps in the
  extension host (open a file in the visual editor, change a setting, run a command, revert the
  files), exchanged through files in the temporary folder. It does nothing unless the script
  started VS Code.
- `lib.js` speaks the Chrome DevTools Protocol to the window: it sets the window size, finds the
  webviews (each is a separate frame), clicks, drags and types with real input events — so menus,
  handles and the editor react as they do for a user — and captures the PNGs.

Between shots the script closes the editors, reverts any file a shot changed, and clears
notifications.
