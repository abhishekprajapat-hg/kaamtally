// The app's lib modules are ES modules, but node:test runs CommonJS here.
// Compile anything under src/lib on require, using the Babel that Expo already
// installs — so unit tests need no extra dependency and no build step.
const path = require('path');
const { transformFileSync } = require('@babel/core');
const cjs = require.resolve('@babel/plugin-transform-modules-commonjs');

const LIB = path.join('src', 'lib');
const original = require.extensions['.js'];

require.extensions['.js'] = function (mod, filename) {
  if (!filename.includes(LIB)) return original(mod, filename);
  const { code } = transformFileSync(filename, { babelrc: false, configFile: false, plugins: [cjs] });
  return mod._compile(code, filename);
};
