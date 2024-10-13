import { Subject } from "rxjs";

export interface SimpleRecognitionEvent {
  id?: string; // to be implemented
  text: string;
  isFinal: boolean;
}

export const $recognition = new Subject<SimpleRecognitionEvent>();
const recognition = new webkitSpeechRecognition();

// Prevent starting multiple sessions
let isStarted = false;
recognition.interimResults = true;

export const recognizer = {
  start,
  stop,
  abort,
};

function initSession() {
  isStarted = true;

  recognition.continuous = true;
  recognition.onstart = () => console.log("[recognition] session stated");
  recognition.onresult = (e) => {
    const latestItem = [...e.results].at(-1);
    if (!latestItem) return;
    $recognition.next({
      text: latestItem[0].transcript,
      isFinal: latestItem.isFinal,
    });
  };
  recognition.onerror = (e) => {
    console.error(`[recognition] sliently omit error`, e);
  };
  recognition.onend = () => {
    isStarted = false;
    recognition.stop();
    console.log("[recognition] session ended");
    if (recognition.continuous) initSession();
  };
}

function start() {
  if (isStarted) return;
  initSession();
  recognition.start();
}

function stop() {
  recognition.continuous = false;
  recognition.stop();
}

function abort() {
  recognition.continuous = false;
  recognition.abort();
}
