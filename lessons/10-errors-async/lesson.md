---
id: node-10-errors-async
track: nodejs
title: throw, try/catch, async and await
topic: Errors & async
minutes: 8
concepts: [throw, try-catch, async, await]
prereqs: [node-09-import-export]
contrast: java
edit: exercise.js
---

# throw, try/catch, async and await

## Learn the idea

**Errors** look like Java's exceptions, with no checked exceptions and no types in `catch`:

| JavaScript | Java |
|------|------|
| `throw new Error("bad level");` | `throw new IllegalArgumentException("bad level");` |
| `try { … } catch (err) { … } finally { … }` | same, but one `catch` gets everything |
| `err.message`, `err.name` | `getMessage()`, the class name |

**Async:** Node does I/O without blocking its single thread. A function marked `async` always returns a **Promise** (like a `CompletableFuture`). Inside it, `await` pauses *that function* until a promise settles: a rejected promise becomes a thrown error, so `try/catch` works with `await`.

```anatomy
{
 "title": "Anatomy of async error handling",
 "code": "async function load(read) {\n  try {\n    const text = await read();\n    return JSON.parse(text);\n  } catch (err) {\n    throw new Error(`bad config: ${err.message}`);\n  }\n}",
 "parts": [
  {
   "text": "async",
   "kind": "keyword",
   "say": "This function returns a Promise, and may use `await` inside.",
   "java": "A method returning `CompletableFuture<…>`."
  },
  {
   "text": "function load(read)",
   "kind": "name",
   "say": "An ordinary declaration otherwise."
  },
  {
   "text": "try",
   "kind": "keyword",
   "say": "Run this block; if anything throws, jump to `catch`.",
   "java": "Same."
  },
  {
   "text": "await",
   "kind": "keyword",
   "say": "Wait for the promise from `read()` without blocking Node. If it rejects, the error is thrown right here.",
   "java": "`future.join()`, but other work keeps running meanwhile."
  },
  {
   "text": "return",
   "kind": "keyword",
   "say": "Resolves the function's promise with this value."
  },
  {
   "text": "catch (err)",
   "kind": "keyword",
   "say": "Catches anything thrown above. No type: check `err` yourself if needed.",
   "java": "`catch (Exception err)`"
  },
  {
   "text": "throw",
   "kind": "keyword",
   "say": "Rejects the function's promise with a new error."
  },
  {
   "text": "new Error",
   "kind": "type",
   "say": "The standard error type; `.message` holds the text.",
   "java": "`new RuntimeException(…)`"
  }
 ]
}
```


```run
function parseLevel(text) {
  const n = Number(text);
  if (!Number.isInteger(n)) throw new Error(`bad level: ${text}`);
  return n;
}

try {
  console.log(parseLevel("42"));
  console.log(parseLevel("lots"));
} catch (err) {
  console.log("caught:", err.message);
} finally {
  console.log("done");
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function slowReading() {
  await wait(50);
  return 21.5;
}
console.log(await slowReading());
```

## Quick check

```predict
try {
  null.x;
} catch (e) {
  console.log(e.name);
} finally {
  console.log("done");
}
---
options: TypeError done | done | NullPointerException done
answer: TypeError done
why: Reading a property of `null` throws a `TypeError`; `finally` runs either way.
```

```predict
async function f() {
  return 1;
}
console.log(typeof f(), await f());
---
options: number 1 | object 1 | object undefined
answer: object 1
why: An `async` function always returns a Promise (an object). `await` unwraps it to 1.
```

## Your turn

- `parseLevel(text)`: return the whole number in `text`. If it isn't one, **throw** an `Error` with the message `"bad level: <text>"`.
- `safeLevel(read)`: `read` is an async function that returns text. `await` it, parse the result with `parseLevel`, and return the number; if **anything** fails (reading or parsing), return `-1` instead.

## Example

```
parseLevel("42")                    →  42
parseLevel("lots")                  →  throws Error("bad level: lots")
await safeLevel(async () => "7")    →  7
await safeLevel(async () => "x")    →  -1
```

## Hints

1. `const n = Number(text);` then check `Number.isInteger(n)`; if not, `throw new Error(`bad level: ${text}`);`.
2. `safeLevel` must be `async` so it can `await read()`.
3. Wrap both steps in `try { return parseLevel(await read()); } catch { return -1; }`.

## Review

Tomorrow, make `read` fail with `async () => { throw new Error("offline"); }` and trace what `safeLevel` does.
