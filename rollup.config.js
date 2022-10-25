import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import livereload from 'rollup-plugin-livereload';
import visualizer from 'rollup-plugin-visualizer';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import replace from '@rollup/plugin-replace';
import analyze from 'rollup-plugin-analyzer';
import dev from 'rollup-plugin-dev';
import { createApp } from './scripts/oidc-provider';

import pkg from './package.json';

const EXPORT_NAME = 'auth0';

const isProduction = process.env.NODE_ENV === 'production';
const shouldGenerateStats = process.env.WITH_STATS === 'true';
const defaultDevPort = 3000;
const serverPort = process.env.DEV_PORT || defaultDevPort;

const visualizerOptions = {
  filename: 'bundle-stats/index.html'
};

const getPlugins = shouldMinify => {
  return [
    webWorkerLoader({
      targetPlatform: 'browser',
      sourceMap: !isProduction,
      preserveSource: !isProduction,
      pattern: /^(?!(?:[a-zA-Z]:)|\/).+\.worker\.ts$/
    }),
    resolve({
      browser: true
    }),
    commonjs(),
    typescript({
      clean: true,
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        noEmit: false,
        sourceMap: true,
        compilerOptions: {
          lib: ['dom', 'es6']
        }
      }
    }),
    replace({
      'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
      preventAssignment: false
    }),
    shouldMinify
      ? terser()
      : terser({
          compress: false,
          mangle: false,
          format: { beautify: true }
        }),
    sourcemaps()
  ];
};

const getStatsPlugins = () => {
  if (!shouldGenerateStats) return [];
  return [visualizer(visualizerOptions), analyze({ summaryOnly: true })];
};

let bundles = [
  {
    input: 'src/index.ts',
    output: {
      name: EXPORT_NAME,
      file: 'dist/auth0-spa-js.development.js',
      format: 'umd',
      sourcemap: true
    },
    plugins: [
      ...getPlugins(false),
      !isProduction &&
        dev({
          dirs: ['dist', 'static'],
          port: serverPort,
          extend(app, modules) {
            app.use(modules.mount(createApp({ port: serverPort })));
          }
        }),
      !isProduction && livereload()
    ],
    watch: {
      clearScreen: false
    }
  }
];

if (isProduction) {
  bundles = bundles.concat(
    {
      input: 'src/index.ts',
      output: [
        {
          name: EXPORT_NAME,
          file: 'dist/auth0-spa-js.production.js',
          format: 'umd'
        }
      ],
      plugins: [...getPlugins(isProduction), ...getStatsPlugins()]
    },
    {
      input: 'src/index.ts',
      output: [
        {
          file: pkg.module,
          format: 'esm'
        }
      ],
      plugins: getPlugins(isProduction)
    },
    {
      input: 'src/index.ts',
      output: [
        {
          name: EXPORT_NAME,
          file: pkg.main,
          format: 'cjs'
        }
      ],
      plugins: getPlugins(false)
    }
  );
}
export default bundles;
