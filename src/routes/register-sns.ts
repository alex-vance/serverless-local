import { Route } from "./";
import { Listener } from "../supported-listeners";
import RuntimeApi from "../runtime-api";
import * as express from "express";
import { RegistrationResult } from "./route";

export default function registerSnsRoute(
  listener: Listener,
  stage: string,
  runtimeApi: RuntimeApi,
  expressApp: express.Application,
  slsEvent: any
): RegistrationResult {
  return { method: "POST", path: "/somewhere", port: 4002, endpoint: "localhost:4002/somewhere" };
}
