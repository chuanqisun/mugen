import { Parser } from "htmlparser2";
import { ChatCompletionChunk } from "openai/resources/index.mjs";
import { concatMap, distinctUntilKeyChanged, filter, from, map, Observable, Subject, switchMap, tap, withLatestFrom } from "rxjs";
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
          system`Respond in markdown based on user's instruction or goal. In addition, you can use <embed-code path=""></embed-code> tag to surround any code. No other elements are allowed.

Requirement:
- Every <embed-code> tag must have a path with a meaningful filename and file extension.
- The text inside <embed-code> tag must use valid syntax in the target language.
- Only use allowed file extensions: txt, md, html, yaml, css, js, ts, jsx, tsx, json, jsonl, ndjson.
- When writing code, entry function name must be \`main\`.
- Do NOT discuss your plan, unless asked by user.
- Do NOT explain your code or show examples, unless asked by user.
- If asked by user, respond with plan and explanation for code in separate <embed-code path="[filename].md"> tags.
- Do NOT use external libraries or frameworks, unless asked by user.
- When nexting markdown code blocks, use four backticks for the outer block and three for the inner.
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

export function parseHtmlStream(runId: number, rawStream: AsyncIterable<ChatCompletionChunk>, options?: ParseHtmlStreamOptions): Observable<PartialResponse> {
  return new Observable<PartialResponse>((subscriber) => {
    let currentObjectPath: undefined | string = undefined;
    let shouldTrimStart = true; // trim whitespace immediately before tag inner html starts. This allows artifact to have a clean looking start
    const parser = new Parser({
      onopentag(name, attributes, isImplied) {
        if (name === "embed-code") {
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
          const hasMoreSpace = !text;
          shouldTrimStart = !hasMoreSpace;
        }
        subscriber.next({ runId, objectPath: currentObjectPath, delta: text });
      },
      onclosetag(name, isImplied) {
        if (name === "embed-code") {
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
