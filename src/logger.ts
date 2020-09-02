import chalk from "chalk";

export default class Logger {
  static log(msg: string, ...params: any[]) {
    console.log(`${chalk.green("[local]:")} ${msg}`, ...params);
  }

  static logClear(msg: string, ...params: any[]) {
    this.clear();
    this.log(msg, ...params);
  }

  static debug(msg: string, ...params: any[]) {
    if (typeof process.env.SLS_DEBUG !== "undefined") console.log(`${chalk.yellow("[local]:")} ${msg}`, ...params);
  }

  static debugClear(msg: string, ...params: any[]) {
    this.clear();
    this.debug(msg, ...params);
  }

  private static clear() {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }
}
