import Serverless from "serverless";

export default function getFunctions(sls: Serverless) : Serverless.FunctionDefinition[] {
  return sls.service.getAllFunctions().map(fn => sls.service.getFunction(fn));
};
