import { Listener } from "../supported-listeners";
import RuntimeApi from "../runtime-api";
import express from "express";
import { ProxyIntegrationEvent } from "../events";
import { stopwatch } from "../utils";
import Logger from "../logger";
import { Route } from "./route";

const paramsRegex = /\{.*?[^proxy\+].*?\}/g;

export class ExecuteApiRoute implements Route {
  private readonly listener: Listener;
  private readonly stage: string;
  private readonly runtimeApi: RuntimeApi;
  private readonly expressApp: express.Application;
  private readonly slsEvent: any;

  path: string;
  port: number;
  method: string;
  endpoint: string;

  constructor(listener: Listener, stage: string, runtimeApi: RuntimeApi, expressApp: express.Application, slsEvent: any) {
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
      pathParams.forEach((p: string) => {
        const expressParam = `:${p.substring(1, p.length - 1)}`;
        finalPath = finalPath.replace(p, expressParam);
      });
    }

    const method = this.slsEvent.method === "any" ? "all" : this.slsEvent.method;

    this.expressApp[method](finalPath, async (req: express.Request, res: express.Response) => {
      const stop = stopwatch();
      const proxyEvent = new ProxyIntegrationEvent(req, this.stage, pathWithForwardSlash);
      const { payload, status } = await this.runtimeApi.invoke("invoke/execute-api", proxyEvent);

      let response = undefined;

      if (payload) {
        if (payload.body) {
          try {
            response = JSON.parse(payload.body);
          } catch (error) {
            response = payload.body;
          }
        } else if (payload.body === "") {
          //allow empty string responses
          response = payload.body;
        } else {
          response = payload; // allow raw responses if nothing else works;
        }

        if (payload.multiValueHeaders) {
          for (let [key, value] of Object.entries(payload.multiValueHeaders)) {
            Logger.log(`${key}:${value}`);
            res.setHeader(key, value as string[]);
          }
        }
      }

      res.status(payload.statusCode || status).send(response);

      const time = stop();

      Logger.log(`request to ${pathWithForwardSlash} took ${time}ms`);
    });

    this.method = this.slsEvent.method;
    this.path = pathWithForwardSlash;
    this.port = this.listener.port;
    this.endpoint = `http://localhost:${this.listener.port}${pathWithForwardSlash}`;

    Logger.log(`registered ${this.listener.event} endpoint [${this.method}]: http://localhost:${this.port}${this.path}`);
  }
}
