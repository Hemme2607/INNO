// Metro bundler-konfiguration der deler node_modules i monorepoet.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (_target, name) => {
      return path.join(workspaceRoot, "node_modules", name);
    },
  }
);

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
