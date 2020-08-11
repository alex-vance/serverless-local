import execa from "execa";
import Serverless from "serverless";
import logger from "./logger";
import { NETCORE_31 } from "./supported-runtimes";
import { platform } from "os";
import { resolve } from "path";

export interface RuntimeServerOptions {
  providerRuntime?: string | undefined;
}

export default class RuntimeServer {
  private readonly opt: RuntimeServerOptions;
  private readonly functions: Serverless.FunctionDefinition[];
  private readonly childProcesses: execa.ExecaChildProcess[] = [];

  constructor(opt: RuntimeServerOptions, functions: Serverless.FunctionDefinition[]) {
    this.opt = opt;
    this.functions = functions;
  }

  async begin() {
    let runtimes: string[] = this.functions.filter((f) => f.runtime).map((f) => f.runtime as string);

    if (!runtimes.length && this.opt.providerRuntime) runtimes.push(this.opt.providerRuntime);

    if (!runtimes) {
      logger.log("no runtimes specified");
      return;
    }

    runtimes.forEach(async (r) => {
      logger.log(`starting ${r} process`);
      const process = await this.runners[r](this.functions);

      this.childProcesses.push(process);
    });
  }

  is_ready(): boolean {
    // this.childProcesses.forEach(c => {
    //   c.connected
    // })

    return true;
  }

  // it's the responsibility of the runtime-api to extract and read the packaged artifact
  private async run_dotnetcore31(functions: Serverless.FunctionDefinition[]): Promise<execa.ExecaChildProcess | undefined> {
    try {
      const command = platform() === "win32" ? "dotnet.exe" : "dotnet";
      const handlerAndPaths = functions
        .filter((f) => f.runtime === NETCORE_31)
        .map((f) => {
          //return `${f.handler}|${f.package.artifact}`;
          return `${f.handler}`;
        });
      return await execa(command, [resolve(__dirname, `runtime-apis/dotnetcore3.1/bin/Debug/netcoreapp3.1/dotnetcore3.1.dll`), ...handlerAndPaths]);
    } catch (error) {
      logger.log('error!', error);
      return;
    }
  }

  private runners: any = {
    [NETCORE_31]: this.run_dotnetcore31,
  };
}
