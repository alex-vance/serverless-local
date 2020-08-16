import Serverless from "serverless";
import fetch from "node-fetch";
import logger from "./logger";
import { NETCORE_31 } from "./supported-runtimes";
import ProxyIntegrationEvent from "./events/proxy-integration-event";

export default class RuntimeApiInvoker {
  static async invokeRuntimeApi(runtime: string, event: ProxyIntegrationEvent): Promise<any> {
    const invoke = this.invokers[runtime];

    return await invoke(event);
  }

  private static async invokeDotNetCore31RuntimeApi(event: ProxyIntegrationEvent) {
    const body = JSON.stringify(event);
    const result = await fetch("http://localhost:5000/invoke/execute-api", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });
    const payload = await result.text();
    return { status: result.status, payload };
  }

  private static invokers: any = {
    [NETCORE_31]: RuntimeApiInvoker.invokeDotNetCore31RuntimeApi,
  };
}
