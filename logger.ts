export default class Logger {
  static log(msg: string, ...params: any[]) {
    console.log(`[local]: ${msg}`, ...params);
  }

  static debug(msg: string, ...params: any[]) {
    if (typeof process.env.SLS_DEBUG !== "undefined") console.log(`[local]: ${msg}`, ...params);
  }
}
