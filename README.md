# jtmonitor - 监控系统性能的工具，默认可以监控系统loadavg、空闲内存、node使用的内存

##特性
- 根据定义的级别数值，获取当前系统性能状态，返回不同的结果

###Demo
```js
(function() {
  var http, jtMonitor, server;

  jtMonitor = require('jtmonitor');

  http = require('http');

  jtMonitor.start({
  	// 检测间隔，单位ms
    checkInterval: 6 * 1000,
    // node使用内存的预警线，单位MB
    memoryLimits: [10, 13, 150],
    // os load平均值（使用每5分钟的平均值，以单核为准，若多核会根据CPU核数自动调整数值）
    loadavgLimits: [0.6, 0.65, 1],
    // 空闲内存，单位MB,若为小数则表示系统总内存*该值
    freeMemoryLimits: [0.9, 512, 256],
    cbf: function(err, info) {
      return console.dir(info);
    }
  });
	// 自定义监控
  jtMonitor.addChecker(function(cbf) {
    return cbf(null, {
      type: 'test',
      level: 2,
      value: 100
    });
  });

  server = http.createServer(function(req, res) {
    return res.send(200, 'hello world');
  });

  server.listen(8080);

}).call(this);

```