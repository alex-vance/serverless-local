export interface Route {
  path?: string;
  port: number;
  method: string;
  endpoint: string;
  topics?: string[];
}
