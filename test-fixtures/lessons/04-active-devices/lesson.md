---
id: node-04-active-devices
track: nodejs
title: Pick active devices
topic: Arrays & objects
minutes: 8
concepts: [arrays, objects, array-methods, arrow-functions]
prereqs: [node-03-battery-low]
contrast: java
edit: exercise.js
---

# Pick active devices

## Learn the idea

The dashboard lists devices that are online. Devices arrive as an array of objects:

```
[{ name: "porch light", status: "online" }, { name: "garage door", status: "offline" }]
```

An **object literal** `{ name: "x" }` is like a small record you don't need a class for; read fields with `device.name`. Arrays have stream-like methods built in, and they're eager (no `.stream()` or `.collect()`):

| Java streams | JavaScript arrays |
|---|---|
| `.filter(d -> d.isOnline())` | `.filter(d => d.status === "online")` |
| `.map(Device::name)` | `.map(d => d.name)` |
| `.sorted()` | `.toSorted()` (returns a new array) |

Watch out: `.sort()` **changes the original array**, and without arguments it sorts as text.

```visual
{
 "title": "Watch the data flow through filter, map and sort",
 "intro": "Like a Java stream, but eager and with no `.stream()` or `.collect()`.",
 "scenarios": [
  {
   "name": "filter → map → sort",
   "group": "How it works",
   "regions": [
    {
     "id": "src",
     "label": "devices"
    },
    {
     "id": "f",
     "label": ".filter(online)"
    },
    {
     "id": "m",
     "label": ".map(name)"
    },
    {
     "id": "s",
     "label": ".toSorted()"
    }
   ],
   "code": "const names = devices\n  .filter(d => d.status === \"online\")\n  .map(d => d.name)\n  .toSorted();\nconsole.log(names);",
   "steps": [
    {
     "line": 1,
     "say": "Three devices, each a small object with `name` and `status`.",
     "rule": "An object literal `{ … }` is a quick record; no class needed.",
     "set": [
      {
       "id": "d1",
       "in": "src",
       "title": "{ porch light }",
       "tag": "online"
      },
      {
       "id": "d2",
       "in": "src",
       "title": "{ garage door }",
       "tag": "offline"
      },
      {
       "id": "d3",
       "in": "src",
       "title": "{ attic fan }",
       "tag": "online"
      }
     ]
    },
    {
     "line": 2,
     "say": "`filter` keeps the items where the arrow function returns `true`. The garage door is offline, so it stays behind.",
     "rule": "`filter` returns a **new** array; the original is untouched.",
     "set": [
      {
       "id": "d1",
       "in": "f",
       "state": "ok"
      },
      {
       "id": "d2",
       "state": "faded",
       "tag": "offline: dropped"
      },
      {
       "id": "d3",
       "in": "f",
       "state": "ok"
      }
     ]
    },
    {
     "line": 3,
     "say": "`map` turns each object into something else: here, its name.",
     "rule": "`map` returns a new array of the same length.",
     "set": [
      {
       "id": "d1",
       "in": "m",
       "title": "\"porch light\"",
       "tag": "string"
      },
      {
       "id": "d3",
       "in": "m",
       "title": "\"attic fan\"",
       "tag": "string"
      }
     ]
    },
    {
     "line": 4,
     "say": "`toSorted` returns a sorted copy: alphabetical for strings.",
     "rule": "Prefer `toSorted()`; plain `sort()` changes the array in place.",
     "set": [
      {
       "id": "s1",
       "in": "s",
       "title": "\"attic fan\"",
       "state": "ok"
      },
      {
       "id": "s2",
       "in": "s",
       "title": "\"porch light\"",
       "state": "ok"
      },
      {
       "id": "d1",
       "state": "faded"
      },
      {
       "id": "d3",
       "state": "faded"
      }
     ]
    },
    {
     "line": 5,
     "say": "Result: `[ 'attic fan', 'porch light' ]`. `devices` itself never changed."
    }
   ],
   "check": {
    "prelude": "const devices = [{ name: \"porch light\", status: \"online\" }, { name: \"garage door\", status: \"offline\" }, { name: \"attic fan\", status: \"online\" }];",
    "output": "[ 'attic fan', 'porch light' ]"
   }
  },
  {
   "name": "sort changes the original",
   "group": "What if it goes wrong",
   "regions": [
    {
     "id": "vars",
     "label": "Variables"
    },
    {
     "id": "heap",
     "label": "Arrays in memory"
    }
   ],
   "code": "const names = [\"porch\", \"attic\"];\nconst sorted = names.sort();\nconsole.log(names);",
   "check": {
    "output": "[ 'attic', 'porch' ]"
   },
   "steps": [
    {
     "line": 1,
     "say": "`names` refers to an array in memory, like a Java reference.",
     "rule": "Variables hold references to arrays and objects, not copies.",
     "set": [
      {
       "id": "names",
       "in": "vars",
       "title": "names",
       "tag": "reference",
       "state": "ok"
      },
      {
       "id": "arr",
       "in": "heap",
       "title": "[\"porch\", \"attic\"]",
       "tag": "array"
      }
     ],
     "arrows": [
      {
       "from": "names",
       "to": "arr",
       "state": "ok"
      }
     ]
    },
    {
     "line": 2,
     "say": "`sort()` sorts **that same array** in place and returns it. No copy is made.",
     "rule": "`sort`, `reverse` and `splice` change the array they're called on.",
     "set": [
      {
       "id": "arr",
       "title": "[\"attic\", \"porch\"]",
       "state": "bad",
       "tag": "changed!"
      },
      {
       "id": "sorted",
       "in": "vars",
       "title": "sorted",
       "tag": "same array",
       "state": "active"
      }
     ],
     "arrows": [
      {
       "from": "names",
       "to": "arr",
       "state": "bad"
      },
      {
       "from": "sorted",
       "to": "arr",
       "state": "accent"
      }
     ]
    },
    {
     "line": 3,
     "say": "So `names` is sorted too. If a caller passed you `names`, you just changed their data.",
     "rule": "Use `toSorted()` (or `[...names].sort()`) to leave the original alone.",
     "error": "The original array was reordered"
    }
   ]
  },
  {
   "name": "[10, 9, 1].sort()",
   "group": "What if it goes wrong",
   "regions": [
    {
     "id": "in",
     "label": "Before"
    },
    {
     "id": "cmp",
     "label": "Compared as text"
    },
    {
     "id": "outp",
     "label": "After sort()"
    }
   ],
   "code": "console.log([10, 9, 1].sort());",
   "check": {
    "output": "[ 1, 10, 9 ]"
   },
   "steps": [
    {
     "line": 1,
     "say": "Three numbers.",
     "set": [
      {
       "id": "a",
       "in": "in",
       "title": "10"
      },
      {
       "id": "b",
       "in": "in",
       "title": "9"
      },
      {
       "id": "c",
       "in": "in",
       "title": "1"
      }
     ]
    },
    {
     "line": 1,
     "say": "Without a compare function, `sort` turns every item into **text** first.",
     "set": [
      {
       "id": "a",
       "in": "cmp",
       "title": "\"10\""
      },
      {
       "id": "b",
       "in": "cmp",
       "title": "\"9\""
      },
      {
       "id": "c",
       "in": "cmp",
       "title": "\"1\""
      }
     ]
    },
    {
     "line": 1,
     "say": "As text, \"10\" comes before \"9\" (it starts with \"1\").",
     "rule": "For numbers, pass a compare function: `sort((a, b) => a - b)`.",
     "set": [
      {
       "id": "x1",
       "in": "outp",
       "title": "1"
      },
      {
       "id": "x2",
       "in": "outp",
       "title": "10",
       "state": "bad"
      },
      {
       "id": "x3",
       "in": "outp",
       "title": "9",
       "state": "bad"
      }
     ],
     "drop": [
      "a",
      "b",
      "c"
     ],
     "error": "Sorted as text: [1, 10, 9]"
    }
   ]
  }
 ]
}
```

```run
const devices = [
  { name: "porch light", status: "online" },
  { name: "garage door", status: "offline" },
  { name: "attic fan", status: "online" },
];
const names = devices.filter(d => d.status === "online").map(d => d.name);
console.log(names);
console.log(names.toSorted());
```

## Quick check

```predict
const n = [10, 9, 1];
n.sort();
console.log(n);
---
options: [ 1, 9, 10 ] | [ 1, 10, 9 ] | [ 10, 9, 1 ]
answer: [ 1, 10, 9 ]
why: Without a compare function, `sort` compares values as text, and "10" comes before "9". For numbers use `sort((a, b) => a - b)`. And `n` itself was changed.
```

## Your turn

Write `activeDeviceNames(devices)`: return the **names** of the devices whose status is `"online"`, **sorted alphabetically**. Don't change the array you're given.

## Example

```
activeDeviceNames([
  { name: "porch light", status: "online" },
  { name: "garage door", status: "offline" },
  { name: "attic fan", status: "online" },
])  →  ["attic fan", "porch light"]
```

## Hints

1. Chain three steps: `filter`, then `map`, then sort.
2. `filter` keeps devices where `d.status === "online"`; `map` turns each into `d.name`.
3. Use `.toSorted()` (or sort *after* `map`, which already made a new array) so the input isn't changed.

## Review

Tomorrow, solve this again, then sort by name length instead.
