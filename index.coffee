MBSize = 1024 * 1024
os = require 'os'
monitor = 
	start : (@options = {}) ->
		@options.checkInterval ?= 3 * 1000
		checkInterval = @options.checkInterval
		freeMemoryLimits = @options.freeMemoryLimits
		if freeMemoryLimits
			totalmem = Math.floor os.totalmem() / MBSize
			for freeMemory, i in freeMemoryLimits
				freeMemory = freeMemoryLimits[i]
				if freeMemory != GLOBAL.parseInt freeMemory
					freeMemoryLimits[i] = freeMemory * totalmem
		loadavgLimits = @options.loadavgLimits
		if loadavgLimits
			cpuTotal = os.cpus().length
			for loadavg, i in loadavgLimits
				loadavgLimits[i] = loadavg * cpuTotal
		setTimeout =>
			@_check checkInterval
		, checkInterval
		@time = process.hrtime()
	_check : (checkInterval) ->
		handlers = @options.handlers
		if handlers
			results = []
			results.push @_checkMemory()
			results.push @_checkFreememory()
			results.push @_checkLoadavg()
			for result in results
				if result
					handler = handlers[result.handlerIndex]
					if handler
						handler result.msg
		setTimeout =>
			@_check checkInterval
		, checkInterval
	_checkLoadavg : ->
		loadavgLimits = @options.loadavgLimits
		result = null
		if loadavgLimits?.length < 2
			result
		else
			loadavg = os.loadavg()[1]
			for i in [loadavgLimits.length - 1 ..0]
				if loadavg > loadavgLimits[i]
					result =
						handlerIndex : i
						msg : "loadavg is #{loadavg}, higher than limit (#{loadavgLimits[i]})"
					break
			result
	_checkFreememory : ->
		freeMemoryLimits = @options.freeMemoryLimits
		result = null
		if freeMemoryLimits?.length < 2
			result
		else
			freeMemory = Math.floor os.freemem() / MBSize
			for i in [freeMemoryLimits.length - 1 ..0]
				if freeMemory < freeMemoryLimits[i]
					result =
						handlerIndex : i
						msg : "free memory is #{freeMemory}MB, less than limit (#{freeMemoryLimits[i]}MB)"
					break
			result
	_checkMemory : ->
		memoryLimits = @options.memoryLimits
		result = null
		if memoryLimits?.length < 2
			result
		else
			memoryUsage = process.memoryUsage()
			memoryUseTotal = Math.floor (memoryUsage.rss + memoryUsage.heapTotal) / MBSize
			for i in [memoryLimits.length - 1 ..0]
				if memoryUseTotal > memoryLimits[i]
					result =
						handlerIndex : i
						msg : "memory is used #{memoryUseTotal}MB, more than limit (#{memoryLimits[i]}MB)"
					break
			result

module.exports = monitor