import express from "express";
import ipc from "node-ipc";
import { loadPlugins } from "./utils.js";
import { getCurrentService, setCurrentService, addService, removeService, } from "./service_registry.js";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const currentVersion = require("../../package.json").version;
async function startService(options) {
    const { app: serviceApp, serviceName, nanocommServer, port = 0, debug = false, } = options;
    const app = express();
    // Load plugins
    await loadPlugins(app);
    app.use("/", serviceApp);
    app.use("/status", (req, res) => {
        res.json({
            status: "OK",
            service: getCurrentService(),
            message: `Service is running`,
        });
    });
    const server = app.listen(port, (error) => {
        if (error) {
            console.error(`[${serviceName}]`, "Error starting service:", error);
            process.exit(1);
        }
        /* @ts-ignore */
        const actualPort = server.address().port;
        console.log(`[${serviceName}]`, `Service is running on port ${actualPort}`);
        ipc.config.id = serviceName;
        ipc.config.retry = 1500;
        ipc.config.silent = !debug;
        const currentService = {
            ver: currentVersion,
            serviceName,
            port: actualPort,
            debug,
        };
        ipc.connectTo(nanocommServer, () => {
            ipc.of[nanocommServer].on("connect", () => {
                ipc.of[nanocommServer].emit("register", currentService);
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
            setCurrentService(currentService);
        });
    });
}
export { startService };
