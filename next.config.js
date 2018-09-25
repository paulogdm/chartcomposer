const path = require("path");

const SWPrecacheWebpackPlugin = require("sw-precache-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");

module.exports = {
  publicRuntimeConfig: {
    // Will be available on both server and client
    DROPBOX_APP_KEY: process.env.DROPBOX_APP_KEY,
    DROPBOX_APP_SECRET: process.env.DROPBOX_APP_SECRET,
    DROPBOX_PUBLIC_TOKEN: process.env.DROPBOX_PUBLIC_TOKEN,
    IS_DEV: process.env.NODE_ENV === "development",
  },
  webpack: config => {
    config.plugins.push(
      new SWPrecacheWebpackPlugin({
        verbose: true,
        staticFileGlobsIgnorePatterns: [/\.next\//],
        runtimeCaching: [
          {
            handler: "networkFirst",
            urlPattern: /^https?.*/,
          },
        ],
      }),
    );
    config.plugins.push(
      new WebpackPwaManifest({
        name: "ChartComposer",
        short_name: "ChartComposer",
        description:
          "ChartComposer lets you create and share sheet music with your friends.",
        background_color: "#ffffff",
        theme_color: "#eeeeee",
        display: "standalone",
        orientation: "portrait",
        fingerprints: false,
        inject: false,
        start_url: "/",
        ios: {
          "apple-mobile-web-app-title": "ChartComposer",
          "apple-mobile-web-app-status-bar-style": "#eeeeee",
        },
        icons: [
          {
            src: path.resolve("static/icon.png"),
            sizes: [96, 128, 192, 256, 384, 512],
            destination: "static",
          },
        ],
        //includeDirectory: true,
        publicPath: "/_next",
      }),
    );

    return config;
  },
};
