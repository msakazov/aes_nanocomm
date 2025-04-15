const path = require("path");
const ipc = require("node-ipc").default;

const {
  getCurrentService,
  setCurrentService,
  addService,
  removeService,
} = require("./service_registry");

const packageJson = require("../package.json");
const currentVersion = packageJson.version;

function startService(options = {}) {
  const {
    appPath,
    serviceName,
    nanocommServer = "aes-nanocomm-server",
    port = 0,
    debug = false,
  } = options;

  const absoluteAppPath = path.resolve(appPath);
  const app = require(absoluteAppPath);

  app.use("/status", (req, res) => {
    res.json({
      status: "OK",
      service: getCurrentService(),
      message: `Service is running`,
    });
  });

  const server = app.listen(port, () => {
    const actualPort = server.address().port;

    console.log(`[${serviceName}]`, `Service is running on port ${actualPort}`);

    ipc.config.id = serviceName;
    ipc.config.retry = 1500;
    ipc.config.silent = !debug;

    ipc.connectTo(nanocommServer, () => {
      ipc.of[nanocommServer].on("connect", () => {
        ipc.of[nanocommServer].emit("register", {
          ver: currentVersion,
          serviceName,
          port: actualPort,
          debug,
        });
      });

      ipc.of[nanocommServer].on("error", (data) => {
        console.error(`[${serviceName}]`, data.message);
        process.exit(1);
      });

      ipc.of[nanocommServer].on("status", (data) => {
        console.log(`[${serviceName}]`, data.message);
      });

      ipc.of[nanocommServer].on("new-service", (service) => {
        console.log(`[${serviceName}] New service available:`, service);
        addService(service);
      });

      ipc.of[nanocommServer].on("service-removed", (service) => {
        console.log(`[${serviceName}] Service removed:`, service);
        removeService(service.serviceName);
      });

      process.on("SIGINT", () => {
        ipc.of[nanocommServer].emit("unregister", {
          serviceName,
        });
        process.exit();
      });

      setCurrentService({
        serviceName,
        port: actualPort,
      });
    });
  });
}

module.exports = { startService };
