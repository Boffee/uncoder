const webpack = require("webpack");
const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const fileExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2",
];

const isDev = process.env.NODE_ENV == "development";

module.exports = {
  mode: process.env.NODE_ENV || "development",
  devtool: isDev ? "cheap-module-source-map" : undefined,
  optimization: isDev
    ? undefined
    : {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            extractComments: false,
          }),
        ],
      },
  entry: {
    content: "./src/Content/index.tsx",
    background: "./src/Background/index.ts",
    popup: "./src/Popup/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, "./build"),
    filename: "[name].bundle.js",
    publicPath: process.env.ASSET_PATH || "/",
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        loader: "file-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
      { test: /\.(ts|tsx)$/, loader: "ts-loader", exclude: /node_modules/ },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: "source-map-loader",
          },
          {
            loader: "babel-loader",
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: fileExtensions
      .map((extension) => "." + extension)
      .concat([".js", ".jsx", ".ts", ".tsx", ".css"]),
    plugins: [new TsconfigPathsPlugin()],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: true,
    }),
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "Popup", "index.html"),
      filename: "popup.html",
      chunks: ["popup"],
      cache: false,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "static/manifest.json",
          to: "./",
          force: true,
          transform: function (content, path) {
            // generates the manifest file using the package.json informations
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              })
            );
          },
        },
      ],
    }),
  ],
};
