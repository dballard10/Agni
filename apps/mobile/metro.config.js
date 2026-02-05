const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

// Find the project root (monorepo root)
const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot]

// Let Metro know where to find packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Ensure we resolve packages from the monorepo
config.resolver.disableHierarchicalLookup = true

module.exports = config
