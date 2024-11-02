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

// TODO, use a queue to track unspoken text.
// Auto-combine unspoken text into one utterance call
// Track spoken state of each utterance, including those combined
