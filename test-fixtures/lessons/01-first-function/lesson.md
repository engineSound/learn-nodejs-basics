---
id: node-01-first-function
track: nodejs
title: Your first JavaScript function
topic: Functions & strings
minutes: 8
concepts: [functions, template-literals]
prereqs: []
contrast: java
edit: exercise.js
---

# Your first JavaScript function

## Learn the idea

You're building the backend for a small fleet of home devices: thermostats, batteries, sensors. Everything starts with functions.

In Java every method lives in a class and declares its types. In JavaScript a function can stand on its own, and nothing is typed:

| Java | JavaScript |
|------|-----------|
| `static String greet(String name) { … }` | `function greet(name) { … }` |
| `"Hi, " + name + "!"` | `` `Hi, ${name}!` `` (a *template literal*, with backticks) |
| `public` | `export` makes the function usable from other files |

Change the name below and press **Run**:

```visual
{
 "title": "What happens when you call a function",
 "intro": "Step through a call. Watch the argument go in and the result come back.",
 "regions": [
  {
   "id": "caller",
   "label": "Your code"
  },
  {
   "id": "fn",
   "label": "Inside greeting(name)"
  },
  {
   "id": "out",
   "label": "Console",
   "kind": "output"
  }
 ],
 "scenarios": [
  {
   "name": "Call and return",
   "group": "How it works",
   "code": "function greeting(name) {\n  return `Hello, ${name}!`;\n}\nconst text = greeting(\"Sam\");\nconsole.log(text);",
   "steps": [
    {
     "line": 4,
     "say": "Your code calls `greeting` with the argument `\"Sam\"`.",
     "rule": "Calling a function runs its body with the arguments you pass.",
     "set": [
      {
       "id": "call",
       "in": "caller",
       "title": "greeting(\"Sam\")",
       "tag": "calling",
       "state": "active"
      }
     ]
    },
    {
     "line": 1,
     "say": "The argument lands in the parameter `name`. No types anywhere: JavaScript doesn't check that it's a string.",
     "rule": "Parameters are local variables, filled in by the call.",
     "set": [
      {
       "id": "call",
       "state": "normal"
      },
      {
       "id": "name",
       "in": "fn",
       "title": "name",
       "value": "\"Sam\"",
       "tag": "parameter",
       "state": "active"
      }
     ],
     "arrows": [
      {
       "from": "call",
       "to": "name",
       "label": "\"Sam\"",
       "state": "accent"
      }
     ]
    },
    {
     "line": 2,
     "say": "The template literal builds a new string, putting the value of `name` where `${name}` is.",
     "rule": "Backticks make a template literal; `${ }` inserts any JavaScript value.",
     "set": [
      {
       "id": "name",
       "state": "normal"
      },
      {
       "id": "tpl",
       "in": "fn",
       "title": "`Hello, ${name}!`",
       "value": "\"Hello, Sam!\"",
       "tag": "new string",
       "state": "active"
      }
     ],
     "arrows": [
      {
       "from": "name",
       "to": "tpl",
       "state": "muted"
      }
     ]
    },
    {
     "line": 4,
     "say": "`return` hands the value back to the caller, where it's stored in `text`.",
     "rule": "A function gives back exactly what `return` gives.",
     "set": [
      {
       "id": "tpl",
       "state": "normal"
      },
      {
       "id": "call",
       "state": "faded",
       "tag": "done"
      },
      {
       "id": "text",
       "in": "caller",
       "title": "text",
       "value": "\"Hello, Sam!\"",
       "tag": "const",
       "state": "ok"
      }
     ],
     "arrows": [
      {
       "from": "tpl",
       "to": "text",
       "label": "return",
       "state": "ok",
       "style": "solid"
      }
     ]
    },
    {
     "line": 5,
     "say": "The function has finished: its local variables are gone. `text` keeps the result.",
     "rule": "Locals live only while the function runs.",
     "set": [
      {
       "id": "o1",
       "in": "out",
       "title": "Hello, Sam!"
      }
     ],
     "drop": [
      "name",
      "tpl"
     ],
     "arrows": [
      {
       "from": "text",
       "to": "o1",
       "state": "muted"
      }
     ]
    }
   ],
   "check": {
    "output": "Hello, Sam!"
   }
  },
  {
   "name": "Forgot return",
   "group": "What if it goes wrong",
   "code": "function greeting(name) {\n  `Hello, ${name}!`;\n}\nconst text = greeting(\"Sam\");\nconsole.log(text);",
   "steps": [
    {
     "line": 4,
     "say": "Your code calls `greeting` with the argument `\"Sam\"`.",
     "rule": "Calling a function runs its body with the arguments you pass.",
     "set": [
      {
       "id": "call",
       "in": "caller",
       "title": "greeting(\"Sam\")",
       "tag": "calling",
       "state": "active"
      }
     ]
    },
    {
     "line": 1,
     "say": "The argument lands in the parameter `name`. No types anywhere: JavaScript doesn't check that it's a string.",
     "rule": "Parameters are local variables, filled in by the call.",
     "set": [
      {
       "id": "call",
       "state": "normal"
      },
      {
       "id": "name",
       "in": "fn",
       "title": "name",
       "value": "\"Sam\"",
       "tag": "parameter",
       "state": "active"
      }
     ],
     "arrows": [
      {
       "from": "call",
       "to": "name",
       "label": "\"Sam\"",
       "state": "accent"
      }
     ]
    },
    {
     "line": 2,
     "say": "The template literal builds a new string, putting the value of `name` where `${name}` is.",
     "rule": "Backticks make a template literal; `${ }` inserts any JavaScript value.",
     "set": [
      {
       "id": "name",
       "state": "normal"
      },
      {
       "id": "tpl",
       "in": "fn",
       "title": "`Hello, ${name}!`",
       "value": "\"Hello, Sam!\"",
       "tag": "new string",
       "state": "active"
      }
     ],
     "arrows": [
      {
       "from": "name",
       "to": "tpl",
       "state": "muted"
      }
     ]
    },
    {
     "line": 2,
     "say": "The string is built… and thrown away. Nothing says `return`.",
     "rule": "An expression on its own line computes a value and discards it.",
     "set": [
      {
       "id": "tpl",
       "state": "bad",
       "tag": "discarded"
      }
     ],
     "arrows": []
    },
    {
     "line": 4,
     "say": "With no `return`, the function gives back `undefined`.",
     "rule": "No `return` means `undefined`. Java wouldn't compile this; JavaScript runs it.",
     "set": [
      {
       "id": "call",
       "state": "faded",
       "tag": "done"
      },
      {
       "id": "text",
       "in": "caller",
       "title": "text",
       "value": "undefined",
       "tag": "const",
       "state": "bad"
      }
     ],
     "arrows": [
      {
       "from": "call",
       "to": "text",
       "label": "undefined",
       "state": "bad",
       "style": "solid"
      }
     ]
    },
    {
     "line": 5,
     "say": "The program prints `undefined`: the bug only shows up at runtime.",
     "rule": "Tests catch this: that's why they call your function and check what it returns.",
     "set": [
      {
       "id": "o1",
       "in": "out",
       "title": "undefined",
       "state": "bad"
      }
     ],
     "drop": [
      "name",
      "tpl"
     ],
     "arrows": [
      {
       "from": "text",
       "to": "o1",
       "state": "bad"
      }
     ],
     "error": "Prints undefined instead of \"Hello, Sam!\""
    }
   ],
   "check": {
    "output": "undefined"
   }
  }
 ]
}
```

```run
function greet(name) {
  return `Hi, ${name}! Your thermostat is online.`;
}

console.log(greet("Ada"));
console.log(greet("Linus"));
```

## Quick check

```predict
const device = "kitchen sensor";
console.log(`Hello, ${device.toUpperCase()}`);
---
options: Hello, kitchen sensor | Hello, KITCHEN SENSOR | Hello, ${device.toUpperCase()}
answer: Hello, KITCHEN SENSOR
why: Anything inside `${ }` is evaluated as JavaScript, so you can call methods there too.
```

## Your turn

Every device greets its owner when it starts. Write `greeting(name)` so it **returns** (not prints) `"Hello, "` followed by the name and an exclamation mark.

## Example

```
greeting("Sam")  →  "Hello, Sam!"
```

## Hints

1. Start with `return` and a template literal: backticks, not quotes.
2. Inside the backticks, `${name}` puts the value of `name` into the text.
3. `` return `Hello, ${name}!`; `` is the whole body.

## Review

Tomorrow, solve this again without hints, then change the greeting to include the time of day.
