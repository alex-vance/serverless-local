import Serverless from "serverless";
import fetch from "node-fetch";
import execa from "execa";
import { NETCORE_31 } from "../supported-runtimes";
import { platform } from "os";
import { resolve } from "path";
import logger from "../logger";
import Logger from "../logger";

let nextAvailablePort = 4101;

const execaOptions: execa.Options = { /*stdout: "inherit"*/ }; //interleaves child process and serverless local process stout together.

export interface RuntimeApiOptions {
  providerRuntime: string | undefined;
}

export class RuntimeApi {
  functionDefinition: Serverless.FunctionDefinition;
  opt: RuntimeApiOptions;

  runtimeProcess: execa.ExecaChildProcess;
  baseUrl: string;

  constructor(functionDefinition: Serverless.FunctionDefinition, opt: RuntimeApiOptions) {
    this.functionDefinition = functionDefinition;
    this.opt = opt;

    this.init();
  }

  private init() {
    const runtime = this.functionDefinition.runtime || this.opt.providerRuntime;

    if (!runtime) return;

    this.runtimeProcess = this.runners[runtime](this.functionDefinition, nextAvailablePort);
    this.baseUrl = `http://localhost:${nextAvailablePort}`;

    nextAvailablePort++;
  }

  async invoke(path: string, event: any) {
    const body = JSON.stringify(event);
    const url = `${this.baseUrl}/${path}`;
    const result = await fetch(url, {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
    });

    let payload;

    if (result.body) {
      const text = await result.text();

      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = text;
      }
    }

    return { status: result.status, payload };
  }

  kill() {
    this.runtimeProcess && this.runtimeProcess.kill && this.runtimeProcess.kill("SIGKILL");
  }

  private async run_dotnetcore31(functionDefinition: Serverless.FunctionDefinition, runtimePort: Number): Promise<execa.ExecaChildProcess | undefined> {
    try {
      const env = { ...functionDefinition.environment, ASPNETCORE_URLS: `http://+:${runtimePort}` };
      const command = platform() === "win32" ? "dotnet.exe" : "dotnet";
      const handlerAndPath = JSON.stringify({ handler: functionDefinition.handler, artifact: functionDefinition.package.artifact });

      return await execa(command, [resolve(__dirname, `runtime-binaries/dotnetcore3.1/dotnetcore3.1.dll`), handlerAndPath], {
        ...execaOptions,
        env,
      });
    } catch (error) {
      logger.debug(`dotnetcore3.1 process failed to start for function '${functionDefinition.name}'`, error);
      return;
    }
  }
  private runners: any = {
    [NETCORE_31]: this.run_dotnetcore31,
  };
}
