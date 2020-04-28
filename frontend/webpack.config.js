const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: "./src/index.tsx",
  mode: "development",
  output: {
    path: path.resolve(__dirname, 'public/build'),
    filename: 'bundle.js',
    library: 'shop',
    libraryTarget: 'window',
    libraryExport: 'default'
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        include: /src|_proto/,
        exclude: /node_modules/,
        loader: "ts-loader"
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx"]
  }
};
