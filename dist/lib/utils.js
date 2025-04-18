import path from "path";
import { readFile } from "fs/promises";
export const loadPlugins = async (app) => {
    const packageJson = JSON.parse(await readFile(path.resolve(process.cwd(), "package.json"), "utf-8"));
    const nanocommPlugins = packageJson.nanocommPlugins || {}; // Load plugins from package.json
    await Promise.all(Object.entries(nanocommPlugins)
        .filter(([_, pluginOptions]) => pluginOptions.enabled)
        .map(([pluginName, pluginOptions]) => loadPlugin(app, pluginName, pluginOptions)));
};
const loadPlugin = async (app, pluginName, pluginOptions) => {
    try {
        const { default: plugin } = (await import(`aes_nanocomm-plugin-${pluginName}`));
        await plugin(app, pluginOptions); // Pass the app and plugin-specific options
        console.log(`Loaded plugin: ${pluginName}`);
    }
    catch (error) {
        throw new Error(`Failed to load plugin ${pluginName}: ${error}`);
    }
};
