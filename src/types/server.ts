import { NextFunction, RequestHandler } from "express";
import { Service } from "./service.js";
import { Socket } from "net";
import { IncomingMessage, ServerResponse } from "http";

export interface StartServerOptions {
  serverName?: string;
  port?: number;
  debug?: boolean;
}

export interface NanocommService extends Service {
  client: Socket;
  proxy: RequestHandler<IncomingMessage, ServerResponse, NextFunction>;
}

export type NanocommServices = Map<string, NanocommService>;
