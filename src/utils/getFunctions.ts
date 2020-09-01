import Serverless from "serverless";

export function getFunctions(sls: Serverless) : Serverless.FunctionDefinition[] {
  return sls.service.getAllFunctions().map(fn => sls.service.getFunction(fn));
};
