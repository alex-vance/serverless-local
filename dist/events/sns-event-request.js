"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SnsEventRequest {
    constructor(rawRequest) {
        this.action = rawRequest.Action;
        this.topicArn = rawRequest.TopicArn;
        this.subject = rawRequest.Subject;
        this.messageStructure = rawRequest.MessageStructure;
        this.message = rawRequest.Message;
        this.version = rawRequest.Version;
        this.parseMessageAttributes(rawRequest);
    }
    parseMessageAttributes(rawRequest) {
        this.messageAttributes = Object.keys(rawRequest)
            .filter((k) => k.startsWith("MessageAttributes.entry"))
            .reduce((prev, curr) => {
            const mai = curr[curr.search(/\d/)];
            if (prev.includes(mai))
                return prev;
            return [...prev, mai];
        }, [])
            .reduce((prev, mai) => {
            const base = `MessageAttributes.entry.${mai}`;
            return {
                ...prev,
                [rawRequest[`${base}.Name`]]: {
                    type: rawRequest[`${base}.DataType`],
                    value: rawRequest[`${base}.Value.BinaryValue`] || rawRequest[`${base}.Value.StringValue`],
                },
            };
        }, {});
    }
}
exports.SnsEventRequest = SnsEventRequest;
