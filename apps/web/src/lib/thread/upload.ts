export async function getOneTimeUpload(): Promise<File[]> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "*/*";
  input.multiple = true;
  input.style.display = "none";
  document.body.appendChild(input);

  return new Promise<File[]>((resolve) => {
    input.addEventListener("change", () => {
      const files = [...(input.files ?? [])];
      document.body.removeChild(input);
      resolve(files);
    });
    input.click();
  });
}
