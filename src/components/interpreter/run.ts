import { EMPTY, endWith, filter, from, map, Observable, switchMap, tap, withLatestFrom } from "rxjs";
import { system, user } from "../../lib/message";
import { $promptSubmissions } from "../chat-input/submission";
import { $openai } from "../chat-provider/openai";

export const $runs = $promptSubmissions.pipe(
  withLatestFrom($openai),
  switchMap(([input, openai]) =>
    openai.chat.completions.create({
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
        user`${input}`,
      ],
      temperature: 0,
    })
  ),
  switchMap((stream) =>
    from(stream).pipe(
      map((chunk) => chunk.choices[0].delta.content),
      endWith("\0")
    )
  ),
  filter(Boolean),
  tap((textChunk) => {
    console.log(textChunk);
  })
);

export interface PartialResponse {
  runId: number;
  delta?: string;
  objectPath?: string;
}
export function getPartialResponses(runId: number, rawStream: AsyncIterable<string>): Observable<PartialResponse> {
  return EMPTY;
}
