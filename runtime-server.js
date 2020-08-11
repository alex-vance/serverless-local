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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var execa_1 = __importDefault(require("execa"));
var logger_1 = __importDefault(require("./logger"));
var supported_runtimes_1 = require("./supported-runtimes");
var os_1 = require("os");
var path_1 = require("path");
var RuntimeServer = /** @class */ (function () {
    function RuntimeServer(opt, functions) {
        var _a;
        this.childProcesses = [];
        this.runners = (_a = {},
            _a[supported_runtimes_1.NETCORE_31] = this.run_dotnetcore31,
            _a);
        this.opt = opt;
        this.functions = functions;
    }
    RuntimeServer.prototype.begin = function () {
        return __awaiter(this, void 0, void 0, function () {
            var runtimes;
            var _this = this;
            return __generator(this, function (_a) {
                runtimes = this.functions.filter(function (f) { return f.runtime; }).map(function (f) { return f.runtime; });
                if (!runtimes.length && this.opt.providerRuntime)
                    runtimes.push(this.opt.providerRuntime);
                if (!runtimes) {
                    logger_1.default.log("no runtimes specified");
                    return [2 /*return*/];
                }
                runtimes.forEach(function (r) { return __awaiter(_this, void 0, void 0, function () {
                    var process;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                logger_1.default.log("starting " + r + " process");
                                return [4 /*yield*/, this.runners[r](this.functions)];
                            case 1:
                                process = _a.sent();
                                this.childProcesses.push(process);
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    RuntimeServer.prototype.is_ready = function () {
        // this.childProcesses.forEach(c => {
        //   c.connected
        // })
        return true;
    };
    // it's the responsibility of the runtime-api to extract and read the packaged artifact
    RuntimeServer.prototype.run_dotnetcore31 = function (functions) {
        return __awaiter(this, void 0, void 0, function () {
            var command, handlerAndPaths, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        command = os_1.platform() === "win32" ? "dotnet.exe" : "dotnet";
                        handlerAndPaths = functions
                            .filter(function (f) { return f.runtime === supported_runtimes_1.NETCORE_31; })
                            .map(function (f) {
                            //return `${f.handler}|${f.package.artifact}`;
                            return "" + f.handler;
                        });
                        return [4 /*yield*/, execa_1.default(command, __spreadArrays([path_1.resolve(__dirname, "runtime-apis/dotnetcore3.1/bin/Debug/netcoreapp3.1/dotnetcore3.1.dll")], handlerAndPaths))];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.default.log('error!', error_1);
                        return [2 /*return*/];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return RuntimeServer;
}());
exports.default = RuntimeServer;
