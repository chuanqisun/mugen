import { Parser } from "htmlparser2";
import { ChatCompletionChunk } from "openai/resources/index.mjs";
import { concatMap, filter, from, map, Observable, Subject, switchMap, tap, withLatestFrom } from "rxjs";
import { system, user } from "../../lib/message";
import { $promptSubmissions } from "../chat-input/submission";
import { $openai } from "../chat-provider/openai";
import { appendFile, endFileStreaming, readFile, startFileStreaming, writeFile } from "../file-system/file-system";

export const $rawPartialResponses = new Subject<{ runId: number; delta: string }>();

export const $runs = $promptSubmissions.pipe(
  withLatestFrom($openai),
  switchMap(([submission, openai]) =>
    openai.chat.completions
      .create({
        stream: true,
        model: "gpt-4o-mini",
        messages: [
          system`Respond based on user's instruction or goal. Wrap your response in <response-file path=""></response-file> tags.

Requirement:
- Every <response-file> tag must have a path with a meaningful filename and file extension.
- Use valid file extensions. For example: txt, md, html, yaml, css, js, ts, jsx, tsx, json, jsonl, ndjson.
- When writing code, entry function name must be \`main\`.
- Do NOT discuss your plan, unless asked by user.
- Do NOT explain your code or show examples, unless asked by user.
- If asked by user, respond with plan and explanation for code in separate <response-file path="[filename].md"> tags.
- Do NOT use external libraries or frameworks, unless asked by user.
- Respond to general chat with markdown like this
<response-file path="[filename].md">
your reponse here...
</response-file>
\`\`\`
      `,
          user`${submission.prompt}`,
        ],
        temperature: 0,
      })
      .then((stream) => ({
        stream,
        submission,
      }))
  ),
  switchMap(({ stream, submission }) =>
    parseHtmlStream(submission.id, stream, {
      onRaw: (raw) => $rawPartialResponses.next({ runId: submission.id, delta: raw }),
    }).pipe(
      filter((partialResponse) => partialResponse.objectPath !== undefined),
      concatMap(async (partialResponse) => {
        if (partialResponse.isOpening) {
          await writeFile(partialResponse.objectPath!, "");
          await startFileStreaming(partialResponse.objectPath!);
        } else if (partialResponse.isClosing) {
          const file = await readFile(partialResponse.objectPath!);
          // trim after response ended
          // TODO run prettier
          await writeFile(partialResponse.objectPath!, (await file.file.text()).trim());
          await endFileStreaming(partialResponse.objectPath!);
        }

        if (partialResponse.delta) {
          await appendFile(partialResponse.objectPath!, partialResponse.delta);
        }
      })
    )
  )
);

export interface ParseHtmlStreamOptions {
  onRaw?: (raw: string) => void;
}

export interface PartialResponse {
  runId: number;
  delta?: string;
  objectPath?: string;
  scope?: string;
  isOpening?: boolean;
  isClosing?: boolean;
}

export function parseHtmlStream(runId: number, rawStream: AsyncIterable<ChatCompletionChunk>, options?: ParseHtmlStreamOptions): Observable<PartialResponse> {
  return new Observable<PartialResponse>((subscriber) => {
    let currentObjectPath: undefined | string = undefined;
    const parser = new Parser({
      onopentag(name, attributes) {
        if (name === "response-file") {
          currentObjectPath = attributes.path ?? "raw.txt";
          subscriber.next({ runId, objectPath: currentObjectPath, isOpening: true });
        } else {
          const attributesString = Object.entries(attributes)
            .map(([key, value]) => `${key}="${value}"`)
            .join(" ");
          subscriber.next({ runId, objectPath: currentObjectPath, delta: `<${name}${attributesString.length ? ` ${attributesString}` : ""}}>` });
        }
      },
      ontext(text) {
        subscriber.next({ runId, objectPath: currentObjectPath, delta: text });
      },
      onclosetag(name) {
        if (name === "response-file") {
          subscriber.next({ runId, objectPath: currentObjectPath, isClosing: true });
          currentObjectPath = undefined;
        } else {
          subscriber.next({ runId, objectPath: currentObjectPath, delta: `</${name}>` });
        }
      },
    });

    const sub = from(rawStream)
      .pipe(
        map((chunk) => chunk.choices[0].delta.content),
        filter(Boolean),
        tap({
          next: (chunk) => {
            parser.write(chunk), options?.onRaw?.(chunk);
          },
          finalize: () => parser.end(),
        })
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  });
}
