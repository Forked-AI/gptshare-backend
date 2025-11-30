function truncateString(str: string, maxLen: number): string {
  if (str.length > maxLen) {
    return str.slice(0, maxLen - 3) + "...";
  } else {
    return str;
  }
}
