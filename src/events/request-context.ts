import Identity from "./identity";
import Authorizer from "./authorizer";

export interface RequestContextParams {
  stage: string;
  path: string;
  resourcePath: string;
  httpVersion: string;
  httpMethod: string;
}

export default class RequestContext {
  accountId: string;
  resourceId: string;
  domainName: string;
  domainPrefix: string;
  stage: string;
  requestId: string;
  requestTime: string;
  requestTimeEpoch: number;
  extendedRequestId: string;
  path: string;
  resourcePath: string;
  protocol: string;
  httpMethod: string;
  apiId: string;
  identity: Identity;
  authorizer: Authorizer;

  constructor(params: RequestContextParams) {
    this.accountId = "sls-local-accountId";
    this.resourceId = "sls-local-resourceId";
    this.domainName = "sls-local-domainName";
    this.domainPrefix = "sls-local-domainPrefix";
    this.stage = params.stage;
    this.requestId = "sls-local-requestid";
    this.requestTime = new Date().toString();
    this.requestTimeEpoch = new Date().getTime();
    this.extendedRequestId = "sls-local-extendedRequestId";
    this.path = params.path;
    this.resourcePath = `/${params.stage}${params.resourcePath}`;
    this.protocol = `HTTP/${params.httpVersion}`;
    this.httpMethod = params.httpMethod;
    this.apiId = "sls-local-apiId";
    this.identity = new Identity();
    this.authorizer = new Authorizer();
  }
}
