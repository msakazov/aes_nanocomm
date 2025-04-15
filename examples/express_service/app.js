const express = require("express");
const { serviceRegistry } = require("aes_nanocomm");

const app = express();
const services = serviceRegistry.getRegistry();

app.get("/service_comm", (req, res) => {
  console.log(`Services available:`);
  if (Object.keys(serviceRegistry).length === 0) {
    console.log(`No services available`);
    res.status(404).json({ message: `No services available` });
  } else {
    const serviceResponses = Object.entries(services).map(
      async ([serviceName, service]) => {
        console.log(
          `Service Name: ${serviceName}`,
          `Service Details:`,
          service
        );

        return {
          service,
          response: (await service.endpoint.get("/status")).data,
        };
      }
    );

    Promise.all(serviceResponses).then((responses) => {
      res.json(responses);
    });
  }
});

module.exports = app;
