"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var logger_1 = __importDefault(require("./logger"));
var supported_listeners_1 = require("./supported-listeners");
var runtime_api_invoker_1 = __importDefault(require("./runtime-api-invoker"));
var LocalServer = /** @class */ (function () {
    function LocalServer(opt, functions) {
        var _a;
        this.listeners = [];
        this.registerSnsRoute = function (listener, runtime, app, snsEvent) {
            app.post("/" + snsEvent, function (_req, res) {
                res.send("why you call me like dat bruh, i'll handle this when i want");
            });
            logger_1.default.log("registered sns endpoint [post]: http://localhost:" + listener.port + "/" + snsEvent);
        };
        this.listenerRegistration = (_a = {},
            _a[supported_listeners_1.HTTP_LISTENER.event] = this.registerHttpRoute,
            _a[supported_listeners_1.SNS_LISTENER.event] = this.registerSnsRoute,
            _a);
        this.opt = opt;
        this.functions = functions;
    }
    LocalServer.prototype.begin = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.opt.listeners.forEach(function (l) {
                    var app = express_1.default();
                    app.set("event", l.event);
                    app.get("/", function (_req, res) {
                        var _a;
                        var listener = _this.listeners.find(function (x) { return x.app.get("event") === l.event; });
                        res.json((_a = {}, _a[l.event] = listener === null || listener === void 0 ? void 0 : listener.routes, _a));
                    });
                    var routes = [];
                    _this.functions.forEach(function (f) {
                        f.events.forEach(function (e) {
                            var ev = e;
                            if (!ev[l.event])
                                return;
                            var runtime = f.runtime || _this.opt.providerRuntime || "";
                            var route = _this.registerRoute(l, runtime, app, ev[l.event]);
                            routes.push(route);
                        });
                    });
                    var server = app.listen(l.port);
                    _this.listeners.push({ app: app, server: server, event: l.event, routes: routes });
                });
                return [2 /*return*/];
            });
        });
    };
    LocalServer.prototype.is_ready = function () {
        return this.listeners.every(function (x) { return x.server.listening; });
    };
    LocalServer.prototype.end = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.listeners.forEach(function (l) { return l.server.close(); });
                this.listeners = [];
                return [2 /*return*/];
            });
        });
    };
    LocalServer.prototype.registerRoute = function (listener, runtime, app, slsEvent) {
        var register = this.listenerRegistration[listener.event];
        return register(listener, runtime, app, slsEvent);
    };
    LocalServer.prototype.registerHttpRoute = function (listener, runtime, app, httpEvent) {
        var _this = this;
        var path = httpEvent.path.startsWith("/") ? httpEvent.path : "/" + httpEvent.path;
        app[httpEvent.method](path, function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, runtime_api_invoker_1.default.invokeRuntimeApi(runtime, {})];
                    case 1:
                        result = _a.sent();
                        res.status(result.statusCode).send(result.body);
                        return [2 /*return*/];
                }
            });
        }); });
        logger_1.default.log("registered http endpoint [" + httpEvent.method + "]: http://localhost:" + listener.port + "/" + httpEvent.path);
        return { method: httpEvent.method, path: path, port: listener.port, endpoint: "http://localhost:" + listener.port + "/" + httpEvent.path };
    };
    return LocalServer;
}());
exports.default = LocalServer;
