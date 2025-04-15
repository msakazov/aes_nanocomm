# AES Nanocomm

AES Nanocomm is a lightweight communication framework for managing microservices. It provides a server to register services and enables seamless communication between them using IPC (Inter-Process Communication).

## Features

- Dynamic service registration and unregistration.
- Proxying requests to registered services.
- Debugging support for development.
- Graceful shutdown handling.

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd aes_nanocomm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Starting the Nanocomm Server

The Nanocomm Server manages the registered services and proxies requests to them.

```bash
node ./bin/nanocomm-server.js start [options]
```

#### Options:

- `--serverName`: Name of the server (default: `aes-nanocomm-server`).
- `--port`: Port for the server (default: `3000`).
- `--debug`: Enable debug mode (default: `false`).

Example:

```bash
node ./bin/nanocomm-server.js start --port 4000 --debug
```

### Starting a Nanocomm Service

A Nanocomm Service is a microservice that registers itself with the Nanocomm Server.

```bash
node ./bin/nanocomm-service.js start [options]
```

#### Options:

- `--appPath`: Path to the application file (required).
- `--serviceName`: Name of the service (default: `package.json` name).
- `--servicePort`: Port for the service (default: `0` for dynamic port assignment).
- `--nanocommServer`: Name of the Nanocomm Server (default: `aes-nanocomm-server`).
- `--debug`: Enable debug mode (default: `false`).

Example:

```bash
node ./bin/nanocomm-service.js start --appPath ./services/myApp.js --serviceName myService --servicePort 5000 --debug
```

## START USING PM2

- Start Server: pm2 start nanocomm-server.json
- Start Service (examples/express_service): pm2 start test_service.json

### API Endpoints

#### Nanocomm Server

- `/status`: Returns the status of the server and a list of registered services.

#### Registered Services

- `/api/<serviceName>`: Proxies requests to the corresponding service.

## Environment Variables

You can use environment variables as an alternative to command-line options:

- `APP_PATH`: Path to the application file.
- `SERVICE_NAME`: Name of the service.
- `SERVICE_PORT`: Port for the service.
- `NANOCOMM_SERVER_NAME`: Name of the Nanocomm Server.
- `NANOCOMM_DEBUG`: Enable debug mode.
- `NANOCOMM_PORT`: Port for the Nanocomm Server.

## Development

### Running Tests

To be implemented.

### Debugging

Enable debug mode using the `--debug` option or the `NANOCOMM_DEBUG` environment variable.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
