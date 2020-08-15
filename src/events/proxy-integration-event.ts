import express from "express";
import http from "http";
import logger from "../logger";
import RequestContext from "./request-context";

// {
//   "resource": "Resource path",
//   "path": "Path parameter",
//   "httpMethod": "Incoming request's method name"
//   "headers": {String containing incoming request headers}
//   "multiValueHeaders": {List of strings containing incoming request headers}
//   "queryStringParameters": {query string parameters }
//   "multiValueQueryStringParameters": {List of query string parameters}
//   "pathParameters":  {path parameters}
//   "stageVariables": {Applicable stage variables}
//   "requestContext": {Request context, including authorizer-returned key-value pairs}
//   "body": "A JSON string of the request payload."
//   "isBase64Encoded": "A boolean flag to indicate if the applicable request payload is Base64-encode"
// }

const fakeBaseUrl = "http://localhost";

export default class ProxyIntegrationEvent {
  body: object;
  headers: object;
  httpMethod: string;
  isBase64Encoded: boolean;
  multiValueHeaders?: Map<string, string[]>;
  multiValueQueryStringParameters?: any;
  path: string;
  pathParameters: object;
  queryStringParameters?: object;
  requestContext: object;
  resource: string;

  constructor(req: express.Request) {
    this.body = req.body;
    this.headers = req.headers;
    this.multiValueHeaders = this.parseMultiValueHeaders(req.rawHeaders);
    this.httpMethod = req.method;
    this.isBase64Encoded = false;
    this.path = req.path;
    this.resource = req.path;
    this.pathParameters = req.params;
    this.queryStringParameters = this.parseQueryStringParameters(req.url);
    this.multiValueQueryStringParameters = req.query;
    this.requestContext = new RequestContext();
  }

  private parseMultiValueHeaders(headers: string[]): Map<string, string[]> {
    if (!headers || !headers.length) return new Map();

    const multiValueHeadersMap = new Map();

    for (let i = 0; i < headers.length; i += 2) {
      const key = headers[i].toLocaleLowerCase();
      const value = headers[i + 1];

      if (multiValueHeadersMap.has(key)) {
        multiValueHeadersMap[key].push(value);
      } else {
        multiValueHeadersMap.set(key, [value]);
      }
    }
    return multiValueHeadersMap;
  }
  
  private parseQueryStringParameters(pathWithQuery: string): object | undefined {
    const url = new URL(pathWithQuery, fakeBaseUrl);
    const { searchParams } = url;

    return Object.fromEntries(searchParams);
  }
}
