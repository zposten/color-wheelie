import babel from 'rollup-plugin-babel'

export default {
  input: 'index.js',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
  },
  external: ['d3', 'chroma-js'],
  plugins: [babel()],
}
