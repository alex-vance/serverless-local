import Identity from "./identity";

export default class RequestContext {

  accountId: string;
  resourceId: string;
  stage: string;
  requestId: string;
  resourcePath: string;
  httpMethod: string;
  apiId: string;
  identity: Identity;

  constructor() {
    this.identity = new Identity();
  }
}