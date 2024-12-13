import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import z from "zod";

export type AppRouter = typeof appRouter;

const t = initTRPC.create();
const appRouter = t.router({
  run: t.procedure.input(z.string()).query(async (opts) => {
    const cmd = opts.input;
    console.log("run command", cmd);
  }),
});

const server = createHTTPServer({
  router: appRouter,
});

server.listen(3000);
