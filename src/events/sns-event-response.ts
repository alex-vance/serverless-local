import xml from "xml";

export class SnsEventResponse {
  PublishResponse: any[] = [];

  constructor(messageId: string, requestId: string) {
    this.PublishResponse.push({ _attr: { xmlns: "http://sns.amazonaws.com/doc/2010-03-31/" } });
    this.PublishResponse.push({ PublishResult: [{ MessageId: messageId }] });
    this.PublishResponse.push({ ResponseMetadata: [{ RequestId: requestId }] });
  }

  toXml(): string {
    return xml(this as any);
  }
}

// const payload = {
//   PublishResponse: [
//     {
//       _attr: {
//         xmlns: "http://sns.amazonaws.com/doc/2010-03-31/",
//       },
//     },
//     {
//       PublishResult: [
//         {
//           MessageId: messageId,
//         },
//       ],
//     },
//     {
//       ResponseMetadata: [
//         {
//           RequestId: v4(),
//         },
//       ],
//     },
//   ],
// };
