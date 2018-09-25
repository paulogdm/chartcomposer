const { createServer } = require("http");
const { join } = require("path");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const STATIC_FILES = [
  "/manifest.json",
  "/service-worker.js",
  //"/favicon.ico",
  //"/robots.txt",
];

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (STATIC_FILES.indexOf(pathname) !== -1) {
      const filePath = join(__dirname, ".next", pathname);
      console.log("GO STATIC " + pathname + " :: " + filePath);
      app.serveStatic(req, res, filePath);
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
