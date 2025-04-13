const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const ipc = require("node-ipc").default;
const app = express();

const startServer = (options = {}) => {
  const {
    serverName = "aes-nanocomm-server",
    port = 3000,
    debug = false,
  } = options;

  // Store registered services
  let nanocomm_services = {};
  // IPC config
  ipc.config.id = serverName;
  ipc.config.retry = 1500;
  ipc.config.silent = !debug;

  // Register new services
  ipc.serve(() => {
    ipc.server.on("register", (data, client) => {
      const { name: serviceName, port: servicePort, basePath, debug } = data;

      if (nanocomm_services[basePath]) {
        const message = `Service with path "${basePath}" is already registered.`;
        console.log(`[${serverName}]`, message);
        ipc.server.emit(client, "error", { message });
        return;
      }
      // Attach proxy middleware for this base path
      const proxy = createProxyMiddleware({
        target: `http://localhost:${servicePort}`,
        changeOrigin: true,
        pathRewrite: (path, req) => path.replace(basePath, ""), // remove prefix
        logLevel: debug ? "debug" : "silent",
      });

      nanocomm_services[basePath] = { ...data, proxy, client };

      app.use(`/api/${basePath}`, proxy);

      const message = `Service: ${serviceName} on port ${servicePort} at api/${basePath} registered`;
      console.log(`[${serverName}]`, message);
      ipc.server.emit(client, "status", { event: "registered", message });
    });

    ipc.server.on("unregister", (data) => {
      const { name: serviceName, basePath } = data;

      if (!nanocomm_services[basePath]) {
        console.log(
          `[${serverName}]`,
          `Service with path "${basePath}" is not registered.`
        );
        return;
      }

      const { proxy, client } = nanocomm_services[basePath];
      // Remove the dynamic route for the module
      app.router.stack = app.router.stack.filter(
        (layer) => !(layer.handle === proxy)
      );

      delete nanocomm_services[basePath];
      const message = `Service "${serviceName}" at api/${basePath} unregistered.`;
      console.log(`[${serverName}]`, message);
      ipc.server.emit(client, "status", { event: "unregistered", message });
    });

    process.on("SIGINT", () => {
      Object.entries(nanocomm_services).forEach(
        ([serviceName, { basePath, client }]) => {
          const message = `Service "${serviceName}" at api/${basePath} unregistered.`;
          console.log(`[${serverName}]`, message);
          ipc.server.emit(client, "status", { event: "unregistered", message });
        }
      );
      process.exit();
    });
  });

  app.use("/status", (req, res) => {
    res.json({
      message: "NANOCOMM SERVER is running",
      services: nanocomm_services,
    });
  });

  ipc.server.start();

  app.listen(port, () => {
    console.log(`[${serverName}]`, `NANOCOMM SERVER Listening at port ${port}`);
  });
};

module.exports = { ipc, app, startServer };
