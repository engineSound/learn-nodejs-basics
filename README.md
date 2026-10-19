# Node.js Basics

The bedrock of Node.js, one keyword at a time: what `const` means, where a
program starts, what each symbol in a line does. Same app as
[`learn-nodejs`](https://github.com/engineSound/learn-nodejs), with lessons that take code apart
token by token (tap a token to see what it means and its Java equivalent),
then a quick check, then a tiny exercise checked by real tests.

## Run it

```
npm start                # then open http://localhost:3002
```

It runs next to `learn-nodejs` (different port), so you can keep both open.
Optional AI tutor: put `ANTHROPIC_API_KEY` in `.env` (see `.env.example`), as in
`learn-nodejs`.

## Lessons

| # | Lesson | Keywords and symbols |
|---|--------|----------------------|
| 01 | Running a file: there is no main | `node file.js`, `console.log`, `package.json` scripts |
| 02 | const, let (and why not var) | `const`, `let`, `var`, block scope |
| 03 | Types and typeof | `number`, `string`, `undefined`, `null`, `typeof`, conversion |
| 04 | function, return and => | `function`, `return`, arrow functions, defaults |
| 05 | if, === and truthiness | `===` vs `==`, falsy values, `? :`, `??` |
| 06 | for, for…of, for…in and while | the four loops, `break`, `continue` |
| 07 | Objects, arrays, spread and destructuring | `{}`, `[]`, `...`, `const { a } = obj` |
| 08 | class, constructor, this and new | `class`, `#private`, `this`, `new`, `extends` |
| 09 | import, export and node: modules | `import`/`export`, default exports, `node:` built-ins |
| 10 | throw, try/catch, async and await | errors, Promises, `async`/`await` |

Every keyword and reserved word, with the lesson that covers it: [docs/KEYWORDS.md](docs/KEYWORDS.md).

## Docs

- [CLAUDE.md](CLAUDE.md): how lessons are written here
- [docs/SHARED-FORMAT.md](docs/SHARED-FORMAT.md): lesson and history formats (shared by all four learn-* repos)
- [PROGRESS.md](PROGRESS.md): your learning log and generated profile
