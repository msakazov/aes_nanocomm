const app = require("./app");

const port = process.env.PORT || 0;
const host = process.env.HOST || "localhost";

const server = app.listen(port, host, () => {
  const port = server.address().port;
  console.log(`Service is running on http://${host}:${port}`);
});
