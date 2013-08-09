(function() {
  var cmd, exec, http, jtMonitor, os, server;

  jtMonitor = require('../index');

  os = require('os');

  http = require('http');

  jtMonitor.start({
    checkInterval: 2 * 1000,
    memoryLimits: [10, 13, 150],
    loadavgLimits: [0.6, 0.65, 1],
    freeMemoryLimits: [0.9, 512, 256],
    cpuUsageLimits: [30, 50, 80],
    cbf: function(err, info) {
      if (!err && info) {
        return console.dir(info);
      }
    }
  });

  if (process.platform !== 'win32') {
    exec = require('child_process').exec;
    cmd = "ps -p " + process.pid + " -o %cpu";
    jtMonitor.addChecker(function(cbf) {
      return exec(cmd, function(err, result) {
        var usage, _ref;
        if (result) {
          usage = (_ref = result.split('\n')[1]) != null ? _ref.trim() : void 0;
          return cbf(null, {
            type: 'cpu',
            level: 2,
            value: usage
          });
        }
      });
    });
  }

  setTimeout(function() {});

  server = http.createServer(function(req, res) {
    return res.send(200, 'hello world');
  });

  server.listen(8080);

}).call(this);
