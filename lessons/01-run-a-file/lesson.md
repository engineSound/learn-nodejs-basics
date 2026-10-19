---
id: node-01-run-a-file
track: nodejs
title: Running a file: there is no main
topic: Entry point
minutes: 5
concepts: [entry-point, console-log, modules]
prereqs: []
contrast: java
edit: exercise.js
---

# Running a file: there is no main

## Learn the idea

Java starts at `public static void main`. **Node has no `main`**: the file you hand to `node` *is* the program, and it runs from the first line to the last.

| Java | Node.js |
|------|---------|
| `java App` runs `App.main(args)` | `node app.js` runs `app.js`, top to bottom |
| `System.out.println("Hi");` | `console.log("Hi");` |
| `args` | `process.argv` |
| `System.exit(1)` | `process.exit(1)` |

In a project, `package.json` says how to start it: `"scripts": { "start": "node app.js" }` makes `npm start` run that file. `"type": "module"` turns on modern `import`/`export` (lesson 09).

```anatomy
{
 "title": "Anatomy of a one-line program",
 "code": "console.log(\"Hello, device!\");",
 "parts": [
  {
   "text": "console",
   "kind": "name",
   "say": "A global object that is always there: no import needed. It writes to the terminal.",
   "java": "`System.out`"
  },
  {
   "text": ".",
   "kind": "operator",
   "say": "Member access: \"the `log` that belongs to `console`\".",
   "java": "Same as Java."
  },
  {
   "text": "log",
   "kind": "name",
   "say": "Prints its arguments, separated by spaces, then a newline.",
   "java": "`println`"
  },
  {
   "text": "(",
   "kind": "symbol",
   "say": "Starts the call's arguments."
  },
  {
   "text": "\"Hello, device!\"",
   "kind": "literal",
   "say": "A string. Single quotes, double quotes or backticks all make strings.",
   "java": "A `String` literal."
  },
  {
   "text": ")",
   "kind": "symbol",
   "say": "Ends the call."
  },
  {
   "text": ";",
   "kind": "symbol",
   "say": "Ends the statement. JavaScript inserts missing semicolons for you, but writing them avoids surprises.",
   "java": "Required in Java."
  }
 ]
}
```

Template literals use backticks and `${…}` to put values in text:

```run
console.log("Hello, device!");
const devices = 3;
console.log(`${devices} devices online`);
console.log("args:", process.argv.length);
```

## Quick check

```predict
console.log("A");

function helper() {
  console.log("B");
}
---
options: A | B | A then B
answer: A
why: The file runs top to bottom. `helper` is defined but never called.
```

```predict
console.log("door", 7);
---
options: door7 | door 7 | door,7
answer: door 7
why: `console.log` puts a space between its arguments.
```

## Your turn

`exercise.js` is a program. Make it print exactly these two lines when you run `node exercise.js`:

```
Hub starting
3 devices online
```

The checks run your file with `node` and compare what it prints.

## Example

```
$ node exercise.js
Hub starting
3 devices online
```

## Hints

1. Each `console.log(...)` prints one line.
2. Two calls, one after the other, at the top level of the file. No function needed.
3. `console.log("Hub starting");` and `console.log(`${3} devices online`);` (or just the plain text).

## Review

Tomorrow, write a two-line program in an empty file and run it with `node`, without looking.
