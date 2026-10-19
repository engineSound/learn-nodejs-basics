# JavaScript keywords

Every JavaScript keyword used in Node.js code, what it does, its Java
equivalent, and the lesson that teaches it. "Later" means `learn-nodejs`
covers it (or will).

## Used every day

| Keyword | What it does | Java | Lesson |
|---|---|---|---|
| `const` | declares a variable that can't be reassigned | `final` | 02 |
| `let` | declares a variable that can be reassigned | `int x =` | 02 |
| `var` | old, function-scoped variable: avoid | (none) | 02 |
| `typeof` | the type of a value, as a string | `instanceof`, `getClass()` | 03 |
| `null` | "deliberately empty" | `null` | 03 |
| `true` `false` | the two booleans | same | 03, 05 |
| `function` | defines a function | a method | 04 |
| `return` | gives back a value and leaves the function | same | 04 |
| `if` `else` | conditions | same | 05 |
| `switch` `case` `default` | picks a branch by value (uses `===`) | `switch` | 05 |
| `for` | counting loop; with `of` (values) or `in` (keys) | `for`, for-each | 06 |
| `of` | in `for (x of xs)`: the values | `:` in for-each | 06 |
| `in` | in `for (k in obj)`: the keys; `"k" in obj` checks a key | `containsKey` | 06 |
| `while` `do` | loops | same | 06 |
| `break` `continue` | leave the loop / skip to the next round | same | 06 |
| `class` | declares a class | same | 08 |
| `constructor` | the class's one constructor (a method name, not a keyword) | constructor | 08 |
| `this` | the object a method is called on (depends on the call!) | `this` | 08 |
| `new` | creates an object from a class | same | 08 |
| `extends` `super` | inheritance and the parent class | same | 08 |
| `static` | belongs to the class, not to objects | same | 08 |
| `import` `export` | share code between modules | `import`, `public` | 09 |
| `from` `as` | where an import comes from; renaming | (none) | 09 |
| `default` | a module's main export | (none) | 09 |
| `throw` | raises an error | same | 10 |
| `try` `catch` `finally` | handles errors | same (one `catch` for all) | 10 |
| `async` `await` | asynchronous functions and waiting on promises | `CompletableFuture` | 10 |

## Later (in `learn-nodejs`)

| Keyword | What it does | Java |
|---|---|---|
| `instanceof` | is this object made by that class? | same |
| `delete` | removes a property from an object | `map.remove` |
| `void` | evaluates something and gives `undefined` | (none) |
| `yield` | produces the next value from a generator (`function*`) | (none) |
| `get` `set` | getter/setter methods in a class or object | getters/setters |
| `debugger` | pauses here when a debugger is attached | a breakpoint |
| `with` | old, banned in modules | (none) |

## Reserved (not usable as names in modules)

`enum`, `implements`, `interface`, `package`, `private`, `protected`,
`public`: reserved for a future that never came.

## Not keywords, but look like them

- `undefined`, `NaN`, `Infinity`: global values (lesson 03).
- `console`, `process`, `globalThis`: global objects (lesson 01).
- `require`, `module.exports`: the older CommonJS module system (lesson 09).
- `main`: nothing special in Node: the file you run is the program (lesson 01).
