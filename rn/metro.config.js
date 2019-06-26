const path = require("path");

module.exports = {
  watchFolders: [
    path.resolve(__dirname, `../`),
    path.resolve(__dirname, `../context`),
    path.resolve(__dirname, `../components`),
    path.resolve(__dirname, `../utils`),
  ],
};
