import { RequestHandler } from "express";
import { AxiosInstance } from "axios";

export interface StartServiceOptions {
  app: RequestHandler;
  serviceName: string;
  nanocommServer: string;
  port: number;
  debug?: boolean;
}

export interface Service {
  ver: string;
  serviceName: string;
  port: number;
  debug: boolean;
  url?: string;
  endpoint?: AxiosInstance;
}

export type ServiceRegistry = Record<string, Service>;
