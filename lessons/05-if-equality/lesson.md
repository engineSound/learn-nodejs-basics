---
id: node-05-if-equality
track: nodejs
title: if, === and truthiness
topic: Conditions
minutes: 6
concepts: [if, equality, truthiness, ternary]
prereqs: [node-04-functions-arrows]
contrast: java
edit: exercise.js
---

# if, === and truthiness

## Learn the idea

`if`, `else`, `&&`, `||`, `!` and `? :` work as in Java. Two things don't:

**1. Use `===`, never `==`.** `==` converts types first (`0 == ""` is `true`). `===` compares type and value. For strings, `===` compares the text: no `.equals` needed.

**2. Any value can be a condition.** These are *falsy*: `false`, `0`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy, including `"0"` and `[]`. So `if (level)` is false for a level of 0, which is often a bug.

`a ?? b` gives `b` only when `a` is `null` or `undefined` (not when it's 0).

```anatomy
{
 "title": "Anatomy of a condition",
 "code": "if (level < 20 && !charging) {",
 "parts": [
  {
   "text": "if",
   "kind": "keyword",
   "say": "Runs the block when the condition is truthy.",
   "java": "Same, but Java requires a `boolean`."
  },
  {
   "text": "(",
   "kind": "symbol",
   "say": "Parentheses around the condition are required, as in Java."
  },
  {
   "text": "level < 20",
   "kind": "operator",
   "say": "A comparison: `true` or `false`."
  },
  {
   "text": "&&",
   "kind": "operator",
   "say": "And. It actually returns one of its operands (`0 && x` is `0`), which is truthy or falsy as expected."
  },
  {
   "text": "!",
   "kind": "operator",
   "say": "Not: turns truthy into `false` and falsy into `true`."
  },
  {
   "text": "charging",
   "kind": "name",
   "say": "A boolean flag, or anything truthy/falsy."
  },
  {
   "text": "{",
   "kind": "symbol",
   "say": "The block."
  }
 ]
}
```


```run
const level = 0;
console.log(level == "", level === "");
if (level) console.log("never printed: 0 is falsy");
console.log(level ? "has charge" : "empty", level ?? 50, level || 50);
const mode = "eco";
console.log(mode === "eco" ? 18 : 21);
```

## Quick check

```predict
console.log(0 == "", 0 === "");
---
options: true true | true false | false false
answer: true false
why: `==` turns `""` into 0 first. `===` sees a number and a string: not equal.
```

```predict
const n = 0;
console.log(n ? "yes" : "no", n ?? 5);
---
options: no 0 | yes 0 | no 5
answer: no 0
why: 0 is falsy, so the ternary says "no". `??` only replaces `null`/`undefined`, so 0 stays.
```

## Your turn

- `status(level, charging)`: `"charging"` when charging; otherwise `"low"` under 20, else `"ok"`.
- `isValid(level)`: a whole number from 0 to 100 inclusive. `"50"` (a string) and `50.5` are not valid.

## Example

```
status(10, true)   →  "charging"
status(10, false)  →  "low"
isValid(0)         →  true
isValid("50")      →  false
```

## Hints

1. Check `charging` first, then `level < 20`.
2. `Number.isInteger(level)` is `false` for strings and for `50.5`.
3. `Number.isInteger(level) && level >= 0 && level <= 100`.

## Review

Tomorrow, list the six falsy values from memory.
