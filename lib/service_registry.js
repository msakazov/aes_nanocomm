const axios = require("axios");

const serviceRegistry = {}; // Singleton registry of services
let currentService; // Current service instance

const getCurrentService = () => currentService;
const setCurrentService = (service) => {
  currentService = service;
};

const getRegistry = () => serviceRegistry;
const addService = ({ serviceName, url }) => {
  if (!serviceName || !url) {
    throw new Error("Service name and URL are required");
  }
  if (serviceRegistry[serviceName]) {
    throw new Error(`Service ${serviceName} already exists`);
  }
  serviceRegistry[serviceName] = {
    endpoint: axios.create({
      baseURL: url,
      timeout: 10000,
    }),
    metadata: { serviceName, url },
  };
};
const getService = (serviceName) => {
  try {
    return serviceRegistry[serviceName].endpoint;
  } catch (e) {
    throw new Error(`Service ${serviceName} not found`);
  }
};
const getServiceMetadata = (serviceName) => {
  try {
    return serviceRegistry[serviceName].metadata;
  } catch (e) {
    throw new Error(`Service ${serviceName} not found`);
  }
};
const removeService = (serviceName) => {
  delete serviceRegistry[serviceName];
};

module.exports = {
  getCurrentService,
  setCurrentService,
  getRegistry,
  addService,
  getService,
  getServiceMetadata,
  removeService,
};
