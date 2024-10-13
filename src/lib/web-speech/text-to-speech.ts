export const speaker = {
  speak,
  stop,
};

function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}
function stop() {
  speechSynthesis.cancel();
}
