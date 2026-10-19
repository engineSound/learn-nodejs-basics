---
id: node-07-objects-arrays
track: nodejs
title: Objects, arrays, spread and destructuring
topic: Object & array syntax
minutes: 7
concepts: [objects, arrays, destructuring, spread]
prereqs: [node-06-loops]
contrast: java
edit: exercise.js
---

# Objects, arrays, spread and destructuring

## Learn the idea

JavaScript builds data with **literals**, no class needed:

| JavaScript | Java |
|------|------|
| `const d = { name: "hall", online: true };` | a record or a `Map` |
| `d.name`, `d["name"]` | `d.name()`, `map.get("name")` |
| `const list = [1, 2, 3];` | `List.of(1, 2, 3)`, but changeable |
| `const { name, online } = d;` | (destructuring) take fields out into variables |
| `{ ...defaults, ...overrides }` | (spread) copy all fields; later ones win |
| `[...a, ...b]` | copy two lists into a new one |

Objects and arrays are passed **by reference**, as in Java: `const b = a;` makes a second name for the same object.

```anatomy
{
 "title": "Anatomy of destructuring",
 "code": "const { name, online = false } = device;",
 "parts": [
  {
   "text": "const",
   "kind": "keyword",
   "say": "Declares the new variables."
  },
  {
   "text": "{",
   "kind": "symbol",
   "say": "On the **left** of `=`, braces mean \"take these properties out\", not \"make an object\"."
  },
  {
   "text": "name",
   "kind": "name",
   "say": "Creates a variable `name` holding `device.name`.",
   "java": "`String name = device.name();`"
  },
  {
   "text": "online = false",
   "kind": "operator",
   "say": "A default, used when `device.online` is `undefined`."
  },
  {
   "text": "}",
   "kind": "symbol",
   "say": "End of the pattern."
  },
  {
   "text": "device",
   "kind": "name",
   "say": "The object being taken apart."
  }
 ]
}
```


```run
const device = { name: "hall", temp: 21.5 };
const { name, online = false } = device;
console.log(name, online, device["temp"]);
const defaults = { unit: "C", interval: 60 };
const settings = { ...defaults, interval: 10 };
console.log(settings);
const [first, ...rest] = [3, 9, 4];
console.log(first, rest);
```

## Quick check

```predict
const a = { x: 1 };
const b = a;
b.x = 2;
console.log(a.x);
---
options: 1 | 2 | undefined
answer: 2
why: `b` is another name for the same object, as with references in Java.
```

```predict
const { x, y = 5 } = { x: 1 };
console.log(x + y);
---
options: 1 | 6 | NaN
answer: 6
why: `y` is missing from the object, so its default 5 is used.
```

## Your turn

- `describe(device)`: use destructuring to get `name` and `online` (default `false`), and return `"hall is online"` or `"hall is offline"`.
- `withDefaults(settings)`: return a **new** object with `unit: "C"` and `interval: 60`, overridden by whatever `settings` contains. Don't change `settings`.

## Example

```
describe({ name: "hall", online: true })  →  "hall is online"
describe({ name: "attic" })               →  "attic is offline"
withDefaults({ interval: 10 })            →  { unit: "C", interval: 10 }
```

## Hints

1. `const { name, online = false } = device;` as the first line.
2. Then a template literal with a ternary: `` `${name} is ${online ? "online" : "offline"}` ``.
3. `return { unit: "C", interval: 60, ...settings };`: later properties win.

## Review

Tomorrow, destructure an array: `const [first, second] = …`, and swap two variables with it.
