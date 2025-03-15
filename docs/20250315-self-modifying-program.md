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
