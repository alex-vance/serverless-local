import { SnsEventRequest } from "./sns-event-request";

export class SnsEvent {
  records: SnsRecord[];

  constructor(messageId: string, request: SnsEventRequest) {
    this.records = [new SnsRecord(messageId, request)];
  }
}

export class SnsRecord {
  eventSource: string = "aws:sns";
  evenSubscriptionArn: string;
  eventVersion: string = "1.0";
  sns: SnsMessage;

  constructor(messageId: string, request: SnsEventRequest) {
    this.sns = new SnsMessage(messageId, request);
  }
}

export class SnsMessage {
  signatureVersion: string = "1";
  timestamp: string = new Date().toISOString();
  signature: string = "sls-local-signature";
  signingCertUrl: string = "sls-local-signingcerturl";
  messageId: string;
  message: string;
  messageAttributes: any;
  type: string = "Notification";
  unsubscribeUrl: string = "sls-local-unsubscribeurl";
  topicArn: string;
  subject: string;

  constructor(messageId: string, request: SnsEventRequest) {
    this.messageId = messageId;
    this.messageAttributes = request.messageAttributes;
    this.topicArn = request.topicArn;
    this.subject = request.subject;
    this.message = request.message;
  }
}
