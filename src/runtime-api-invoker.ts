import Serverless from "serverless";
import fetch from "node-fetch";
import logger from "./logger";
import { NETCORE_31 } from "./supported-runtimes";

export default class RuntimeApiInvoker {
  static async invokeRuntimeApi(runtime: string, req: any): Promise<any> {
    const invoke = this.invokers[runtime];

    return await invoke();
  }

  private static async invokeDotNetCore31RuntimeApi() {
    const result = await fetch("http://localhost:5000/invoke/execute-api", { method: "POST" });
    const json = await result.json();
    return ({ status: result.status, payload: json});
  }

  private static invokers: any = {
    [NETCORE_31]: RuntimeApiInvoker.invokeDotNetCore31RuntimeApi,
  };
}
