// import { ProxyIntegrationEvent } from "../events";
// import { Listener } from "../supported-listeners";
// import RuntimeApi from "../runtime-api";
// import * as express from "express";
// import { stopwatch } from "../utils";
// import logger from "../logger";
// import { RegistrationResult } from "./route";

// const paramsRegex = /\{.*?[^proxy\+].*?\}/g;

// export default function registerExecuteApiRoute(
//   listener: Listener,
//   stage: string,
//   runtimeApi: RuntimeApi,
//   app: express.Application,
//   slsEvent: any
// ): RegistrationResult {
//   const pathWithForwardSlash = slsEvent.path.startsWith("/") ? slsEvent.path : `/${slsEvent.path}`;
//   const pathWithoutProxy = pathWithForwardSlash.replace("/{proxy+}", "*");
//   const pathParams = pathWithoutProxy.match(paramsRegex);

//   let finalPath = pathWithoutProxy;
//   if (pathParams && pathParams.length) {
//     pathParams.forEach((p: string) => {
//       const expressParam = `:${p.substring(1, p.length - 1)}`;
//       finalPath = finalPath.replace(p, expressParam);
//     });
//   }

//   const method = slsEvent.method === "any" ? "all" : slsEvent.method;

//   app[method](finalPath, async (req: express.Request, res: express.Response) => {
//     const stop = stopwatch();
//     const proxyEvent = new ProxyIntegrationEvent(req, stage, pathWithForwardSlash);
//     const { payload, status } = await runtimeApi.invoke("invoke/execute-api", proxyEvent);

//     let response = undefined;

//     if (payload) {
//       if (payload.body) {
//         try {
//           response = JSON.parse(payload.body);
//         } catch (error) {
//           response = payload.body;
//         }
//       } else if (payload.body === "") {
//         //allow empty string responses
//         response = payload.body;
//       } else {
//         response = payload; // allow raw responses if nothing else works;
//       }

//       if (payload.multiValueHeaders) {
//         for (let [key, value] of Object.entries(payload.multiValueHeaders)) {
//           logger.log(`${key}:${value}`);
//           res.setHeader(key, value as string[]);
//         }
//       }
//     }

//     res.status(payload.statusCode || status).send(response);

//     const time = stop();

//     logger.log(`request to ${pathWithForwardSlash} took ${time}ms`);
//   });

//   return { method: slsEvent.method, path: pathWithForwardSlash, port: listener.port, endpoint: `http://localhost:${listener.port}${pathWithForwardSlash}` };
// }
