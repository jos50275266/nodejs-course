const http = require("http");
const fs = require("fs");
const Route = require("route-parser");

const router = (() => {
  let routes = [];
  const ext = 1;

  const mimetype = {
    ".plain": "text/plain",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".gif": "image/gif",
    ".png": "image/png",
    ".jpeg": "image/jpeg",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
    ".midi": "audio/midi",
    ".mpeg": "audio/mpeg",
    ".weba": "audio/webm",
    ".oga": "audio/ogg",
    ".wav": "audio/wav",
    ".webm": "video/webm",
    ".ogv": "video/ogg",
  };

  const addRoute = (method, url, handler) => {
    routes.push({ method, url: new Route(url), handler });
  };

  const findRoute = (method, url) => {
    const route = routes.find((route) => {
      return route.method === method && route.url.match(url);
    });

    if (!route) return null;

    return {
      handler: route.handler,
      params: route.url.match(url),
      method: method,
    };
  };

  const get = (route, handler) => addRoute("get", route, handler);
  const post = (route, handler) => addRoute("post", route, handler);

  const static = (dir) => {
    fs.readdir(dir, (err, files) => {
      files.forEach((file) => {
        let parsedURL = "";
        let isExt = file.split(".")[1];
        if (isExt) {
          parsedURL = "." + isExt;

          if (parsedURL in mimetype) {
            fs.readFile(`./${dir}/${file}`, (err, data) => {
              if (err) {
                return;
              }

              addRoute("get", "/" + file, (req, res) => {
                res.send(data);
              });
            });
          }
        }
      });
    });
  };

  const router = () => {
    const listen = (port, cb) => {
      http
        .createServer((req, res) => {
          const method = req.method.toLowerCase();
          const url = req.url.toLowerCase();
          const found = findRoute(method, url);

          if (found) {
            req.params = found.params;
            res.send = (content) => {
              if (content) {
                let isStatic = url.split(".")[ext];
                if (isStatic) {
                  let extname = mimetype["." + isStatic];

                  res.writeHead(200, {
                    "Content-Type": extname,
                  });

                  res.end(content);
                } else {
                  res.writeHead(200, {
                    "Content-Type": "text/html",
                  });
                  res.end(content);
                }
              } else {
                res.writeHead(404, {
                  "Content-Type": "text/html",
                });
                res.end("<h1>Failed to render Page...</h1>");
              }
            };

            return found.handler(req, res);
          } else {
            console.log("hello");
            console.log(found);
          }

          res.writeHead(404, { "Content-Type": "text/html" });
          res.end("<h1>Route not found.</h1>");
        })
        .listen(port, cb);
    };

    return {
      get,
      post,
      listen,
      static,
    };
  };

  return router;
})();

module.exports = router;
