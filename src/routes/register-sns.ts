import { Route } from "./";
import { Listener } from "../supported-listeners";
import RuntimeApi from "../runtime-api";
import * as express from "express";
import { RegistrationResult } from "./route";
import { SnsEvent } from "../events";

export default function registerSnsRoute(
  listener: Listener,
  stage: string,
  runtimeApi: RuntimeApi,
  expressApp: express.Application,
  slsEvent: any
): RegistrationResult {
  expressApp.post("/", async (req: express.Request, res: express.Response) => {
    const snsEvent = new SnsEvent();
    const { status, payload } = await runtimeApi.invoke("invoke/sns", snsEvent);

    res.status(status).send(payload);
  });

  return { method: "POST", path: "/", port: listener.port, endpoint: `http://localhost:${listener.port}/` };
}
