#!/usr/bin/env node

import "dotenv/config";
import minimist from "minimist";
import { startServer } from "../lib/server.js";

const args = minimist(process.argv.slice(2));

const showHelp = () => {
  console.log(`
  Usage: nanocomm-server [options]
  
  Options:      
      --serverName      Name of the server (optional, defaults to aes-nanocomm-server), ENV: NANOCOMM_SERVER_NAME
      --port            Port for the server (optional, defaults to 3000), ENV: NANOCOMM_PORT      
      --debug           Enable debug mode (optional, defaults to false), ENV: NANOCOMM_DEBUG
      --help            Show this help message
  Commands:
      start             Start the nanocomm server    
      `);
  process.exit(0);
};

if (args.help) {
  showHelp();
}

process.env.NANOCOMM_SERVER_NAME || "aes-nanocomm-server";

let serverName =
  args.serverName || process.env.NANOCOMM_SERVER_NAME || "aes-nanocomm-server";
let port = args.port || process.env.NANOCOMM_PORT || 3000;
let debug = args.debug || process.env.NANOCOMM_DEBUG || false;

// Handle the "start" command
if (args._[0] === "start") {
  console.log("Starting NANOCOMM SERVER...");
  startServer({ serverName, port, debug });
} else {
  console.error(
    "Error: Unknown command. Use --help to see available commands."
  );
  process.exit(1);
}
