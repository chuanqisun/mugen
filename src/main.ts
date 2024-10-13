import "./main.css";

const textareaElement = document.querySelector("textarea") as HTMLTextAreaElement;
const canvasPane = document.getElementById("canvas-pane") as HTMLDivElement;

textareaElement.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    canvasPane.append("hello");
  }
});
