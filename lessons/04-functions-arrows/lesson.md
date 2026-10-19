---
id: node-04-functions-arrows
track: nodejs
title: function, return and =>
topic: Functions
minutes: 6
concepts: [function, return, arrow-functions, defaults]
prereqs: [node-03-types-typeof]
contrast: java
edit: exercise.js
---

# function, return and =>

## Learn the idea

Two ways to write a function, both everywhere in Node code:

| JavaScript | Java |
|------|------|
| `function add(a, b) { return a + b; }` | `int add(int a, int b) { return a + b; }` |
| `const add = (a, b) => a + b;` | `BinaryOperator<Integer> add = (a, b) -> a + b;` |
| `function greet(name = "you")` | an overload `greet()` calling `greet("you")` |

No types, no overloading. A function without `return` returns `undefined`. An arrow with a body in `{ }` needs an explicit `return`; without braces, the expression *is* the result.

```anatomy
{
 "title": "Anatomy of an arrow function",
 "code": "const add = (a, b) => a + b;",
 "parts": [
  {
   "text": "const",
   "kind": "keyword",
   "say": "Arrow functions are values, stored in a variable like any other."
  },
  {
   "text": "add",
   "kind": "name",
   "say": "The name you call it by: `add(1, 2)`."
  },
  {
   "text": "=",
   "kind": "operator",
   "say": "Assigns the function to the name."
  },
  {
   "text": "(a, b)",
   "kind": "name",
   "say": "The parameters, without types. With exactly one parameter the parentheses are optional: `x => x * 2`.",
   "java": "`(a, b)` in a Java lambda."
  },
  {
   "text": "=>",
   "kind": "operator",
   "say": "The arrow: parameters on the left, body on the right.",
   "java": "`->`"
  },
  {
   "text": "a + b",
   "kind": "operator",
   "say": "No braces, so this expression is returned automatically.",
   "java": "Same as a Java expression lambda."
  },
  {
   "text": ";",
   "kind": "symbol",
   "say": "Ends the `const` statement."
  }
 ]
}
```


```run
function double(n) {
  return n * 2;
}
const clampTo100 = n => (n > 100 ? 100 : n);
const greet = (name = "you") => `hi ${name}`;
console.log(double(21), clampTo100(250), greet(), greet("Ada"));
```

## Quick check

```predict
const f = x => { x * 2 };
console.log(f(3));
---
options: 6 | undefined | throws TypeError
answer: undefined
why: With braces the body is a block, and a block needs `return`. Without it the result is `undefined`.
```

```predict
function g(a, b = 10) {
  return a + b;
}
console.log(g(1), g(1, 2));
---
options: 11 3 | 1 3 | NaN 3
answer: 11 3
why: `b` defaults to 10 when it isn't passed.
```

## Your turn

The file is empty: **write and export both functions yourself**. Until they exist the checks can't load (`SyntaxError: … does not provide an export named 'area'`), which is expected.

- `area(width, height)`: a `function` declaration that returns the product.
- `toSeconds(minutes)`: an **arrow** function stored in a `const`, minutes × 60.

Put `export` in front of each so the checks can import them.

## Example

```
area(3, 4)       →  12
toSeconds(2)     →  120
```

## Hints

1. `export function area(width, height) { … }`.
2. For the arrow: `export const toSeconds = (minutes) => …;`.
3. The bodies: `return width * height;` and `minutes * 60` (no braces, no return).

## Review

Tomorrow, rewrite `area` as an arrow and `toSeconds` as a `function`.
