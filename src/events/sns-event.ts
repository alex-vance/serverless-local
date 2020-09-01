export class SnsEvent {
  records: SnsRecord[];

  constructor() {}
}

export class SnsRecord {
  eventSource: string = "aws:sns";
  evenSubscriptionArn: string;
  eventVersion: string = "1.0";
  sns: SnsMessage;

  constructor() {}
}

export class SnsMessage {
  signatureVersion: string = "1";
  timestamp: string = new Date().toISOString();
  signature: string = "sls-local-signature";
  signingCertUrl: string = "sls-local-signingcerturl";
  messageId: string;
  messageAttributes: Array<any>;
  type: string = "Notification";
  unsubscribeUrl: string = "sls-local-unsubscribeurl";
  topicArn: string;
  subject: string;

  constructor() {}
}
