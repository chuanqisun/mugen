import cors from "@fastify/cors";
import { spawn } from "child_process";
import Fastify from "fastify";
import { FastifySSEPlugin } from "fastify-sse-v2";

let shell = spawn("sh");

async function main() {
  const fastify = Fastify();
  fastify.register(cors);
  fastify.register(FastifySSEPlugin);

  fastify.post("/stdin", {}, (request, reply) => {
    const command = (request.body as any).command;
    shell.stdin.write(command);
  });

  fastify.get("/stdout", {}, (request, reply) => {
    const handleData = (data: any) => {
      reply.sse({ data: data.toString() });
    };

    shell.stdout.on("data", handleData);

    shell.on("close", () => {
      console.log("shell closed!");
    });

    shell.on("error", (err) => {
      console.error(err);
      console.log("shell error!");
    });

    request.raw.on("close", () => {
      shell.stdout.off("data", handleData);
    });
  });

  try {
    await fastify.listen({ port: 3000 });

    console.log("mugen server running on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
