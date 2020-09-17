"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeApi = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const execa_1 = __importDefault(require("execa"));
const supported_runtimes_1 = require("../supported-runtimes");
const os_1 = require("os");
const path_1 = require("path");
const logger_1 = __importDefault(require("../logger"));
let nextAvailablePort = 4101;
const execaOptions = { stdout: "inherit" }; //interleaves child process and serverless local process stout together.
class RuntimeApi {
    constructor(functionDefinition, opt) {
        this.runners = {
            [supported_runtimes_1.NETCORE_31]: this.run_dotnetcore31,
        };
        this.functionDefinition = functionDefinition;
        this.opt = opt;
        this.init();
    }
    init() {
        const runtime = this.functionDefinition.runtime || this.opt.providerRuntime;
        if (!runtime)
            return;
        this.runtimeProcess = this.runners[runtime](this.functionDefinition, nextAvailablePort);
        this.baseUrl = `http://localhost:${nextAvailablePort}`;
        nextAvailablePort++;
    }
    async invoke(path, event) {
        const body = JSON.stringify(event);
        const url = `${this.baseUrl}/${path}`;
        const result = await node_fetch_1.default(url, {
            method: "POST",
            body,
            headers: { "content-type": "application/json" },
        });
        let payload;
        if (result.body) {
            const text = await result.text();
            try {
                payload = JSON.parse(text);
            }
            catch (error) {
                payload = text;
            }
        }
        return { status: result.status, payload };
    }
    kill() {
        this.runtimeProcess && this.runtimeProcess.kill && this.runtimeProcess.kill("SIGKILL");
    }
    async run_dotnetcore31(functionDefinition, runtimePort) {
        try {
            const env = { ...functionDefinition.environment, ASPNETCORE_URLS: `http://+:${runtimePort}` };
            const command = os_1.platform() === "win32" ? "dotnet.exe" : "dotnet";
            const handlerAndPath = JSON.stringify({ handler: functionDefinition.handler, artifact: functionDefinition.package.artifact });
            return await execa_1.default(command, [path_1.resolve(__dirname, `runtime-binaries/dotnetcore3.1/dotnetcore3.1.dll`), handlerAndPath], {
                ...execaOptions,
                env,
            });
        }
        catch (error) {
            logger_1.default.debug(`dotnetcore3.1 process failed to start for function '${functionDefinition.name}'`, error);
            return;
        }
    }
}
exports.RuntimeApi = RuntimeApi;
