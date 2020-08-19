export default class Identity {
  cognitoIdentityPoolId: string;
  accountId: string;
  cognitoIdentityId: string;
  caller: string;
  apiKey: string;
  sourceIp: string;
  cognitoAuthenticationtype: string;
  cognitoAuthenticationProvider: string;
  userArn: string;
  userAgent: string;
  user: string;

  constructor() {
    this.cognitoIdentityPoolId = 'sls-local-cognitoIdentityPoolId';
    this.accountId = 'sls-local-accountId';
    this.cognitoIdentityId = 'sls-local-cognitoIdentityId';
    this.caller = 'sls-local-caller';
    this.apiKey = 'sls-local-apikey';
    this.sourceIp = '127.0.0.1';
    this.cognitoAuthenticationtype = 'sls-local-cognitoAuthenticationtype';
    this.cognitoAuthenticationProvider = 'sls-local-cognitoAuthenticationProvider';
    this.userArn = 'sls-local-userArn';
    this.userAgent = 'sls-local-userAgent';
    this.user = 'sls-local-user';
  }
}
