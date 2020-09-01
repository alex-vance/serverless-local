import * as express from "express";
import { Listener, HTTP_LISTENER, SNS_LISTENER } from "../supported-listeners";
import RuntimeApi from "../runtime-api";
import Serverless from "serverless";
import registerSnsRoute from "./register-sns";
import registerExecuteApiRoute from "./register-execute-api";
import Logger from "../logger";

export interface RouteProps {
  listener: Listener;
  stage: string;
  runtimeApi: RuntimeApi;
  expressApp: express.Application;
  slsEvent: Serverless.Event;
}

export interface RegistrationResult {
  path: string;
  port: number;
  method: string;
  endpoint: string;
}

export class Route implements RegistrationResult {
  private readonly listener: Listener;
  private readonly stage: string;
  private readonly runtimeApi: RuntimeApi;
  private readonly expressApp: express.Application;
  private readonly slsEvent: any;

  path: string;
  port: number;
  method: string;
  endpoint: string;

  constructor(props: RouteProps) {
    this.listener = props.listener;
    this.stage = props.stage;
    this.runtimeApi = props.runtimeApi;
    this.expressApp = props.expressApp;
    this.slsEvent = props.slsEvent;
  }

  register() {
    const eventRegistration = this.eventRegistrationMap[this.listener.event];
    const result = eventRegistration(this.listener, this.stage, this.runtimeApi, this.expressApp, this.slsEvent);
    
    this.method = result.method;
    this.path = result.path;
    this.port = result.port;
    this.endpoint = result.endpoint;

    Logger.log(`registered ${this.listener.event} endpoint [${this.method}]: http://localhost:${this.port}${this.path}`);
  }

  eventRegistrationMap = {
    [HTTP_LISTENER.event]: registerExecuteApiRoute,
    [SNS_LISTENER.event]: registerSnsRoute,
  };
}
