import { Listener } from "../supported-listeners";
import RuntimeApi from "../runtime-api";
import * as express from "express";
import { RegistrationResult } from "./route";
import { SnsEvent } from "../events";
import xml from "xml";
import { v4 } from "uuid";
import { SnsEventRequest } from "../events/sns-event-request";
import Logger from "../logger";

export default function registerSnsRoute(
  listener: Listener,
  stage: string,
  runtimeApi: RuntimeApi,
  expressApp: express.Application,
  slsEvent: any
): RegistrationResult {
  expressApp.post("/", async (req: express.Request, res: express.Response) => {
    const messageId = v4();
    const snsEventRequest = new SnsEventRequest(req.body);
    const snsEvent = new SnsEvent(messageId, snsEventRequest);
    
    await runtimeApi.invoke("invoke/sns", snsEvent);
    
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
              MessageId: messageId,
            },
          ],
        },
        {
          ResponseMetadata: [
            {
              RequestId: v4(),
            },
          ],
        },
      ],
    };

    res.setHeader("content-type", "application/xml");

    res.status(200).send(xml(payload)); //always send a success back regardless if the event is failed to be handle.
  });

  return { method: "POST", path: "/", port: listener.port, endpoint: `http://localhost:${listener.port}/` };
}
