import execa from "execa";
import Serverless from "serverless";
import logger from "./logger";
import { NETCORE_31 } from "./supported-runtimes";
import { platform } from "os";
import { resolve } from "path";

export interface RuntimeServerOptions {
  providerRuntime?: string | undefined;
}

const execaOptions: execa.Options = { stdout: "inherit" }; //interleaves child process and serverless local process stout together.

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
      const child: execa.ExecaChildProcess = await this.runners[r](this.functions, this.opt.providerRuntime);

      this.childProcesses.push(child);
    });
  }

  is_ready(): boolean {
    // this.childProcesses.forEach(c => {
    //   c.connected
    // })

    return true;
  }

  // it's the responsibility of the runtime-api to extract and read the packaged artifact
  private async run_dotnetcore31(functions: Serverless.FunctionDefinition[], providerRuntime: string): Promise<execa.ExecaChildProcess | undefined> {
    try {
      const command = platform() === "win32" ? "dotnet.exe" : "dotnet";
      const handlerAndPaths = functions
        .filter((f) => f.runtime === NETCORE_31 || (!f.runtime && providerRuntime === NETCORE_31))
        .map((f) => {
          return JSON.stringify({ handler: f.handler, artifact: f.package.artifact });
        });
      return await execa(
        command,
        [resolve(__dirname, `runtime-apis/dotnetcore3.1/bin/Debug/netcoreapp3.1/dotnetcore3.1.dll`), ...handlerAndPaths],
        execaOptions
      );
    } catch (error) {
      logger.log("error launching dotnetcore3.1 process", error);
      return;
    }
  }

  private runners: any = {
    [NETCORE_31]: this.run_dotnetcore31,
  };
}
