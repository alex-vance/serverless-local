import LocalServer from "./local-server";
import * as Serverless from "serverless";
import { getFunctions } from "./utils";
import { HTTP_LISTENER, SUPPORTED_LISTENERS, Listener } from "./supported-listeners";
import logger from "./logger";

interface ServerlessLocalCommands {}
interface ServerlessLocalHooks {}

interface ServerlessLocalOptions extends Serverless.Options {
  message: string;
}

class ServerlessLocal {
  private sls: Serverless;
  private opt: ServerlessLocalOptions;
  private localsvr: LocalServer;

  public commands: ServerlessLocalCommands;
  public hooks: ServerlessLocalHooks;

  constructor(sls: Serverless, opt: ServerlessLocalOptions) {
    this.sls = sls;
    this.opt = opt;

    this.commands = {
      local: {
        commands: {
          start: {
            usage: "Starts local instances of AWS services that invoke your lambda functions.",
            lifecycleEvents: ["begin", "wait", "end"],
          },
        },
        usage: "Starts local instances of AWS services that invoke your lambda functions.",
      },
    };

    this.hooks = {
      "local:start:begin": this.begin.bind(this),
      "local:start:wait": this.wait.bind(this),
      "local:start:end": this.end.bind(this),
    };
  }

  async begin() {
    logger.log("starting local server...");
    const { custom = {} } = this.sls.service;

    if (!custom) logger.debug("custom config is undefined.");
    if (!custom.local) logger.debug("local config is undefined.");

    let listeners: Listener[] = custom.local && custom.local.listeners;

    if (!listeners || !Array.isArray(listeners)) {
      logger.log("no listeners found, setting default listeners.");
      listeners = [HTTP_LISTENER];
    } else {
      const validListeners = this.validateListeners(listeners);
      if (!validListeners) throw new Error("invalid listeners found. please verify your config and try again.");
    }

    const functions = getFunctions(this.sls);

    if (!functions) throw new Error("no lambda functions found");

    this.localsvr = new LocalServer({ listeners, providerRuntime: this.sls.service.provider.runtime, stage: this.sls.service.provider.stage }, functions);

    await this.localsvr.begin();
  }

  async wait() {
    const localsvrReady = await this.waitForLocalSvr();
    if (!localsvrReady) return;

    const result = await this.waitForTermination();

    logger.debugClear(`received ${result}, ending app`);
  }

  private async waitForLocalSvr() {
    let count = 0;
    while (!this.localsvr.is_ready() && count < 10) {
      await new Promise((r) => setTimeout(r, 1000));
      logger.debug("waiting for local svr to be ready");
      count++;
    }

    if (count >= 10) {
      logger.log("there was an issue starting the local svr, please try again.");
      return false;
    }

    return true;
  }

  async end() {
    logger.logClear("shutting down local server...");

    await this.localsvr.end();
  }

  async waitForTermination() {
    return await new Promise((r) => {
      process.on("SIGINT", () => r("SIGINT")).on("SIGTERM", () => r("SIGTERM"));
    });
  }

  validateListeners(listeners: Listener[]): boolean {
    return listeners.every((l) => {
      const portValid = l.port > 0;
      if (!portValid) logger.log(`invalid port ${l.port}`);

      const eventValid = SUPPORTED_LISTENERS.findIndex((sl) => sl.event === l.event) > -1;
      if (!eventValid) logger.log(`invalid event ${l.event}`);

      return portValid && eventValid;
    });
  }
}

export = ServerlessLocal;
