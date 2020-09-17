"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
class Logger {
    static log(msg, ...params) {
        console.log(`${chalk_1.default.green("[local]:")} ${msg}`, ...params);
    }
    static logClear(msg, ...params) {
        this.clear();
        this.log(msg, ...params);
    }
    static debug(msg, ...params) {
        if (typeof process.env.SLS_DEBUG !== "undefined")
            console.log(`${chalk_1.default.yellow("[local]:")} ${msg}`, ...params);
    }
    static debugClear(msg, ...params) {
        this.clear();
        this.debug(msg, ...params);
    }
    static clear() {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }
}
exports.default = Logger;
