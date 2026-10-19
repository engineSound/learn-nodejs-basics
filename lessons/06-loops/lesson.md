---
id: node-06-loops
track: nodejs
title: for, for…of, for…in and while
topic: Loops
minutes: 7
concepts: [for, for-of, for-in, while, break, continue]
prereqs: [node-05-if-equality]
contrast: java
edit: exercise.js
---

# for, for…of, for…in and while

## Learn the idea

| JavaScript | Java | Use it for |
|------|------|------|
| `for (let i = 0; i < n; i++)` | same | counting |
| `for (const x of items)` | `for (var x : items)` | the **values** of an array, string, Map… |
| `for (const k in obj)` | none | the **keys** of an object (as strings). Not for arrays! |
| `while (cond)` / `do { } while (cond)` | same | repeating while something holds |

`break` and `continue` work as in Java. Arrays also have `forEach`, `map`, `filter` and `reduce`, which you'll use a lot; plain loops are clearer while learning.

```anatomy
{
 "title": "Anatomy of a for…of loop",
 "code": "for (const r of readings) {\n  total += r;\n}",
 "parts": [
  {
   "text": "for",
   "kind": "keyword",
   "say": "Starts a loop."
  },
  {
   "text": "const",
   "kind": "keyword",
   "say": "A fresh `r` for each round. `const` is fine: each round gets a new binding.",
   "java": "`var` in `for (var r : readings)`."
  },
  {
   "text": "r",
   "kind": "name",
   "say": "The current value."
  },
  {
   "text": "of",
   "kind": "keyword",
   "say": "Walk through the **values**. (`in` would give the keys: `\"0\"`, `\"1\"`… for an array.)",
   "java": "The `:` in Java's for-each."
  },
  {
   "text": "readings",
   "kind": "name",
   "say": "Anything iterable: arrays, strings, Maps, Sets."
  },
  {
   "text": "total += r",
   "kind": "operator",
   "say": "The body runs once per value."
  }
 ]
}
```


```run
for (let i = 0; i < 3; i++) process.stdout.write(`${i} `);
console.log();
for (const room of ["hall", "kitchen"]) console.log(room);
for (const key in { hall: 21, kitchen: 19 }) console.log("key:", key);
let n = 1;
while (n < 100) n *= 3;
console.log(n);
```

## Quick check

```predict
for (const i in ["a", "b"]) {
  console.log(i);
}
---
options: a b | 0 1 | undefined undefined
answer: 0 1
why: `for…in` walks the **keys**: for an array, the indexes as strings. Use `for…of` for values.
```

```predict
let s = 0;
for (let i = 1; i <= 5; i++) {
  if (i % 2 === 0) continue;
  s += i;
}
console.log(s);
---
options: 9 | 15 | 6
answer: 9
why: `continue` skips the even numbers: 1 + 3 + 5 = 9.
```

## Your turn

- `sumTo(n)`: 1 + 2 + … + n (0 for n = 0).
- `countOver(readings, limit)`: how many readings are **above** the limit. Use `for…of`.

## Example

```
sumTo(4)                          →  10
countOver([18, 25, 31, 22], 21)   →  3
```

## Hints

1. `let total = 0;` then a counting `for` loop from 1 to n.
2. For `countOver`: `let count = 0;` and `for (const r of readings) { … }`.
3. Inside: `if (r > limit) count++;`. Return the counter.

## Review

Tomorrow, write `countOver` with `filter(...).length` and compare.
