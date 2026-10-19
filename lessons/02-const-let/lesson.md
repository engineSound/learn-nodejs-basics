---
id: node-02-const-let
track: nodejs
title: const, let (and why not var)
topic: Variables
minutes: 6
concepts: [const, let, var, scope]
prereqs: [node-01-run-a-file]
contrast: java
edit: exercise.js
---

# const, let (and why not var)

## Learn the idea

JavaScript has three ways to declare a variable. Use **`const` by default**, `let` when the value must change, and **never `var`**.

| JavaScript | Java | Note |
|------|------|------|
| `const max = 100;` | `final int max = 100;` | can't be reassigned |
| `let count = 0;` | `int count = 0;` | can be reassigned |
| `var x` | none | old; ignores `{ }` blocks, avoid it |

There are no types in the declaration: a variable can hold any value. And `const` protects the *variable*, not the value: a `const` array can still grow.

```anatomy
{
 "title": "Anatomy of a declaration",
 "code": "const devices = [\"hall\", \"kitchen\"];",
 "parts": [
  {
   "text": "const",
   "kind": "keyword",
   "say": "Declares a variable that can't be reassigned. Block-scoped: it exists only inside the nearest `{ }`.",
   "java": "`final`"
  },
  {
   "text": "devices",
   "kind": "name",
   "say": "The name, in `camelCase` as in Java."
  },
  {
   "text": "=",
   "kind": "operator",
   "say": "Gives it its value. A `const` must get one right away."
  },
  {
   "text": "[",
   "kind": "symbol",
   "say": "Starts an array literal: a growable list.",
   "java": "`List.of(…)`, but changeable."
  },
  {
   "text": "\"hall\"",
   "kind": "literal",
   "say": "An element."
  },
  {
   "text": "]",
   "kind": "symbol",
   "say": "Ends the array."
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
let count = 0;
count += 1;
count += 1;
const devices = ["hall"];
devices.push("kitchen"); // allowed: the array changes, not the variable
console.log(count, devices);
try {
  devices = [];
} catch (err) {
  console.log(err.name + ": " + err.message);
}
```

## Quick check

```predict
const x = 1;
x = 2;
console.log(x);
---
options: 1 | 2 | throws TypeError
answer: throws TypeError
why: Reassigning a `const` throws `TypeError: Assignment to constant variable.`, at runtime, not at compile time.
```

```predict
const list = [1];
list.push(2);
console.log(list.length);
---
options: 1 | 2 | throws TypeError
answer: 2
why: `const` stops `list = …`, not changes *inside* the array.
```

## Your turn

- `totalMinutes(hours, minutes)` is written but **throws** a TypeError. Run it, read the message, and fix the declaration.
- `countdownLabel(seconds)`: write it. Put `"seconds left"` in a `const` named `text`, and return `` `${seconds} ${text}` ``.

## Example

```
totalMinutes(2, 15)    →  135
countdownLabel(30)     →  "30 seconds left"
```

## Hints

1. "Assignment to constant variable" points at `total`. Which keyword lets a variable be reassigned?
2. Change `const total` to `let total`.
3. For the label: `const text = "seconds left";` then `return `${seconds} ${text}`;`.

## Review

Tomorrow, explain when you would pick `let` over `const`, and why `var` is avoided.
