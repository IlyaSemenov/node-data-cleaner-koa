import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.umd.js',
    format: 'umd',
    name: 'dataCleaner',
    sourcemap: true,
  },
  plugins: [
    typescript(),
  ],
  external: [
    'data-cleaner',
    'http-errors',
    'koa-body',
  ]
}
