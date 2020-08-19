import express from "express";
import logger from "../logger";
import RequestContext from "./request-context";

const fakeBaseUrl = "http://localhost";

export default class ProxyIntegrationEvent {
  body: object;
  headers: object;
  httpMethod: string;
  isBase64Encoded: boolean;
  multiValueHeaders?: object;
  multiValueQueryStringParameters?: any;
  path: string;
  pathParameters: object;
  queryStringParameters?: any;
  requestContext: object;
  resource: string;

  constructor(req: express.Request, stage: string) {
    const path = this.parsePath(req.path, stage);

    this.body = this.parseBody(req.body);
    this.headers = req.headers;
    this.multiValueHeaders = this.parseMultiValueHeaders(req.rawHeaders);
    this.httpMethod = req.method;
    this.isBase64Encoded = false;
    this.path = path;
    this.resource = path;
    this.pathParameters = req.params;
    this.queryStringParameters = this.parseQueryStringParameters(req.url) || null;
    this.multiValueQueryStringParameters = this.parseMultiValueQueryStringParameters(req.query) || null;
    this.requestContext = new RequestContext({ stage, httpMethod: this.httpMethod, resourcePath: this.path });
  }

  private parseBody(body: any) {
    try {
      return JSON.stringify(body);
    } catch (error) {
      logger.log("received malformed json body, passing as is", error);
      return body;
    }
  }

  private parsePath(path: string, stage: string) {
    return path.replace(`/${stage}`, "");
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

  private parseQueryStringParameters(pathWithQuery: string): object | undefined {
    const url = new URL(pathWithQuery, fakeBaseUrl);
    const { searchParams } = url;

    if (!searchParams.keys.length) return;

    return Object.fromEntries(searchParams);
  }

  private parseMultiValueQueryStringParameters(query: any) {
    if (!query) return;
    if (!Object.entries(query).length) return;

    return query;
  }
}
