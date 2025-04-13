const path = require("path");
const ipc = require("node-ipc").default;
const os = require("os");

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

  const server = app.listen(port, () => {
    const actualPort = server.address().port;
    const serviceProcess = `${serviceName}-${os.userInfo().username}-${
      process.env.NODE_ENV || "dev"
    }`;

    console.log(
      `[${serviceProcess}]`,
      `Service is running on port ${actualPort}`
    );

    ipc.config.id = serviceProcess;
    ipc.config.retry = 1500;
    ipc.config.silent = !debug;

    ipc.connectTo(nanocommServer, () => {
      ipc.of[nanocommServer].on("connect", () => {
        ipc.of[nanocommServer].emit("register", {
          name: serviceProcess,
          port: actualPort,
          basePath: `${serviceName}`,
          debug,
        });
      });

      ipc.of[nanocommServer].on("error", (data) => {
        console.error(`[${serviceProcess}]`, data.message);
      });

      ipc.of[nanocommServer].on("status", (data) => {
        console.log(`[${serviceProcess}]`, data.message);
      });

      process.on("SIGINT", () => {
        ipc.of[nanocommServer].emit("unregister", {
          name: serviceProcess,
          basePath: `${serviceName}`,
        });
        process.exit();
      });
    });
  });
}

module.exports = { startService };
