import axios, { AxiosInstance } from "axios";
import { Service, ServiceRegistry } from "../types/service.js";

const serviceRegistry: ServiceRegistry = {}; // Singleton registry of services
let currentService: Service; // Current service instance

const getCurrentService = () => currentService;
const setCurrentService = (service: Service) => {
  currentService = service;
};

const getRegistry = () => serviceRegistry;
const addService = (service: Service) => {
  if (!service.serviceName || !service.url) {
    throw new Error("Service name and URL are required");
  }
  if (serviceRegistry[service.serviceName]) {
    throw new Error(`Service ${service.serviceName} already exists`);
  }

  service.endpoint = axios.create({
    baseURL: service.url,
    timeout: 10000,
  });

  serviceRegistry[service.serviceName] = service;
};
const getService = (serviceName: string): AxiosInstance | undefined => {
  const service = serviceRegistry[serviceName];
  return service ? service.endpoint : undefined;
};
const getServiceMetadata = (serviceName: string): Service => {
  try {
    return serviceRegistry[serviceName];
  } catch (e) {
    throw new Error(`Service ${serviceName} not found`);
  }
};
const removeService = (serviceName: string) => {
  delete serviceRegistry[serviceName];
};

export {
  getCurrentService,
  setCurrentService,
  getRegistry,
  addService,
  getService,
  getServiceMetadata,
  removeService,
};
