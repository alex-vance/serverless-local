import express from "express";
import logger from "./logger";
import http from "http";
import { Listener } from "./supported-listeners";
import Serverless from "serverless";
import RuntimeApi from "./runtime-api";
import { Route } from "./routes";

export interface LocalServerOptions {
  listeners: Listener[];
  providerRuntime?: string;
  stage: string;
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
      app.use(express.json());
      app.use(express.urlencoded());
      app.set("event", l.event); // sets the event for this express server so we can find applicable routes at the root path

      let routes: Route[] = [];

      this.functions.forEach((fd) => {
        const runtimeApi = new RuntimeApi(fd, { providerRuntime: this.opt.providerRuntime });
        this.runtimeApis.push(runtimeApi);

        fd.events.forEach((e) => {
          const ev = e as any;
          if (!ev[l.event]) return;

          const route = new Route({ listener: l, stage: this.opt.stage, runtimeApi, expressApp: app, slsEvent: ev[l.event] });

          route.register();

          routes.push(route);
        });
      });

      app.get("/", (_req: express.Request, res: express.Response) => {
        const listener = this.listeners.find((x) => x.app.get("event") === l.event);

        res.json({
          [l.event]: listener?.routes.map((r) => ({
            method: r.method,
            path: r.path,
            port: r.port,
            endpoint: r.endpoint,
          })),
        });
      });


      app.all("*", (_req: express.Request, res: express.Response) => {
        
        logger.log(`received request for ${_req.method} ${_req.baseUrl}${_req.url}`);
        logger.log(`host ${_req.host}`);
        logger.log(JSON.stringify(_req.headers));
        logger.log(JSON.stringify(_req.body));

        res.status(200).send();
      });

      const server = app.listen(l.port);

      this.listeners.push({
        app,
        server,
        event: l.event,
        routes,
      });
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

  private registerSnsRoute = (listener: Listener, stage: string, runtimeApi: RuntimeApi, app: any, snsEvent: any) => {
    app.post(`/${snsEvent}`, (req: express.Request, res: express.Response) => {
      runtimeApi.invoke("invoke/sns", req.body);
      res.status(200).send("passed it along bro, but no idea what happened to it");
    });

    logger.log(`registered sns endpoint [post]: http://localhost:${listener.port}/${snsEvent}`);
  };
}
