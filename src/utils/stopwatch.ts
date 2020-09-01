const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;
const getDiffInMs = (diff: any) => ((diff[0] * NS_PER_SEC + diff[1]) * MS_PER_NS).toFixed(2);

export function stopwatch() {
  const start = process.hrtime();
  return () => {
    const end = process.hrtime(start);
    return getDiffInMs(end);
  };
}
