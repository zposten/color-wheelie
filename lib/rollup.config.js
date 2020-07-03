import path from 'path'
import babel from '@rollup/plugin-babel'

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'es', // Output bundle should use ES Module syntax
    sourcemap: true,
    exports: 'named', // Export multiple named modules instead of a single default one
  },
  // Do not include any 3rd party libraries in the bundled code
  external: id => !id.startsWith('.') && !path.isAbsolute(id),
  plugins: [
    babel({
      // Do not include the babel helper functions in the bundled code code,
      // instead, expect the user of this library to provide it
      // See: https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
      // See: https://babeljs.io/docs/en/babel-plugin-transform-runtime#why
      babelHelpers: 'runtime',
      // See: https://github.com/rollup/rollup-plugin-commonjs/issues/361#issuecomment-462945953
      exclude: /node_modules/,
    }),
  ],
}
