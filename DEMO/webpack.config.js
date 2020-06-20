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
          // Creates `style` nodes from CommonJS strings
          'style-loader',
          // Translates CSS into CommonJS strings
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
    ],
  },
  // devServer: {
  //   contentBase: path.join(__dirname, 'dist'),
  // },
}
