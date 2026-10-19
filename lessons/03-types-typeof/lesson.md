---
id: node-03-types-typeof
track: nodejs
title: Types and typeof
topic: Values & types
minutes: 6
concepts: [types, typeof, numbers, conversion]
prereqs: [node-02-const-let]
contrast: java
edit: exercise.js
---

# Types and typeof

## Learn the idea

Variables have no type in JavaScript; **values** do. There are only a few:

| `typeof` says | Values | Java |
|------|------|------|
| `"number"` | `42`, `3.5`, `NaN`, `Infinity` | `int`, `long`, `double`: all one type here |
| `"string"` | `"hi"`, `'hi'`, `` `hi` `` | `String` |
| `"boolean"` | `true`, `false` | `boolean` |
| `"undefined"` | `undefined`: "no value was given" | none |
| `"object"` | objects, arrays, and (a famous mistake) `null` | objects |
| `"function"` | functions | lambdas |
| `"bigint"` | `10n`: integers of any size | `BigInteger` |

Numbers are all 64-bit floats, so `7 / 2` is `3.5`. Convert explicitly with `Number("42")` and `String(42)`; `+` with a string **concatenates**.

```anatomy
{
 "title": "Anatomy of a type check",
 "code": "if (typeof reading === \"number\") {",
 "parts": [
  {
   "text": "if",
   "kind": "keyword",
   "say": "A condition (lesson 05)."
  },
  {
   "text": "typeof",
   "kind": "operator",
   "say": "Gives the type of a value as a string. It is an operator, not a function: no parentheses needed.",
   "java": "`instanceof`, or `x.getClass()`."
  },
  {
   "text": "reading",
   "kind": "name",
   "say": "The value being checked: it could hold anything."
  },
  {
   "text": "===",
   "kind": "operator",
   "say": "Strict equality: same type and same value. Always use it (lesson 05).",
   "java": "`equals` for strings, `==` for numbers."
  },
  {
   "text": "\"number\"",
   "kind": "literal",
   "say": "One of the type names `typeof` can return."
  },
  {
   "text": "{",
   "kind": "symbol",
   "say": "The block that runs when it matches."
  }
 ]
}
```


```run
console.log(typeof 42, typeof 3.5, typeof "hi", typeof undefined, typeof null);
console.log(7 / 2, 0.1 + 0.2);
console.log(Number("42") + 1, "42" + 1, Number("hello"));
console.log(Math.round(2.5), Math.floor(2.9), (3.14159).toFixed(2));
```

## Quick check

```predict
console.log(typeof null);
---
options: null | object | undefined
answer: object
why: A historical bug that can never be fixed: `typeof null` is `"object"`. Check for null with `=== null`.
```

```predict
console.log("5" + 3, "5" - 3);
---
options: 8 2 | 53 2 | 53 NaN
answer: 53 2
why: `+` with a string concatenates. `-` only works on numbers, so `"5"` is converted.
```

## Your turn

- `toPercent(raw)`: a sensor sends 0–255. Return the percentage, rounded to a whole number (128 → 50).
- `isNumber(value)`: `true` only for real numbers. Strings like `"5"` are not numbers, and neither is `NaN` ("not a number"), even though `typeof NaN` is `"number"`.

## Example

```
toPercent(255)   →  100
toPercent(128)   →  50
isNumber(5)      →  true
isNumber("5")    →  false
isNumber(NaN)    →  false
```

## Hints

1. `raw / 255 * 100` is already a float; `Math.round(…)` rounds it.
2. Start with `typeof value === "number"`.
3. Add `&& !Number.isNaN(value)`.

## Review

Tomorrow, predict `typeof []`, `typeof (() => 1)` and `"3" * "4"`, then check them in a run block.
