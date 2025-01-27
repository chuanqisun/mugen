export async function openDirectory() {
  const results = await window.showDirectoryPicker();
  console.log("picked", results);
}
