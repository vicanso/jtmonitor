jtMonitor = require '../index'
http = require 'http'
jtMonitor.start {
  # 检测间隔，单位ms
  checkInterval : 6 * 1000
  # node使用内存的预警线，单位MB
  memoryLimits : [10, 13, 150]
  # os load平均值（使用每5分钟的平均值，以单核为准，若多核会根据CPU核数自动调整数值）
  loadavgLimits : [0.6, 0.65, 1]
  # 空闲内存，单位MB,若为小数则表示系统总内存*该值
  freeMemoryLimits : [0.5, 512, 256]
  # 检测的回调函数，对应上面的三个值的三个回调
  handlers : [
    (msg) ->
      console.info msg
    (msg) ->
      console.warn msg
    (msg) ->
      console.error msg
  ]
}
server = http.createServer (req, res) ->
  if req.url == '/restart'
    process.send {cmd : 'restart'}
  else if req.url == '/forcerestart'
    process.send {cmd : 'forcerestart'}
  res.writeHead 200
  res.end 'hello world'
server.listen 8000