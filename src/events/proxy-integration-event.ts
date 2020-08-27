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
