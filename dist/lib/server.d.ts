import ipc from "node-ipc";
declare const app: import("express-serve-static-core").Express;
import { NanocommServices, StartServerOptions } from "../types/server.js";
declare let nanocomm_services: NanocommServices;
declare const startServer: (options?: StartServerOptions) => Promise<void>;
export { ipc, app, nanocomm_services, startServer };
