import { Listener } from "../supported-listeners";
import RuntimeApi from "../runtime-api";
import * as express from "express";
import { RegistrationResult } from "./route";
import { SnsEvent } from "../events";
import xml from "xml";

export default function registerSnsRoute(
  listener: Listener,
  stage: string,
  runtimeApi: RuntimeApi,
  expressApp: express.Application,
  slsEvent: any
): RegistrationResult {
  expressApp.post("/", async (req: express.Request, res: express.Response) => {
    const snsEvent = new SnsEvent();
    const { status } = await runtimeApi.invoke("invoke/sns", snsEvent);

    const payload = {
      PublishResponse: [
        {
          _attr: {
            xmlns: "http://sns.amazonaws.com/doc/2010-03-31/",
          },
        },
        {
          PublishResult: [
            {
              MessageId: "messageId",
            },
          ],
        },
        {
          ResponseMetadata: [
            {
              RequestId: "random-guid-here",
            },
          ],
        },
      ],
    };

    res.setHeader("content-type", "application/xml");

    res.status(status).send(xml(payload));
  });

  return { method: "POST", path: "/", port: listener.port, endpoint: `http://localhost:${listener.port}/` };
}
