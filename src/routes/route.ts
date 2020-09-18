export interface Route {
  is_ready(): boolean;
  path?: string;
  port: number;
  method: string;
  endpoint: string;
  topics?: string[];
}
