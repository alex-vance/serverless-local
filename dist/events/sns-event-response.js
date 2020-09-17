"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnsEventResponse = void 0;
const xml_1 = __importDefault(require("xml"));
class SnsEventResponse {
    constructor(messageId, requestId) {
        this.PublishResponse = [];
        this.PublishResponse.push({ _attr: { xmlns: "http://sns.amazonaws.com/doc/2010-03-31/" } });
        this.PublishResponse.push({ PublishResult: [{ MessageId: messageId }] });
        this.PublishResponse.push({ ResponseMetadata: [{ RequestId: requestId }] });
    }
    toXml() {
        return xml_1.default(this);
    }
}
exports.SnsEventResponse = SnsEventResponse;
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
