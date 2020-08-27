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
  providerRuntime?: string;
  stage: string;
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

const paramsRegex = /\{.*?[^proxy\+].*?\}/g;

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
      app.use(express.json());
      app.set("event", l.event); // sets the event for this express server so we can find applicable routes at the root path

      let routes: Route[] = [];

      this.functions.forEach((fd) => {
        const runtimeApi = new RuntimeApi(fd, { providerRuntime: this.opt.providerRuntime });
        this.runtimeApis.push(runtimeApi);

        fd.events.forEach((e) => {
          const ev = e as any;
          if (!ev[l.event]) return;

          const route = this.registerRoute(l, this.opt.stage, runtimeApi, app, ev[l.event]);

          routes.push(route);
        });
      });

      app.get("/", (_req: express.Request, res: express.Response) => {
        const listener = this.listeners.find((x) => x.app.get("event") === l.event);

        res.json({ [l.event]: listener?.routes });
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
    this.runtimeApis.forEach((ra) => ra.kill());
    this.runtimeApis = [];
  }

  private registerRoute(listener: Listener, stage: string, runtimeApi: RuntimeApi, app: express.Application, slsEvent: any): Route {
    const register = this.listenerRegistration[listener.event];

    return register(listener, stage, runtimeApi, app, slsEvent);
  }

  private registerHttpRoute(listener: Listener, stage: string, runtimeApi: RuntimeApi, app: express.Application, httpEvent: any): Route {
    const pathWithForwardSlash = httpEvent.path.startsWith("/") ? httpEvent.path : `/${httpEvent.path}`;
    const pathWithoutProxy = pathWithForwardSlash.replace("/{proxy+}", "*");
    const pathParams = pathWithoutProxy.match(paramsRegex);

    let finalPath = pathWithoutProxy;
    if (pathParams && pathParams.length) {
      pathParams.forEach((p: string) => {
        const expressParam = `:${p.substring(1, p.length - 1)}`;
        finalPath = finalPath.replace(p, expressParam);
      });
    }

    const method = httpEvent.method === "any" ? "all" : httpEvent.method;

    app[method](finalPath, async (req: express.Request, res: express.Response) => {
      const stop = stopwatch();
      const proxyEvent = new ProxyIntegrationEvent(req, stage, pathWithForwardSlash);
      const { payload, status } = await runtimeApi.invoke("invoke/execute-api", proxyEvent);

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

        //.net core only returns multiValueHeaders as far as I can tell.
        if (payload.multiValueHeaders) {
          for (let [key, value] of Object.entries(payload.multiValueHeaders)) {
            logger.log(`${key}:${value}`);
            res.setHeader(key, value as string[]);
          }
        }
      }

      res.status(payload.statusCode || status).send(response);

      const time = stop();

      logger.log(`request to ${pathWithForwardSlash} took ${time}ms`);
    });

    logger.log(`registered http endpoint [${httpEvent.method}]: http://localhost:${listener.port}${pathWithForwardSlash}`);

    return { method: httpEvent.method, path: pathWithForwardSlash, port: listener.port, endpoint: `http://localhost:${listener.port}${pathWithForwardSlash}` };
  }

  private registerSnsRoute = (listener: Listener, stage: string, runtimeApi: RuntimeApi, app: any, snsEvent: any) => {
    app.post(`/${snsEvent}`, (req: express.Request, res: express.Response) => {
      runtimeApi.invoke("invoke/sns", req.body);
      res.status(200).send("passed it along bro, but no idea what happened to it");
    });

    logger.log(`registered sns endpoint [post]: http://localhost:${listener.port}/${snsEvent}`);
  };

  private listenerRegistration: any = {
    [HTTP_LISTENER.event]: this.registerHttpRoute,
    [SNS_LISTENER.event]: this.registerSnsRoute,
  };
}
