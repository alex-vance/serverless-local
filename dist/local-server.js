"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supported_listeners_1 = require("./supported-listeners");
const runtime_apis_1 = require("./runtime-apis");
const execute_api_route_1 = require("./routes/execute-api-route");
const sns_route_1 = require("./routes/sns-route");
class LocalServer {
    constructor(opt, functions) {
        this.listeners = [];
        this.runtimeApis = [];
        this.opt = opt;
        this.functions = functions;
    }
    async begin() {
        this.opt.listeners.forEach((l) => {
            const app = express_1.default();
            app.use(express_1.default.json());
            app.use(express_1.default.urlencoded());
            app.set("event", l.event);
            let executeApiRoutes = [];
            let snsRoute;
            this.functions.forEach((fd) => {
                const runtimeApi = new runtime_apis_1.RuntimeApi(fd, { providerRuntime: this.opt.providerRuntime });
                this.runtimeApis.push(runtimeApi);
                // find a better way to do this
                fd.events.forEach((e) => {
                    const slsEvent = e;
                    if (!slsEvent[l.event])
                        return;
                    if (l.event === supported_listeners_1.HTTP_LISTENER.event) {
                        const executeApiRoute = new execute_api_route_1.ExecuteApiRoute(l, this.opt.stage, runtimeApi, app, slsEvent[l.event]);
                        executeApiRoute.register();
                        executeApiRoutes.push(executeApiRoute);
                    }
                    else if (l.event === supported_listeners_1.SNS_LISTENER.event) {
                        if (!snsRoute)
                            snsRoute = new sns_route_1.SnsRoute(l, this.opt.stage, app);
                        snsRoute.register(runtimeApi, slsEvent[l.event]);
                    }
                });
            });
            app.get("/", (_req, res) => {
                const listener = this.listeners.find((x) => x.app.get("event") === l.event);
                res.json({
                    [l.event]: listener === null || listener === void 0 ? void 0 : listener.routes.map((r) => ({
                        method: r.method,
                        path: r.path,
                        topics: r.topics,
                        port: r.port,
                        endpoint: r.endpoint,
                    })),
                });
            });
            app.all("*", (_req, res) => {
                res.status(404).send();
            });
            const server = app.listen(l.port);
            const routes = [];
            if (executeApiRoutes.length)
                routes.push(...executeApiRoutes);
            if (snsRoute)
                routes.push(snsRoute);
            this.listeners.push({
                app,
                server,
                event: l.event,
                routes,
            });
        });
    }
    is_ready() {
        return this.listeners.every((x) => x.server.listening && x.routes.every((y) => y.is_ready()));
    }
    end() {
        this.listeners.forEach((l) => l.server.close());
        this.listeners = [];
        this.runtimeApis.forEach((ra) => ra.kill());
        this.runtimeApis = [];
    }
}
exports.default = LocalServer;
