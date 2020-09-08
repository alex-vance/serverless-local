export class SnsEventRequest {
  action: string;
  topicArn: string;
  subject: string;
  message: string;
  messageStructure: string;
  version: string;
  messageAttributes: any;

  constructor(rawRequest: any) {
    this.action = rawRequest.Action;
    this.topicArn = rawRequest.TopicArn;
    this.subject = rawRequest.Subject;
    this.messageStructure = rawRequest.MessageStructure;
    this.message = rawRequest.Message;
    this.version = rawRequest.Version;

    this.parseMessageAttributes(rawRequest);
  }

  parseMessageAttributes(rawRequest: any) {
    this.messageAttributes = Object.keys(rawRequest)
      .filter((k) => k.startsWith("MessageAttributes.entry"))
      .reduce((prev: string[], curr: string) => {
        const mai = curr[curr.search(/\d/)];
        if (prev.includes(mai)) return prev;
        return [...prev, mai];
      }, [])
      .reduce((prev: any, mai: string) => {
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
