import express from "express";
import logger from "../logger";

const fakeBaseUrl = "http://localhost";

export class ProxyIntegrationEvent {
  body: object;
  headers: object;
  httpMethod: string;
  isBase64Encoded: boolean;
  multiValueHeaders?: object;
  multiValueQueryStringParameters?: any;
  path: string;
  pathParameters: object | null;
  queryStringParameters?: any;
  requestContext: object;
  resource: string;

  constructor(req: express.Request, stage: string, resourcePath: string) {
    const queries = this.parseQuery(req.url);

    this.body = this.parseBody(req.body) || null;
    this.headers = req.headers;
    this.multiValueHeaders = this.parseMultiValueHeaders(req.rawHeaders);
    this.httpMethod = req.method;
    this.isBase64Encoded = false;
    this.path = req.path;
    this.resource = req.path;
    this.pathParameters = this.parsePathParams(req.params);
    this.queryStringParameters = queries ? queries.query : null;
    this.multiValueQueryStringParameters = queries ? queries.multiValueQuery : null;
    this.requestContext = new RequestContext({ stage, httpMethod: req.method, path: this.path, resourcePath, httpVersion: req.httpVersion });
  }

  private parseBody(body: any) {
    try {
      return JSON.stringify(body);
    } catch (error) {
      logger.log("received malformed json body, passing as is", error);
      return body;
    }
  }

  private parsePathParams(reqParams: any) {
    if (!reqParams) return null;

    let params = {};

    for (let [key, value] of Object.entries(reqParams)) {
      if (key == "0") params["proxy"] = (value as string).substring(1);
      //removes first slash
      else params[key] = value;
    }

    return params;
  }

  private parseMultiValueHeaders(headers: string[]): object | undefined {
    if (!headers || !headers.length) return;

    const multiValueHeaders = {};

    for (let i = 0; i < headers.length; i += 2) {
      const key = headers[i].toLocaleLowerCase();
      const value = headers[i + 1];

      if (multiValueHeaders[key]) multiValueHeaders[key].push(value);
      else multiValueHeaders[key] = [value];
    }

    return multiValueHeaders;
  }

  private parseQuery(pathWithQuery: string): { query: object | undefined; multiValueQuery: object | undefined } | undefined {
    const url = new URL(pathWithQuery, fakeBaseUrl);
    const { searchParams } = url;

    if (Array.from(searchParams).length === 0) {
      return;
    }

    let query = {};
    let multiValueQuery = {};

    for (let [key, value] of searchParams) {
      query[key] = value;
      if (multiValueQuery[key]) multiValueQuery[key].push(value);
      else multiValueQuery[key] = [value];
    }

    return { query, multiValueQuery };
  }
}
export interface RequestContextParams {
  stage: string;
  path: string;
  resourcePath: string;
  httpVersion: string;
  httpMethod: string;
}

export class RequestContext {
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

export class Identity {
  accessKey: string | null;
  cognitoIdentityPoolId: string;
  accountId: string;
  cognitoIdentityId: string;
  principalOrgId: string | null;
  caller: string;
  apiKey: string;
  sourceIp: string;
  cognitoAuthenticationType: string;
  cognitoAuthenticationProvider: string;
  userArn: string;
  userAgent: string;
  user: string;

  constructor() {
    this.accessKey = null;
    this.cognitoIdentityPoolId = "sls-local-cognitoIdentityPoolId";
    this.accountId = "sls-local-accountId";
    this.cognitoIdentityId = "sls-local-cognitoIdentityId";
    this.principalOrgId = null;
    this.caller = "sls-local-caller";
    this.apiKey = "sls-local-apikey";
    this.sourceIp = "127.0.0.1";
    this.cognitoAuthenticationType = "sls-local-cognitoAuthenticationtype";
    this.cognitoAuthenticationProvider = "sls-local-cognitoAuthenticationProvider";
    this.userArn = "sls-local-userArn";
    this.userAgent = "sls-local-userAgent";
    this.user = "sls-local-user";
  }
}

export class Authorizer {
  principalId: string;

  constructor() {
    this.principalId = "sls-local-principalId";
  }
}
