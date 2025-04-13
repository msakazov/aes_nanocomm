#!/usr/bin/env node

const { startService } = require("../lib/service");
const args = require("minimist")(process.argv.slice(2));
const path = require("path");
const fs = require("fs");

const showHelp = () => {
  console.log(`
Usage: nanocomm-service [options]

Options:
    --appPath         Path to the application file (required), ENV: APP_PATH
    --serviceName     Name of the service (optional, defaults to package.json name), ENV: SERVICE_NAME
    --servicePort     Port for the service (optional, defaults to 0), ENV: SERVICE_PORT
    --nanocommServer  Name of the nanocomm server (optional, defaults to "aes-nanocomm-server"), ENV: NANOCOMM_SERVER_NAME
    --debug           Enable debug mode (optional, defaults to false), ENV: NANOCOMM_DEBUG
    --help            Show this help message
Commands:
    start             Start the nanocomm service    
    `);
  process.exit(0);
};

if (args.help) {
  showHelp();
}

// Handle the "start" command
if (args._[0] === "start") {
  const appPath = args.appPath || process.env.APP_PATH;
  let serviceName = args.serviceName || process.env.SERVICE_NAME;
  const port = args.servicePort || process.env.SERVICE_PORT || 0;
  const nanocommServer =
    args.nanocommServer ||
    process.env.NANOCOMM_SERVER_NAME ||
    "aes-nanocomm-server";
  const debug = args.debug || process.env.NANOCOMM_DEBUG || false;

  // If no serviceName is provided, try to read it from package.json
  if (!serviceName) {
    const appPathParts = appPath.split(path.sep);
    const rootPath = appPathParts.slice(0, 2).join(path.sep); // Get the first level in the app path
    const packageJsonPath = path.join(rootPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath);
      serviceName = packageJson.name;
    }
  }

  if (!appPath) {
    console.error("❌ Please provide the app file as an argument or env var");
    process.exit(1);
  }

  if (!serviceName) {
    console.error(
      "❌ Please provide the serviceName as an argument or env var"
    );
    process.exit(1);
  }

  console.log(`Starting service "${serviceName}" on port ${port}...`);
  startService({ appPath, serviceName, port, nanocommServer, debug });
} else {
  console.error(
    "Error: Unknown command. Use --help to see available commands."
  );
  process.exit(1);
}
