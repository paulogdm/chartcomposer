const path = require("path");
const withCSS = require("@zeit/next-css");
const withOffline = require("next-offline");
const withManifest = require("next-manifest");

const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

// TODO: how to import from utils/constants?
const APP_NAME = "SongDocs";

const IS_DEV = process.env.NODE_ENV === "development";

const manifest = {
  output: path.join(__dirname, "public"),
  name: "SongDocs",
  description: `${APP_NAME} lets you create and share sheet music with your friends.`,
  icons: [
    {
      src: "/icon-64.png",
      sizes: "64x64",
      type: "image/png",
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

module.exports = withCSS(
  withManifest(
    withOffline({
      target: "server",
      manifest,
      workboxOpts: {
        swDest: path.join(__dirname, "public/service-worker.js"),
      },
      publicRuntimeConfig: {
        // Will be available on both server and client
        DROPBOX_APP_KEY: process.env.DROPBOX_APP_KEY,
        DROPBOX_APP_SECRET: process.env.DROPBOX_APP_SECRET,
        DROPBOX_PUBLIC_TOKEN: process.env.DROPBOX_PUBLIC_TOKEN,
        IS_DEV,
      },
      webpack: config => {
        config.plugins.push(
          new MonacoWebpackPlugin({
            //output: path.join(__dirname, "public"),
            //output: "public",
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
    }),
  ),
);
