#!/usr/bin/env node

/**
 * Guard script to prevent running `npm install` directly inside a workspace folder.
 * This ensures all dependencies are managed from the root via npm workspaces.
 */

const path = require('path');

// INIT_CWD is the directory where the npm command was originally run.
const initCwd = process.env.INIT_CWD;
const currentCwd = process.cwd();

// If someone runs `npm install` inside a workspace folder, initCwd will be that folder.
// If run from the root, initCwd will be the root.
if (initCwd && path.resolve(initCwd) === path.resolve(currentCwd)) {
  console.error('\n' + '='.repeat(60));
  console.error('ERROR: Do not run npm commands directly in a workspace folder.');
  console.error('Please run all installs from the project root:');
  console.error('  npm install <pkg> --workspace=@agni/web');
  console.error('  npm install <pkg> --workspace=@agni/desktop');
  console.error('  npm install <pkg> --workspace=@agni/mobile');
  console.error('='.repeat(60) + '\n');
  process.exit(1);
}
