const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const ipc = require("node-ipc").default;
const app = express();

const packageJson = require("../package.json");
const currentVersion = packageJson.version;

const startServer = (options = {}) => {
  const {
    serverName = "aes-nanocomm-server",
    port = 3000,
    debug = false,
  } = options;

  // Store registered services
  let nanocomm_services = new Map();

  // Notify all existing services about the new service
  // and notify the new service about all existing services
  const notifyNewService = (new_service) => {
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
  const notifyServiceRemoved = (removed_service) => {
    nanocomm_services.forEach((service) => {
      ipc.server.emit(service.client, "service-removed", {
        serviceName: removed_service.serviceName,
        url: removed_service.url,
      });
    });
  };

  const registerService = (service, client) => {
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
      pathRewrite: (path, req) => path.replace(serviceName, ""), // remove prefix
      logLevel: debug ? "debug" : "silent",
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

  const unregisterService = (serviceName) => {
    const service = nanocomm_services.get(serviceName);
    if (!service) {
      console.log(`[${serverName}]`, `Service ${serviceName} not found.`);
      return;
    }

    const { proxy, url } = service;
    // Remove the dynamic route for the module
    app.router.stack = app.router.stack.filter(
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

  app.listen(port, () => {
    console.log(`[${serverName}]`, `NANOCOMM SERVER Listening at port ${port}`);
  });
};

module.exports = { ipc, app, startServer };
