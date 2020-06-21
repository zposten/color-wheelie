const path = require('path')

module.exports = {
  mode: 'development',
  entry: ['./main.js', './index.scss'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: [
          // 3. Creates `style` nodes from CommonJS strings
          {loader: 'style-loader'},
          // 2. Translates CSS into CommonJS strings
          {loader: 'css-loader'},
          // 1. Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sassOptions: {
                includePaths: ['../node_modules'], // https://github.com/sass/node-sass#includepaths
              },
            },
          },
        ],
      },
    ],
  },
  // devServer: {
  //   contentBase: path.join(__dirname, 'dist'),
  // },
}
