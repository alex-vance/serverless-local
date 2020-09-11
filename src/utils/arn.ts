export interface Arn {
  partition: string;
  service: string;
  region: string;
  accountId: string;
  resourceType?: string;
  resourceId: string;

  toString: () => string;
}

export function isArn(arn: string): boolean {
  const split = arn.split(":");

  return split.length === 6 || split.length === 7;
}

export function parseArn(arn: string): Arn {
  const split = arn.split(":");

  let resourceId, resourceType;

  if (split.length === 7) {
    resourceType = split[5];
    resourceId = split[6];
  } else if (split[5].indexOf("/") !== -1) {
    const resource = split[5].split("/");
    resourceType = resource[0];
    resourceId = resource[1];
  } else {
    resourceId = split[5];
  }

  return {
    partition: split[1],
    service: split[2],
    region: split[3],
    accountId: split[4],
    resourceType,
    resourceId,
  };
}
