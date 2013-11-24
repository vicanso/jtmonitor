MBSize = 1024 * 1024
events = require 'events'
os = require 'os'
cpuUsageExec = require('child_process').exec
cpuUsageCmd = "ps -p #{process.pid} -o %cpu"
noop = ->
class JTMonitor extends events.EventEmitter
  ###*
   * start 开始监控
   * @param  {[type]} @options =             {} [description]
   * @return {[type]}          [description]
  ###
  start : (@options = {}) ->
    @_checkHandlers = []
    @options.checkInterval ?= 30 * 1000
    checkInterval = @options.checkInterval
    
    @_setMemoryCheck()
    @_setCpuUsageCheck()
    @_setFreeMemoryCheck()
    @_setLoadavgCheck()
    setTimeout =>
      @_check checkInterval
    , checkInterval
  addChecker : (checker) ->
    @_checkHandlers.push checker
  ###*
   * _check 定时执行check任务
   * @param  {[type]} checkInterval [description]
   * @return {[type]}               [description]
  ###
  _check : (checkInterval) ->
    for func in @_checkHandlers
      func.apply @
    setTimeout =>
      @_check checkInterval
    , checkInterval
  _setLoadavgCheck : ->
    loadavgLimits = @options.loadavgLimits
    if loadavgLimits
      cpuTotal = os.cpus().length
      for loadavg, i in loadavgLimits
        loadavgLimits[i] = loadavg * cpuTotal
      @_checkHandlers.push @_checkLoadavg
  ###*
   * _checkLoadavg 检测系统的load avg（每5分钟的）
   * @return {[type]} [description]
  ###
  _checkLoadavg : ->
    loadavgLimits = @options.loadavgLimits
    result = null
    if loadavgLimits?.length >= 2
      loadavg = os.loadavg()[1]
      level = @_getIndex loadavgLimits, loadavg
      result =
        category : 'loadavg'
        level : level
        value : GLOBAL.parseFloat loadavg.toFixed 2
        date : new Date
      @emit 'log', result
  _setFreeMemoryCheck : ->
    freeMemoryLimits = @options.freeMemoryLimits
    if freeMemoryLimits
      totalmem = Math.floor os.totalmem() / MBSize
      for freeMemory, i in freeMemoryLimits
        freeMemory = freeMemoryLimits[i]
        if freeMemory != GLOBAL.parseInt(freeMemory) && freeMemory < 1
          freeMemoryLimits[i] = freeMemory * totalmem
      @_checkHandlers.push @_checkFreememory
  ###*
   * _checkFreememory 检测可用内存
   * @return {[type]} [description]
  ###
  _checkFreememory : ->
    freeMemoryLimits = @options.freeMemoryLimits
    result = null
    if freeMemoryLimits?.length >= 2
      freeMemory = Math.floor os.freemem() / MBSize
      level = @_getIndex freeMemoryLimits, freeMemory
      result =
        category : 'freeMemory'
        level : level
        value : GLOBAL.parseFloat freeMemory.toFixed 2
        date : new Date
      @emit 'log', result
  _setMemoryCheck : ->
    if @options.memoryLimits
      @_checkHandlers.push @_checkMemory
  ###*
   * _checkMemory 检测node使用了的内存
   * @return {[type]} [description]
  ###
  _checkMemory : ->
    memoryLimits = @options.memoryLimits
    result = null
    if memoryLimits?.length >= 2
      memoryUsage = process.memoryUsage()
      memoryUseTotal = Math.floor (memoryUsage.rss) / MBSize
      level = @_getIndex memoryLimits, memoryUseTotal
      result =
        category : 'memoryUsage'
        level : level
        value : GLOBAL.parseFloat memoryUseTotal.toFixed 2
        date : new Date
      @emit 'log', result
  _setCpuUsageCheck : ->
    if @options.cpuUsageLimits
      @_checkHandlers.push @_checkCpuUsage
  ###*
   * _checkCpuUsage 检测CPU的使用率，使用ps命令
   * @return {[type]}     [description]
  ###
  _checkCpuUsage : ->
    cpuUsageLimits = @options.cpuUsageLimits
    cpuUsageExec cpuUsageCmd, (err, result) =>
      if result
        usage = result.split('\n')[1]?.trim()
        if usage
          usage = GLOBAL.parseFloat usage
          level = @_getIndex cpuUsageLimits, usage
          result = {
            category : 'cpuUsage'
            level : level
            value : GLOBAL.parseFloat usage.toFixed 2
            date : new Date
          }
          @emit 'log', result

  ###*
   * _getIndex 获取在数组中的位置
   * @param  {[type]} arr   [description]
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
  ###
  _getIndex : (arr, value) ->
    index = arr.length
    cardinal = 1
    if arr[0] > arr[1]
      cardinal = -1
    for checkValue, i in arr
      if (checkValue - value) * cardinal > 0
        index = i
        break
    index
module.exports = JTMonitor