MBSize = 1024 * 1024
os = require 'os'
cpuUsageExec = require('child_process').exec
cpuUsageCmd = "ps -p #{process.pid} -o %cpu"
noop = ->
monitor = 
	###*
	 * start 开始监控
	 * @param  {[type]} @options =             {} [description]
	 * @return {[type]}          [description]
	###
	start : (@options = {}) ->
		@_checkHandlers = []
		@options.checkInterval ?= 3 * 1000
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
		handler = @options.cbf
		if handler
			results = []
			for func in @_checkHandlers
				func handler
		setTimeout =>
			@_check checkInterval
		, checkInterval
	_setLoadavgCheck : ->
		loadavgLimits = @options.loadavgLimits
		if loadavgLimits
			cpuTotal = os.cpus().length
			for loadavg, i in loadavgLimits
				loadavgLimits[i] = loadavg * cpuTotal
			@_checkHandlers.push (cbf) =>
				@_checkLoadavg cbf
	###*
	 * _checkLoadavg 检测系统的load avg（每5分钟的）
	 * @return {[type]} [description]
	###
	_checkLoadavg : (cbf = noop) ->
		loadavgLimits = @options.loadavgLimits
		result = null
		if loadavgLimits?.length >= 2
			loadavg = os.loadavg()[1]
			level = @_getIndex loadavgLimits, loadavg
			result =
				type : 'loadavg'
				level : level
				value : loadavg
		cbf null, result
	_setFreeMemoryCheck : ->
		freeMemoryLimits = @options.freeMemoryLimits
		if freeMemoryLimits
			totalmem = Math.floor os.totalmem() / MBSize
			for freeMemory, i in freeMemoryLimits
				freeMemory = freeMemoryLimits[i]
				if freeMemory != GLOBAL.parseInt(freeMemory) && freeMemory < 1
					freeMemoryLimits[i] = freeMemory * totalmem
			@_checkHandlers.push (cbf) =>
				@_checkFreememory cbf
	###*
	 * _checkFreememory 检测可用内存
	 * @return {[type]} [description]
	###
	_checkFreememory : (cbf = noop) ->
		freeMemoryLimits = @options.freeMemoryLimits
		result = null
		if freeMemoryLimits?.length >= 2
			freeMemory = Math.floor os.freemem() / MBSize
			level = @_getIndex freeMemoryLimits, freeMemory
			result =
				type : 'freeMemory'
				level : level
				value : freeMemory
		cbf null, result
	_setMemoryCheck : ->
		if @options.memoryLimits
			@_checkHandlers.push (cbf) =>
				@_checkMemory cbf
	###*
	 * _checkMemory 检测node使用了的内存
	 * @return {[type]} [description]
	###
	_checkMemory : (cbf = noop) ->
		memoryLimits = @options.memoryLimits
		result = null
		if memoryLimits?.length >= 2
			memoryUsage = process.memoryUsage()
			memoryUseTotal = Math.floor (memoryUsage.rss + memoryUsage.heapTotal) / MBSize
			level = @_getIndex memoryLimits, memoryUseTotal
			result =
				type : 'memoryUsage'
				level : level
				value : memoryUseTotal
		cbf null, result
	_setCpuUsageCheck : ->
		if @options.cpuUsageLimits
			@_checkHandlers.push (cbf) =>
				@_checkCpuUsage cbf
	###*
	 * _checkCpuUsage 检测CPU的使用率，使用ps命令
	 * @param  {[type]} cbf =             noop [description]
	 * @return {[type]}     [description]
	###
	_checkCpuUsage : (cbf = noop) ->
		cpuUsageLimits = @options.cpuUsageLimits
		cpuUsageExec cpuUsageCmd, (err, result) =>
			if err
				cbf err
			else if result
				usage = result.split('\n')[1]?.trim()
				if usage
					usage = GLOBAL.parseFloat usage
					level = @_getIndex cpuUsageLimits, usage
					cbf null, {
						type : 'cpuUsage'
						level : level
						value : usage
					}

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
module.exports = monitor