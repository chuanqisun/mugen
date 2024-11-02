import { RawMessageStreamEvent, TextDelta } from "@anthropic-ai/sdk/resources/messages.mjs";
import { Parser } from "htmlparser2";
import { concatMap, distinctUntilKeyChanged, filter, from, map, Observable, Subject, switchMap, tap, withLatestFrom } from "rxjs";
import { user } from "../../lib/message";
import { $promptSubmissions } from "../chat-input/submission";
import { $openai } from "../chat-provider/anthropic";
import { appendFile, endFileStreaming, readFile, startFileStreaming, writeFile } from "../file-system/file-system";

export const $rawPartialResponses = new Subject<{ runId: number; delta: string }>();

export const $runs = $promptSubmissions.pipe(
  withLatestFrom($openai),
  switchMap(([submission, openai]) =>
    openai.messages
      .create({
        stream: true,
        max_tokens: 1024,
        model: "claude-3-5-sonnet-latest",
        system: `Generate files based on user's goals or instructions. Wrap each file's content like this: <respond-file path="">...</respond-file>. No text allowed outside <respond-file> tags 

Requirement:
- Every <respond-file> tag must have a path with a meaningful filename and file extension.
- The text inside <respond-file> tag must use valid syntax in the file's language.
- Only use allowed file extensions: txt, markdown, html, yaml, css, js, ts, jsx, tsx, json, jsonl, ndjson.
- When writing code, entry function name must be \`main\`.
- Do NOT discuss your plan, unless asked by user.
- Do NOT explain your code or show examples, unless asked by user.
- If asked by user, respond with plan and explanation for code in separate <respond-file path="[filename].md"> tags.
- Do NOT use external libraries or frameworks, unless asked by user.
- Do NOT nest markdown blocks.
\`\`\``,
        messages: [user`${submission.prompt}`],
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

          // we must make sure the file exists before we announce streaming started
          $streamingStarts.next({ submissionId: submission.id, objectPath: partialResponse.objectPath! });
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

const $streamingStarts = new Subject<{ submissionId: number; objectPath: string }>();
export const $firstStreamingPathPerSubmission = $streamingStarts.pipe(
  distinctUntilKeyChanged("submissionId"),
  map(({ objectPath }) => objectPath)
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

export function parseHtmlStream(runId: number, rawStream: AsyncIterable<RawMessageStreamEvent>, options?: ParseHtmlStreamOptions): Observable<PartialResponse> {
  return new Observable<PartialResponse>((subscriber) => {
    let currentObjectPath: undefined | string = undefined;
    let shouldTrimStart = true; // trim whitespace immediately before tag inner html starts. This allows artifact to have a clean looking start
    const parser = new Parser({
      onopentag(name, attributes, isImplied) {
        if (name === "respond-file") {
          currentObjectPath = attributes.path ?? "raw.txt";
          subscriber.next({ runId, objectPath: currentObjectPath, isOpening: true });
          shouldTrimStart = true;
        } else {
          if (isImplied) return;
          const attributesString = Object.entries(attributes)
            .map(([key, value]) => `${key}="${value}"`)
            .join(" ");
          subscriber.next({ runId, objectPath: currentObjectPath, delta: `<${name}${attributesString.length ? ` ${attributesString}` : ""}>` });
        }
      },
      ontext(text) {
        if (shouldTrimStart) {
          text = text.trimStart();
          shouldTrimStart = !text; // keep trimming when text is empty
        }

        subscriber.next({ runId, objectPath: currentObjectPath, delta: text });
      },
      onclosetag(name, isImplied) {
        if (name === "respond-file") {
          subscriber.next({ runId, objectPath: currentObjectPath, isClosing: true });
          currentObjectPath = undefined;
        } else {
          if (isImplied) return;
          subscriber.next({ runId, objectPath: currentObjectPath, delta: `</${name}>` });
        }
      },
    });

    const sub = from(rawStream)
      .pipe(
        filter((chunk) => chunk.type === "content_block_delta"),
        map((chunk) => (chunk.delta as TextDelta)?.text),
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
