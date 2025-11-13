export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  console.log("ARRAY CHUNKING", arr, size);
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}