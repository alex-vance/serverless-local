"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authorizer = exports.Identity = exports.RequestContext = exports.ProxyIntegrationEvent = void 0;
const logger_1 = __importDefault(require("../logger"));
const fakeBaseUrl = "http://localhost";
class ProxyIntegrationEvent {
    constructor(req, stage, resourcePath) {
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
    parseBody(body) {
        try {
            return JSON.stringify(body);
        }
        catch (error) {
            logger_1.default.log("received malformed json body, passing as is", error);
            return body;
        }
    }
    parsePathParams(reqParams) {
        if (!reqParams)
            return null;
        let params = {};
        for (let [key, value] of Object.entries(reqParams)) {
            if (key == "0")
                params["proxy"] = value.substring(1);
            //removes first slash
            else
                params[key] = value;
        }
        return params;
    }
    parseMultiValueHeaders(headers) {
        if (!headers || !headers.length)
            return;
        const multiValueHeaders = {};
        for (let i = 0; i < headers.length; i += 2) {
            const key = headers[i].toLocaleLowerCase();
            const value = headers[i + 1];
            if (multiValueHeaders[key])
                multiValueHeaders[key].push(value);
            else
                multiValueHeaders[key] = [value];
        }
        return multiValueHeaders;
    }
    parseQuery(pathWithQuery) {
        const url = new URL(pathWithQuery, fakeBaseUrl);
        const { searchParams } = url;
        if (Array.from(searchParams).length === 0) {
            return;
        }
        let query = {};
        let multiValueQuery = {};
        for (let [key, value] of searchParams) {
            query[key] = value;
            if (multiValueQuery[key])
                multiValueQuery[key].push(value);
            else
                multiValueQuery[key] = [value];
        }
        return { query, multiValueQuery };
    }
}
exports.ProxyIntegrationEvent = ProxyIntegrationEvent;
class RequestContext {
    constructor(params) {
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
exports.RequestContext = RequestContext;
class Identity {
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
exports.Identity = Identity;
class Authorizer {
    constructor() {
        this.principalId = "sls-local-principalId";
    }
}
exports.Authorizer = Authorizer;
