"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;
const getDiffInMs = (diff) => ((diff[0] * NS_PER_SEC + diff[1]) * MS_PER_NS).toFixed(2);
function stopwatch() {
    const start = process.hrtime();
    return () => {
        const end = process.hrtime(start);
        return getDiffInMs(end);
    };
}
exports.stopwatch = stopwatch;
