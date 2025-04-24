const express = require("express");
const { serviceRegistry } = require("aes_nanocomm");

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
const services = serviceRegistry.getRegistry();

app.use("/test", (req, res) => {
  console.log(`Test endpoint hit, data:`, req.body);
  console.log(`Test endpoint hit, query:`, req.query);
  console.log(`Test endpoint hit, headers:`, req.headers);
  console.log(`Test endpoint hit, params:`, req.params);
  if (Array.isArray(req.body)) req.body.push({ test: "OK" });
  else req.body.test = "OK";
  res.json(req.body || { message: "No data received" });
});

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
