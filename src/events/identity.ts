export default class Identity {
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
