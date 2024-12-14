import cors from "@fastify/cors";
import { exec, spawn } from "child_process";
import Fastify from "fastify";
import { FastifySSEPlugin } from "fastify-sse-v2";

async function main() {
  const fastify = Fastify();
  fastify.register(cors);
  fastify.register(FastifySSEPlugin);

  fastify.post("/spawn", {}, (request, reply) => {
    const command = (request.body as any).command;
    const [programName, ...args] = command.split(" ");
    console.log({ programName, args });

    const proc = spawn(programName, args);
    proc.stdout.on("data", (data) => {
      const textData = data.toString();
      reply.sse({ data: textData });
    });
    proc.stderr.on("data", (data) => console.error(data.toString()));
    proc.on("error", (err) => console.error(err));
    proc.on("close", (_code) => {
      reply.sse({ event: "close" });
    });
  });

  fastify.post("/exec", {}, (request, reply) => {
    const command = (request.body as any).command;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        reply.sse({ event: "close" });
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      reply.sse({ data: stdout });
      reply.sse({ event: "close" });
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
