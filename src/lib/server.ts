import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { loadPlugins } from "./utils.js";
import ipc from "node-ipc";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const currentVersion = require("../../package.json").version;

const app = express();

import {
  NanocommServices,
  NanocommService,
  StartServerOptions,
} from "../types/server.js";

// Store registered services
let nanocomm_services: NanocommServices = new Map();

const startServer = async (options: StartServerOptions = {}) => {
  const {
    serverName = "aes-nanocomm-server",
    port = 3000,
    debug = false,
  } = options;

  nanocomm_services.clear();

  // Load plugins
  await loadPlugins(app);

  // Notify all existing services about the new service
  // and notify the new service about all existing services
  const notifyNewService = (new_service: NanocommService) => {
    nanocomm_services.forEach((service, serviceName) => {
      // Only notify if the service is not the one that just registered
      if (serviceName !== new_service.serviceName) {
        // Notify all existing services about the new service
        ipc.server.emit(service.client, "new-service", {
          serviceName: new_service.serviceName,
          url: new_service.url,
        });
        // Notify the new service about the available services
        ipc.server.emit(new_service.client, "new-service", {
          serviceName: service.serviceName,
          url: service.url,
        });
      }
    });
  };

  // Notify all remaining services about the unregistered service
  const notifyServiceRemoved = (removed_service: NanocommService) => {
    nanocomm_services.forEach((service: NanocommService) => {
      ipc.server.emit(service.client, "service-removed", {
        serviceName: removed_service.serviceName,
        url: removed_service.url,
      });
    });
  };

  const registerService = (service: NanocommService, client: any) => {
    const { ver, serviceName, port: servicePort, debug } = service;

    // Check for version mismatch from package.json
    if (!ver || ver !== currentVersion) {
      const message = `Version mismatch: expected ${currentVersion}, got ${ver}`;
      console.log(`[${serverName}]`, message);
      ipc.server.emit(client, "error", { message });
      return;
    }

    if (nanocomm_services.has(serviceName)) {
      const message = `Service "${serviceName}" is already registered.`;
      console.log(`[${serverName}]`, message);
      ipc.server.emit(client, "error", { message });
      return;
    }
    // Attach proxy middleware for this base path
    const proxy = createProxyMiddleware({
      target: `http://localhost:${servicePort}`,
      changeOrigin: true,
    });

    app.use(`/api/${serviceName}`, proxy);

    service = {
      ...service,
      url: `http://localhost:${port}/api/${serviceName}`,
      proxy,
      client,
    };

    nanocomm_services.set(serviceName, service);
    client.id = serviceName;

    const message = `Service: ${serviceName} at ${service.url} registered`;
    console.log(`[${serverName}]`, message);
    ipc.server.emit(client, "status", { event: "registered", message });

    notifyNewService(service);
  };

  const unregisterService = (serviceName: string) => {
    const service = nanocomm_services.get(serviceName);
    if (!service) {
      console.log(`[${serverName}]`, `Service ${serviceName} not found.`);
      return;
    }

    const { proxy, url } = service;
    // Remove the dynamic route for the module

    /* @ts-ignore */
    app.router.stack = app.router.stack.filter(
      /* @ts-ignore */
      (layer) => !(layer.handle === proxy)
    );

    nanocomm_services.delete(serviceName);
    const message = `Service "${serviceName}" at ${url} unregistered.`;
    console.log(`[${serverName}]`, message);
    ipc.server.emit(service.client, "status", {
      event: "unregistered",
      message,
    });

    notifyServiceRemoved(service);
  };

  const notifyShutdown = () => {
    nanocomm_services.forEach((service, serviceName) => {
      const message = `Service "${serviceName}" at ${service.url} unregistered.`;
      console.log(`[${serverName}] SHUT DOWN`, message);
      ipc.server.emit(service.client, "status", {
        event: "unregistered",
        message,
      });
    });
  };

  // IPC config
  ipc.config.id = serverName;
  ipc.config.retry = 1500;
  ipc.config.silent = !debug;

  // Register new services
  ipc.serve(() => {
    ipc.server.on("register", (service, client) => {
      registerService(service, client);
    });

    ipc.server.on("unregister", (service, client) => {
      client.id && unregisterService(client.id);
    });

    // Handle socket disconnection
    ipc.server.on("socket.disconnected", (client, serviceName) => {
      if (nanocomm_services.get(serviceName)) unregisterService(serviceName);
    });

    process.on("SIGINT", () => {
      notifyShutdown();
      process.exit();
    });
  });

  app.use("/status", (req, res) => {
    res.json({
      message: "Server running",
      services: [...nanocomm_services.values()].map(({ serviceName, url }) => ({
        serviceName,
        url,
      })),
    });
  });

  ipc.server.start();

  app.listen(port, (error) => {
    if (error) {
      console.error(`[${serverName}]`, "Error starting server:", error);
      process.exit(1);
    }
    console.log(`[${serverName}]`, `NANOCOMM SERVER Listening at port ${port}`);
  });
};

export { ipc, app, nanocomm_services, startServer };
