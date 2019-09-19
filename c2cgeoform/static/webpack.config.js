const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'development',
  entry: {
    polyfills: path.resolve(__dirname, 'src','polyfills.js'),
    index: [ '@babel/polyfill/noConflict', path.resolve(__dirname, 'src', 'index.js')],
    styles: path.resolve(__dirname, 'src', 'scss', 'main.scss'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Development',
      template: 'src/index.html',
    }),
    new MiniCssExtractPlugin(),
  ],
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
    port: 4200,
    proxy: {
      '/rest-api': {
        target: 'http://localhost:8181',
        secure: false,
      },
      '/proxy': {
        target: 'http://localhost:8282',
        secure: false,
        pathRewrite: {
          '^/proxy': '/',
        },
      },
    },
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', {
            }],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              sourceMap: true,
            },
          },
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
}
