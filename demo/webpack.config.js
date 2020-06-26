const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: ['./src/main.js', './src/index.scss'],
  output: {
    path: path.join(__dirname, 'dist'),
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
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
  },
}
