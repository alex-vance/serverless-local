import express from "express";
import http from "http";
import { Listener, HTTP_LISTENER, SNS_LISTENER } from "./supported-listeners";
import Serverless from "serverless";
import { RuntimeApi } from "./runtime-apis";
import { Route } from "./routes";
import { ExecuteApiRoute } from "./routes/execute-api-route";
import { SnsRoute } from "./routes/sns-route";

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
      app.set("event", l.event);

      let executeApiRoutes: ExecuteApiRoute[] = [];
      let snsRoute: SnsRoute | undefined;

      this.functions.forEach((fd) => {
        const runtimeApi = new RuntimeApi(fd, { providerRuntime: this.opt.providerRuntime });
        this.runtimeApis.push(runtimeApi);

        // find a better way to do this
        fd.events.forEach((e) => {
          const slsEvent = e as any;
          if (!slsEvent[l.event]) return;

          if (l.event === HTTP_LISTENER.event) {
            const executeApiRoute = new ExecuteApiRoute(l, this.opt.stage, runtimeApi, app, slsEvent[l.event]);

            executeApiRoute.register();
            executeApiRoutes.push(executeApiRoute);
          } else if (l.event === SNS_LISTENER.event) {
            if (!snsRoute) snsRoute = new SnsRoute(l, this.opt.stage, app);
            snsRoute.register(runtimeApi, slsEvent[l.event]);
          }
        });
      });

      app.get("/", (_req: express.Request, res: express.Response) => {
        const listener = this.listeners.find((x) => x.app.get("event") === l.event);

        res.json({
          [l.event]: listener?.routes.map((r) => ({
            method: r.method,
            path: r.path,
            topics: r.topics,
            port: r.port,
            endpoint: r.endpoint,
          })),
        });
      });

      app.all("*", (_req: express.Request, res: express.Response) => {
        res.status(404).send();
      });

      const server = app.listen(l.port);
      const routes: Route[] = [];

      if (executeApiRoutes.length) routes.push(...executeApiRoutes);
      if (snsRoute) routes.push(snsRoute);

      this.listeners.push({
        app,
        server,
        event: l.event,
        routes,
      });
    });
  }

  is_ready(): boolean {
    return this.listeners.every((x) => x.server.listening && x.routes.every((y) => y.is_ready()));
  }

  end() {
    this.listeners.forEach((l) => l.server.close());
    this.listeners = [];
    this.runtimeApis.forEach((ra) => ra.kill());
    this.runtimeApis = [];
  }
}
