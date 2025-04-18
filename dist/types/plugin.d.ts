import { Application } from "express";
export type NanocommPlugins = {
    [pluginName: string]: PluginOptions;
};
export type Plugin = (app: Application, pluginOptions: PluginOptions) => void | Promise<void>;
export type PluginOptions = {
    enabled: boolean;
} & Record<string, any>;
