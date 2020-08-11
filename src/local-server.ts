import express from "express";
import logger from "./logger";
import http from "http";
import { Listener, HTTP_LISTENER, SNS_LISTENER } from "./supported-listeners";
import Serverless from "serverless";
import RuntimeApiInvoker from "./runtime-api-invoker";
import { stopwatch } from "./util";

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

  constructor(opt: LocalServerOptions, functions: Serverless.FunctionDefinition[]) {
    this.opt = opt;
    this.functions = functions;
  }

  async begin() {
    this.opt.listeners.forEach((l) => {
      const app = express();
      app.set("event", l.event);
      app.get("/", (_req: express.Request, res: express.Response) => {
        const listener = this.listeners.find((x) => x.app.get("event") === l.event);

        res.json({ [l.event]: listener?.routes });
      });

      let routes: Route[] = [];

      this.functions.forEach((f) => {
        f.events.forEach((e) => {
          const ev = e as any;
          if (!ev[l.event]) return;

          const runtime = f.runtime || this.opt.providerRuntime || "";
          const route = this.registerRoute(l, runtime, app, ev[l.event]);

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

  async end() {
    this.listeners.forEach((l) => l.server.close());
    this.listeners = [];
  }

  private registerRoute(listener: Listener, runtime: string, app: express.Application, slsEvent: any): Route {
    const register = this.listenerRegistration[listener.event];

    return register(listener, runtime, app, slsEvent);
  }

  private registerHttpRoute(listener: Listener, runtime: string, app: any, httpEvent: any): Route {
    const path = httpEvent.path.startsWith("/") ? httpEvent.path : `/${httpEvent.path}`;

    app[httpEvent.method](path, async (_req: any, res: any) => {
      const stop = stopwatch();
      const result = await RuntimeApiInvoker.invokeRuntimeApi(runtime, {});

      res.status(result.statusCode).send(result.body);

      const time = stop();

      logger.log(`request to ${path} took ${time}ms`);
    });

    logger.log(`registered http endpoint [${httpEvent.method}]: http://localhost:${listener.port}/${httpEvent.path}`);

    return { method: httpEvent.method, path, port: listener.port, endpoint: `http://localhost:${listener.port}/${httpEvent.path}` };
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
