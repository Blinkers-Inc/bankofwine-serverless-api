const path = require("path");
const slsw = require("serverless-webpack");
const webpack = require("webpack");
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: slsw.lib.entries,
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  stats: "minimal",
  output: {
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, '.webpack'),
    filename: '[name].js'
  },
  resolve: {
    extensions: [".js", ".json", ".ts"],
    modules: [path.resolve(__dirname), "node_modules"],
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },  
  externals: [nodeExternals()],
  plugins: [
    new webpack.DefinePlugin({ "global.GENTLY": false }),
    new CopyWebpackPlugin({ patterns: ["./prisma/schema.prisma"] })
  ],
};
