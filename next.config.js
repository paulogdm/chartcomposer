const path = require("path");
const withCSS = require("@zeit/next-css");

const SWPrecacheWebpackPlugin = require("sw-precache-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

// TODO: how to import from utils/constants?
const APP_NAME = "ChartComposer";

module.exports = withCSS({
  target: "server",
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
        name: APP_NAME,
        short_name: "CC",
        description: `${APP_NAME} lets you create and share sheet music with your friends.`,
        background_color: "#ffffff",
        theme_color: "#eeeeee",
        display: "standalone",
        orientation: "portrait",
        fingerprints: false,
        inject: false,
        start_url: "/",
        ios: {
          "apple-mobile-web-app-title": APP_NAME,
          "apple-mobile-web-app-status-bar-style": "#eeeeee",
        },
        icons: [
          {
            src: path.resolve("public/icon.png"),
            sizes: [96, 128, 144, 192, 256, 384, 512],
            destination: "public",
          },
        ],
        //includeDirectory: true,
        publicPath: "/_next",
      }),
    );

    config.plugins.push(
      new MonacoWebpackPlugin({
        languages: ["markdown"],
        features: [
          //"accessibilityHelp",
          "bracketMatching",
          //"caretOperations",
          "clipboard",
          "codeAction",
          //"codelens",
          "colorDetector",
          "comment",
          //"contextmenu",
          "coreCommands",
          "cursorUndo",
          //"dnd",
          //"find",
          "folding",
          //"fontZoom",
          "format",
          //"goToDefinitionCommands",
          //"goToDefinitionMouse",
          //"gotoError",
          //"gotoLine",
          //"hover",
          //"inPlaceReplace",
          //"inspectTokens",
          "iPadShowKeyboard",
          //"linesOperations",
          //"links",
          //"multicursor",
          //"parameterHints",
          //"quickCommand",
          //"quickOutline",
          //"referenceSearch",
          //"rename",
          //"smartSelect",
          //"snippets",
          //"suggest",
          //"toggleHighContrast",
          //"toggleTabFocusMode",
          //"transpose",
          //"wordHighlighter",
          //"wordOperations",
          //"wordPartOperations",
        ],
      }),
    );

    return config;
  },
});
