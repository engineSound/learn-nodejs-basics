---
id: node-09-import-export
track: nodejs
title: import, export and node: modules
topic: Modules
minutes: 7
concepts: [import, export, modules, built-ins]
prereqs: [node-08-class-this]
contrast: java
edit: exercise.js
---

# import, export and node: modules

## Learn the idea

Every file is a **module**. Nothing in it is visible outside unless it's **exported**, and other files must **import** it by path.

| JavaScript (ES modules) | Java |
|------|------|
| `export function f()`, `export const X = 1` | `public` |
| `import { f, X } from "./units.js";` | `import hub.units.*;`, but per file and with the `.js` extension |
| `export default round;` / `import round from "./units.js";` | one "main" export per file |
| `import { readFile } from "node:fs/promises";` | importing from the JDK |

`"node:…"` names are Node's built-in modules: `node:fs`, `node:path`, `node:http`, `node:test`… Older code uses `require(…)` (CommonJS); `"type": "module"` in `package.json` selects the modern `import` syntax.

```anatomy
{
 "title": "Anatomy of an import",
 "code": "import { readFile } from \"node:fs/promises\";",
 "parts": [
  {
   "text": "import",
   "kind": "keyword",
   "say": "Loads another module and gives names to some of its exports. Imports run before the rest of the file.",
   "java": "`import`"
  },
  {
   "text": "{ readFile }",
   "kind": "name",
   "say": "A **named** import: must match an `export` in that module exactly. Without braces you'd get the *default* export.",
   "java": "The class name in `import java.nio.file.Files;`."
  },
  {
   "text": "from",
   "kind": "keyword",
   "say": "Where it comes from."
  },
  {
   "text": "\"node:fs/promises\"",
   "kind": "literal",
   "say": "A built-in module (the `node:` prefix). Your own files use a relative path with the extension: `\"./units.js\"`."
  },
  {
   "text": ";",
   "kind": "symbol",
   "say": "Ends the statement."
  }
 ]
}
```


```run
import { join, extname } from "node:path";
import os from "node:os";

const file = join("logs", "hub.txt");
console.log(file, extname(file), typeof os.cpus);
```

## Quick check

```predict
import { join } from "node:path";
console.log(join("logs", "hub.txt"));
---
options: logs/hub.txt | logs hub.txt | undefined
answer: logs/hub.txt
why: `join` puts the path separator between the parts.
```

```predict
import { nope } from "node:path";
console.log("loaded");
---
options: loaded | undefined | throws SyntaxError
answer: throws SyntaxError
why: Named imports are checked before anything runs: "does not provide an export named 'nope'".
```

## Your turn

Next to your file is `units.js` (read it in the lesson folder, or trust this):

```js
export function toFahrenheit(c) { return c * 9 / 5 + 32; }
export default function round1(x) { return Math.round(x * 10) / 10; }
```

`hubReading` already uses both, but the file has **no imports**, so it throws `ReferenceError: toFahrenheit is not defined`. Add the import line(s), then export a constant `UNIT` equal to `"°F"`.

## Example

```
hubReading(21.3)   →  70.3
UNIT               →  "°F"
```

## Hints

1. `toFahrenheit` is a named export: `import { toFahrenheit } from "./units.js";`.
2. `round1` is the default export: no braces, and you choose the name. Both can go in one line: `import round1, { toFahrenheit } from "./units.js";`.
3. `export const UNIT = "°F";`.

## Review

Tomorrow, add a second named export to an imaginary `units.js` and import it from memory.
