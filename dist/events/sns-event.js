"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsMessage = exports.SnsRecord = exports.SnsEvent = void 0;
class SnsEvent {
    constructor(messageId, request) {
        this.records = [new SnsRecord(messageId, request)];
    }
}
exports.SnsEvent = SnsEvent;
class SnsRecord {
    constructor(messageId, request) {
        this.eventSource = "aws:sns";
        this.eventVersion = "1.0";
        this.sns = new SnsMessage(messageId, request);
    }
}
exports.SnsRecord = SnsRecord;
class SnsMessage {
    constructor(messageId, request) {
        this.signatureVersion = "1";
        this.timestamp = new Date().toISOString();
        this.signature = "sls-local-signature";
        this.signingCertUrl = "sls-local-signingcerturl";
        this.type = "Notification";
        this.unsubscribeUrl = "sls-local-unsubscribeurl";
        this.messageId = messageId;
        this.messageAttributes = request.messageAttributes;
        this.topicArn = request.topicArn;
        this.subject = request.subject;
        this.message = request.message;
    }
}
exports.SnsMessage = SnsMessage;
