"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsRoute = void 0;
const logger_1 = __importDefault(require("../logger"));
const events_1 = require("../events");
const uuid_1 = require("uuid");
const arn_1 = require("../utils/arn");
const utils_1 = require("../utils");
class SnsRoute {
    constructor(listener, stage, expressApp) {
        this.topicRuntimes = new Map();
        this.topics = [];
        this.listener = listener;
        this.stage = stage;
        this.expressApp = expressApp;
        this.setupHandler();
    }
    is_ready() {
        return this.topicRuntimes && Array.from(this.topicRuntimes, ([_, value]) => value).every((x) => x.is_ready());
    }
    register(runtimeApi, slsEvent) {
        let topic;
        if (typeof slsEvent === "string") {
            const arnOrTopic = slsEvent;
            if (arn_1.isArn(arnOrTopic))
                topic = arn_1.parseArn(arnOrTopic).resourceId;
            else
                topic = arnOrTopic;
        }
        else if (slsEvent.topicName) {
            topic = slsEvent.topicName;
        }
        else if (slsEvent.arn) {
            topic = arn_1.parseArn(slsEvent.arn).resourceId;
        }
        else {
            logger_1.default.log("invalid sns event found, skipping registration");
        }
        this.topicRuntimes.set(topic, runtimeApi);
        this.topics.push(topic);
        logger_1.default.log(`registered ${this.listener.event} topic ${topic} to endpoint [${this.method}]: http://localhost:${this.port}${this.path}`);
    }
    setupHandler() {
        this.expressApp.post("/", async (req, res) => {
            const stop = utils_1.stopwatch();
            const messageId = uuid_1.v4();
            const snsEventRequest = new events_1.SnsEventRequest(req.body);
            const snsEvent = new events_1.SnsEvent(messageId, snsEventRequest);
            const topic = arn_1.parseArn(snsEventRequest.topicArn).resourceId;
            const runtimeApi = this.topicRuntimes.get(topic);
            if (!runtimeApi)
                throw new Error(`sls-local invoked with unregistered topic: ${topic}`);
            await runtimeApi.invoke("invoke/sns", snsEvent);
            const response = new events_1.SnsEventResponse(messageId, uuid_1.v4());
            res.setHeader("content-type", "application/xml");
            res.status(200).send(response.toXml());
            const time = stop();
            logger_1.default.log(`sns request for topic '${topic}' took ${time}ms`);
        });
        this.path = "/";
        this.port = this.listener.port;
        this.method = "POST";
        this.endpoint = `http://localhost:${this.port}/`;
    }
}
exports.SnsRoute = SnsRoute;
