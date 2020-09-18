"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const local_server_1 = __importDefault(require("./local-server"));
const utils_1 = require("./utils");
const supported_listeners_1 = require("./supported-listeners");
const logger_1 = __importDefault(require("./logger"));
class ServerlessLocal {
    constructor(sls, opt) {
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
        logger_1.default.log("starting local server...");
        const { custom = {} } = this.sls.service;
        if (!custom)
            logger_1.default.debug("custom config is undefined.");
        if (!custom.local)
            logger_1.default.debug("local config is undefined.");
        let listeners = custom.local && custom.local.listeners;
        if (!listeners || !Array.isArray(listeners)) {
            logger_1.default.log("no listeners found, setting default listeners.");
            listeners = [supported_listeners_1.HTTP_LISTENER];
        }
        else {
            const validListeners = this.validateListeners(listeners);
            if (!validListeners)
                throw new Error("invalid listeners found. please verify your config and try again.");
        }
        const functions = utils_1.getFunctions(this.sls);
        if (!functions)
            throw new Error("no lambda functions found");
        this.localsvr = new local_server_1.default({ listeners, providerRuntime: this.sls.service.provider.runtime, stage: this.sls.service.provider.stage }, functions);
        await this.localsvr.begin();
    }
    async wait() {
        const localsvrReady = await this.waitForLocalSvr();
        if (!localsvrReady)
            return;
        logger_1.default.log('startup completed');
        const result = await this.waitForTermination();
        logger_1.default.debugClear(`received ${result}, ending app`);
    }
    async waitForLocalSvr() {
        let count = 0;
        while (!this.localsvr.is_ready() && count < 10) {
            await new Promise((r) => setTimeout(r, 1000));
            logger_1.default.debug("waiting for local svr to be ready");
            count++;
        }
        if (count >= 10) {
            logger_1.default.log("there was an issue starting the local svr, please try again.");
            return false;
        }
        return true;
    }
    async end() {
        logger_1.default.logClear("shutting down local server...");
        await this.localsvr.end();
    }
    async waitForTermination() {
        return await new Promise((r) => {
            process.on("SIGINT", () => r("SIGINT")).on("SIGTERM", () => r("SIGTERM"));
        });
    }
    validateListeners(listeners) {
        return listeners.every((l) => {
            const portValid = l.port > 0;
            if (!portValid)
                logger_1.default.log(`invalid port ${l.port}`);
            const eventValid = supported_listeners_1.SUPPORTED_LISTENERS.findIndex((sl) => sl.event === l.event) > -1;
            if (!eventValid)
                logger_1.default.log(`invalid event ${l.event}`);
            return portValid && eventValid;
        });
    }
}
module.exports = ServerlessLocal;
