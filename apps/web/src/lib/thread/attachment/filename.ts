export function truncateMiddle(filename: string, maxLength: number): string {
  if (filename.length <= maxLength) {
    return filename;
  }
  const halfLength = Math.floor((maxLength - 3) / 2);
  return `${filename.slice(0, halfLength)}...${filename.slice(-halfLength)}`;
}
