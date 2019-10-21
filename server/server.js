const { createServer } = require("http");
const express = require("express");
const fs = require("fs");
const { join } = require("path");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = express();

    server.get("/folder/:folderId/song/:songId/:songName", (req, res) => {
      const actualPage = "/";
      const queryParams = {
        folderId: req.params.folderId,
        songId: req.params.songId,
      };
      console.log("QUERY PARAMS", queryParams);
      app.render(req, res, actualPage, queryParams);
    });

    server.get("*", (req, res) => {
      return handle(req, res);
    });

    server.listen(port, err => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error("serving error", err.stack);
    process.exit(1);
  });
