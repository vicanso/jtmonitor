jtMonitor = require '../index'
http = require 'http'
jtMonitor.start {
  # 检测间隔，单位ms
  checkInterval : 2 * 1000
  # node使用内存的预警线，单位MB
  memoryLimits : [10, 13, 150]
  # os load平均值（使用每5分钟的平均值，以单核为准，若多核会根据CPU核数自动调整数值）
  loadavgLimits : [0.6, 0.65, 1]
  # 空闲内存，单位MB,若为小数则表示系统总内存*该值
  freeMemoryLimits : [0.9, 512, 256]
  # 这里的实现方法在windows下面检测不了
  cpuUsageLimits : [30, 50, 80]
  # 检测的回调函数
  cbf : (err, info) ->
    if !err && info
      console.dir info

}
if process.platform != 'win32'
  exec = require('child_process').exec
  cmd = "ps -p #{process.pid} -o %cpu"
  jtMonitor.addChecker (cbf) ->
    exec cmd, (err, result) ->
      if result
        usage = result.split('\n')[1]?.trim()
        cbf null, {
          type : 'cpu'
          level : 2
          value : usage
        }

setTimeout ->


server = http.createServer (req, res) ->
  res.send 200, 'hello world'
server.listen 8080