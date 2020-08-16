import express from "express";
import logger from "./logger";
import http from "http";
import { Listener, HTTP_LISTENER, SNS_LISTENER } from "./supported-listeners";
import Serverless from "serverless";
import { stopwatch } from "./util";
import ProxyIntegrationEvent from "./events/proxy-integration-event";
import RuntimeApi from "./runtime-api";

export interface LocalServerOptions {
  listeners: Listener[];
  providerRuntime?: string | undefined;
}

interface Route {
  path: string;
  port: number;
  method: string;
  endpoint: string;
}

export interface ListenerAppServer {
  app: express.Application;
  server: http.Server;
  event: string;
  routes: Route[];
}

export default class LocalServer {
  private readonly opt: LocalServerOptions;
  private readonly functions: Serverless.FunctionDefinition[];
  private listeners: ListenerAppServer[] = [];
  private runtimeApis: RuntimeApi[] = [];

  constructor(opt: LocalServerOptions, functions: Serverless.FunctionDefinition[]) {
    this.opt = opt;
    this.functions = functions;
  }

  async begin() {
    this.opt.listeners.forEach((l) => {
      const app: express.Application = express();

      app.set("event", l.event); // sets the event for this express server so we can find applicable routes at the root path

      app.get("/", (_req: express.Request, res: express.Response) => {
        const listener = this.listeners.find((x) => x.app.get("event") === l.event);

        res.json({ [l.event]: listener?.routes });
      });

      let routes: Route[] = [];

      this.functions.forEach((fd) => {
        const runtimeApi = new RuntimeApi(fd, { providerRuntime: this.opt.providerRuntime });
        this.runtimeApis.push(runtimeApi);
        
        fd.events.forEach((e) => {
          const ev = e as any;
          if (!ev[l.event]) return;

          const route = this.registerRoute(l, runtimeApi, app, ev[l.event]);

          routes.push(route);
        });
      });

      const server = app.listen(l.port);

      this.listeners.push({ app, server, event: l.event, routes });
    });
  }

  is_ready(): boolean {
    return this.listeners.every((x) => x.server.listening);
  }

  end() {
    this.listeners.forEach((l) => l.server.close());
    this.listeners = [];
    this.runtimeApis.forEach(ra => ra.kill());
    this.runtimeApis = [];
  }

  private registerRoute(listener: Listener, runtimeApi: RuntimeApi, app: express.Application, slsEvent: any): Route {
    const register = this.listenerRegistration[listener.event];

    return register(listener, runtimeApi, app, slsEvent);
  }

  private registerHttpRoute(listener: Listener, runtimeApi: RuntimeApi, app: express.Application, httpEvent: any): Route {
    const pathWithForwardSlash = httpEvent.path.startsWith("/") ? httpEvent.path : `/${httpEvent.path}`;
    const pathWithoutProxy = pathWithForwardSlash.replace("{proxy+}", "*");
    const method = httpEvent.method === "any" ? "all" : httpEvent.method;

    app[method](pathWithoutProxy, async (req: express.Request, res: express.Response) => {
      const stop = stopwatch();
      const proxyEvent = new ProxyIntegrationEvent(req);
      const executeApiResult = await runtimeApi.invoke("invoke/execute-api", proxyEvent);

      let executeApiPayload;

      try {
        executeApiPayload = JSON.parse(executeApiResult.payload);
      } catch (error) {
        logger.log("error parsing json response from lambda");
        executeApiPayload = executeApiResult.payload;
      }

      let functionResponse;

      try {
        functionResponse = JSON.parse(executeApiPayload && executeApiPayload.body);
      } catch (error) {
        logger.log("error parsing the body from the payload");
        functionResponse = executeApiPayload;
      }

      const status = functionResponse.statusCode || executeApiPayload.statusCode || executeApiResult.status;

      res.status(status).send(functionResponse && functionResponse.body);

      const time = stop();

      logger.log(`request to ${pathWithForwardSlash} took ${time}ms`);
    });

    logger.log(`registered http endpoint [${httpEvent.method}]: http://localhost:${listener.port}${pathWithForwardSlash}`);

    return { method: httpEvent.method, path: pathWithForwardSlash, port: listener.port, endpoint: `http://localhost:${listener.port}${pathWithForwardSlash}` };
  }

  private registerSnsRoute = (listener: Listener, runtime: string, app: any, snsEvent: any) => {
    app.post(`/${snsEvent}`, (_req: any, res: any) => {
      res.send("why you call me like dat bruh, i'll handle this when i want");
    });

    logger.log(`registered sns endpoint [post]: http://localhost:${listener.port}/${snsEvent}`);
  };

  private listenerRegistration: any = {
    [HTTP_LISTENER.event]: this.registerHttpRoute,
    [SNS_LISTENER.event]: this.registerSnsRoute,
  };
}
