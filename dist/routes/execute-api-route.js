"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("../events");
const utils_1 = require("../utils");
const logger_1 = __importDefault(require("../logger"));
const paramsRegex = /\{.*?[^proxy\+].*?\}/g;
class ExecuteApiRoute {
    constructor(listener, stage, runtimeApi, expressApp, slsEvent) {
        this.listener = listener;
        this.stage = stage;
        this.runtimeApi = runtimeApi;
        this.expressApp = expressApp;
        this.slsEvent = slsEvent;
    }
    register() {
        const pathWithForwardSlash = this.slsEvent.path.startsWith("/") ? this.slsEvent.path : `/${this.slsEvent.path}`;
        const pathWithoutProxy = pathWithForwardSlash.replace("/{proxy+}", "*");
        const pathParams = pathWithoutProxy.match(paramsRegex);
        let finalPath = pathWithoutProxy;
        if (pathParams && pathParams.length) {
            pathParams.forEach((p) => {
                const expressParam = `:${p.substring(1, p.length - 1)}`;
                finalPath = finalPath.replace(p, expressParam);
            });
        }
        const method = this.slsEvent.method === "any" ? "all" : this.slsEvent.method;
        this.expressApp[method](finalPath, async (req, res) => {
            const stop = utils_1.stopwatch();
            const proxyEvent = new events_1.ProxyIntegrationEvent(req, this.stage, pathWithForwardSlash);
            const { payload, status } = await this.runtimeApi.invoke("invoke/execute-api", proxyEvent);
            let response = undefined;
            if (payload) {
                if (payload.body) {
                    try {
                        response = JSON.parse(payload.body);
                    }
                    catch (error) {
                        response = payload.body;
                    }
                }
                else if (payload.body === "") {
                    //allow empty string responses
                    response = payload.body;
                }
                else {
                    response = payload; // allow raw responses if nothing else works;
                }
                if (payload.multiValueHeaders) {
                    for (let [key, value] of Object.entries(payload.multiValueHeaders)) {
                        res.setHeader(key, value);
                    }
                }
            }
            res.status(payload.statusCode || status).send(response);
            const time = stop();
            logger_1.default.log(`execute-api request to path '${pathWithForwardSlash}' took ${time}ms`);
        });
        this.method = this.slsEvent.method;
        this.path = pathWithForwardSlash;
        this.port = this.listener.port;
        this.endpoint = `http://localhost:${this.listener.port}${pathWithForwardSlash}`;
        logger_1.default.log(`registered ${this.listener.event} endpoint [${this.method}]: http://localhost:${this.port}${this.path}`);
    }
}
exports.ExecuteApiRoute = ExecuteApiRoute;
