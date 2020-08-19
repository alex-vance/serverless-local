import Identity from "./identity";

export interface RequestContextParams {
  stage: string;
  resourcePath: string;
  httpMethod: string;
}

export default class RequestContext {
  accountId: string;
  resourceId: string;
  stage: string;
  requestId: string;
  resourcePath: string;
  httpMethod: string;
  apiId: string;
  identity: Identity;

  constructor(params: RequestContextParams) {
    this.accountId = "sls-local-accountId";
    this.resourceId = "sls-local-resourceId";
    this.stage = params.stage;
    this.resourcePath = params.resourcePath;
    this.httpMethod = params.httpMethod;
    this.apiId = 'sls-local-apiId';
    this.identity = new Identity();
  }
}
