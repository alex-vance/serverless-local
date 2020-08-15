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
  user?: string;

  constructor() {}
}
