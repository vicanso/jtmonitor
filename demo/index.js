(function() {
  var http, jtMonitor, server;

  jtMonitor = require('../index');

  http = require('http');

  jtMonitor.start({
    checkInterval: 6 * 1000,
    memoryLimits: [10, 13, 150],
    loadavgLimits: [0.6, 0.65, 1],
    freeMemoryLimits: [0.5, 512, 256],
    handlers: [
      function(msg) {
        return console.info(msg);
      }, function(msg) {
        return console.warn(msg);
      }, function(msg) {
        return console.error(msg);
      }
    ]
  });

  server = http.createServer(function(req, res) {
    if (req.url === '/restart') {
      process.send({
        cmd: 'restart'
      });
    } else if (req.url === '/forcerestart') {
      process.send({
        cmd: 'forcerestart'
      });
    }
    res.writeHead(200);
    return res.end('hello world');
  });

  server.listen(8000);

}).call(this);
