import * as express from "express";
import { Listener } from "../supported-listeners";
import { RuntimeApi } from "../runtime-apis";
import Serverless from "serverless";
import Logger from "../logger";
import { SnsEvent, SnsEventRequest, SnsEventResponse } from "../events";
import { v4 } from "uuid";
import { isArn, parseArn } from "../utils/arn";
import { Route } from "./route";
import { stopwatch } from "../utils";

export interface RouteProps {
  listener: Listener;
  stage: string;
  runtimeApi: RuntimeApi;
  expressApp: express.Application;
  slsEvent: Serverless.Event;
}

export class SnsRoute implements Route {
  private readonly listener: Listener;
  private readonly stage: string;
  private readonly expressApp: express.Application;
  private readonly topicRuntimes: Map<string, RuntimeApi> = new Map<string, RuntimeApi>();

  topics: string[] = [];
  path: string;
  port: number;
  method: string;
  endpoint: string;

  constructor(listener: Listener, stage: string, expressApp: express.Application) {
    this.listener = listener;
    this.stage = stage;
    this.expressApp = expressApp;

    this.setupHandler();
  }

  register(runtimeApi: RuntimeApi, slsEvent: any) {
    let topic;

    if (typeof slsEvent === "string") {
      const arnOrTopic = slsEvent;
      if (isArn(arnOrTopic)) topic = parseArn(arnOrTopic).resourceId;
      else topic = arnOrTopic;
    } else if (slsEvent.topicName) {
      topic = slsEvent.topicName;
    } else if (slsEvent.arn) {
      topic = parseArn(slsEvent.arn).resourceId;
    } else {
      Logger.log("invalid sns event found, skipping registration");
    }

    this.topicRuntimes.set(topic, runtimeApi);
    this.topics.push(topic);

    Logger.log(`registered ${this.listener.event} topic ${topic} to endpoint [${this.method}]: http://localhost:${this.port}${this.path}`);
  }

  private setupHandler() {
    this.expressApp.post("/", async (req: express.Request, res: express.Response) => {
      const stop = stopwatch();
      const messageId = v4();
      const snsEventRequest = new SnsEventRequest(req.body);
      const snsEvent = new SnsEvent(messageId, snsEventRequest);
      
      const topic = parseArn(snsEventRequest.topicArn).resourceId;
      const runtimeApi = this.topicRuntimes.get(topic);

      if (!runtimeApi) throw new Error(`sls-local invoked with unregistered topic: ${topic}`);

      await runtimeApi.invoke("invoke/sns", snsEvent);

      const response = new SnsEventResponse(messageId, v4());

      res.setHeader("content-type", "application/xml");
      res.status(200).send(response.toXml());

      const time = stop();

      Logger.log(`sns request for topic '${topic}' took ${time}ms`);
    });

    this.path = "/";
    this.port = this.listener.port;
    this.method = "POST";
    this.endpoint = `http://localhost:${this.port}/`;
  }
}
