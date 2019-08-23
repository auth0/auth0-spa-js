import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import visualizer from 'rollup-plugin-visualizer';

import pkg from './package.json';

const EXPORT_NAME = 'createAuth0Client';

const isProduction = process.env.NODE_ENV === 'production';
const shouldGenerateStats = process.env.WITH_STATS === 'true';
const getPlugins = shouldMinify => {
  return [
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
    shouldMinify && terser(),
    sourcemaps()
  ];
};

let bundles = [
  {
    input: 'src/index.ts',
    output: {
      name: EXPORT_NAME,
      file: 'dist/auth0-spa-js.development.js',
      format: 'umd'
    },
    plugins: [
      ...getPlugins(false),
      !isProduction &&
        serve({
          contentBase: ['dist', 'static'],
          open: true,
          port: 3000
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
          file: pkg.browser,
          format: 'umd'
        }
      ],
      plugins: [
        ...getPlugins(isProduction),
        shouldGenerateStats && visualizer()
      ]
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
      plugins: getPlugins(false),
      external: Object.keys(pkg.dependencies)
    }
  );
}
export default bundles;
