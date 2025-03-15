# Self Modifying Program

## Design option 1

Design it using magic comments

```ts
console.log("hello world");

// @run -> the program will only run up to here

console.log("more output");
```

## Design option 2

Design it similar to a test running framework
How does the framework if something has changed?

```ts
import { checkpoint } from "lib-name";

console.log("hello world");

checkpoint; // output [d3acf80](./output.json)

console.log("more output");
```

Later, the program will use cached result prior to the checkpoint and continue from there.

```ts
import { checkpoint } from "lib-name";

console.log("hello world");

checkpoint; // output [d3acf80](./output.json)

console.log("more output");

checkpoint;
```

To track changes we would have to crawl the entire call graph, which is not feasible in js runtime.

```ts
const task1 = task(() => {});
checkpoint;
```

## Design option 3

Use markdown checklist as a flow control tool

```md
<!-- plan -->

- [ ] Search wikipedia for popular programming languages
```

Or use equivalent xml tree structure

```xml
<plan>
  <task status="new">Search wikipedia for popular programming languages</task>
</plan>
```

Compress HTML to a minimal syntax like query selectors

```txt
plan
  task[status=new]
    "Search wikipedia for popular programming languages"
```
