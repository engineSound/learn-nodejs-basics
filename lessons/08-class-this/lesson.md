---
id: node-08-class-this
track: nodejs
title: class, constructor, this and new
topic: Classes
minutes: 8
concepts: [class, constructor, this, new, private-fields]
prereqs: [node-07-objects-arrays]
contrast: java
edit: exercise.js
---

# class, constructor, this and new

## Learn the idea

Classes look almost like Java, without types:

| JavaScript | Java |
|------|------|
| `class Lamp { … }` | `class Lamp { … }` |
| `constructor(x) { this.x = x; }` | `Lamp(int x) { this.x = x; }` (only one constructor) |
| `#on = false;` | `private boolean on = false;` |
| `static create() { … }` | `static Lamp create()` |
| `class Spot extends Lamp`, `super(…)` | same |

**`this` is always written**, and it depends on *how a method is called*: `lamp.toggle()` sets `this` to `lamp`, but a detached `const t = lamp.toggle; t()` has no `this` at all. Arrow functions don't have their own `this`; they use the surrounding one.

```anatomy
{
 "title": "Anatomy of a class",
 "code": "class Lamp {\n  #on = false;\n  toggle() {\n    this.#on = !this.#on;\n  }\n}",
 "parts": [
  {
   "text": "class",
   "kind": "keyword",
   "say": "Declares a class.",
   "java": "Same."
  },
  {
   "text": "Lamp",
   "kind": "name",
   "say": "Its name, in `PascalCase`."
  },
  {
   "text": "#on",
   "kind": "name",
   "say": "A **private field**: the `#` is part of the name. Outside the class, `lamp.#on` is a syntax error.",
   "java": "`private boolean on`"
  },
  {
   "text": "= false",
   "kind": "literal",
   "say": "Its starting value, set for every new object."
  },
  {
   "text": "toggle()",
   "kind": "name",
   "say": "A method: no `function` keyword inside a class.",
   "java": "`void toggle()`"
  },
  {
   "text": "this",
   "kind": "keyword",
   "say": "The object the method was called on. Required: a bare `#on` would not work.",
   "java": "`this`, which Java lets you leave out."
  },
  {
   "text": "!",
   "kind": "operator",
   "say": "Not."
  }
 ]
}
```


```run
class Lamp {
  #on = false;
  constructor(room) {
    this.room = room;
  }
  toggle() {
    this.#on = !this.#on;
    return this; // allows chaining
  }
  get label() {
    return `${this.room}: ${this.#on ? "on" : "off"}`;
  }
}

const lamp = new Lamp("hall");
lamp.toggle();
console.log(lamp.label, lamp instanceof Lamp);
```

## Quick check

```predict
class P {
  constructor(x) {
    this.x = x;
  }
  twice() {
    return this.x * 2;
  }
}
console.log(new P(7).twice());
---
options: 7 | 14 | NaN
answer: 14
why: `new P(7)` runs the constructor; `.twice()` reads `this.x`.
```

```predict
class Lamp {
  on = false;
  toggle() {
    this.on = !this.on;
  }
}
const t = new Lamp().toggle;
t();
---
options: nothing happens | the lamp turns on | throws TypeError
answer: throws TypeError
why: Called on its own, `t()` has no object, so `this` is `undefined` and `this.on` throws. Java method references don't lose their object this way.
```

## Your turn

Write the `Thermostat` class (it's exported already):

- `constructor(target)` stores the target as `this.target`.
- `raise(by)` adds `by` to the target.
- `needsHeat(reading)` is `true` when the reading is below the target.

## Example

```
const t = new Thermostat(20);
t.raise(1.5);        // t.target is now 21.5
t.needsHeat(19)      →  true
```

## Hints

1. `constructor(target) { this.target = target; }` inside the class.
2. `raise(by) { this.target += by; }`.
3. `needsHeat(reading) { return reading < this.target; }`.

## Review

Tomorrow, make `target` a private `#target` with a getter, and see what the checks say.
