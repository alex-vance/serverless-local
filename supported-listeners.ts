export interface Listener {
  event: string;
  port: number;
}

export const HTTP_LISTENER: Listener = {
  event: "http",
  port: 4001,
};

export const SNS_LISTENER: Listener = {
  event: "sns",
  port: 4002,
};

export const SUPPORTED_LISTENERS: Listener[] = [HTTP_LISTENER, SNS_LISTENER];
