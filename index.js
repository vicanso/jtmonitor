(function() {
  var MBSize, cpuUsageCmd, cpuUsageExec, monitor, noop, os;

  MBSize = 1024 * 1024;

  os = require('os');

  cpuUsageExec = require('child_process').exec;

  cpuUsageCmd = "ps -p " + process.pid + " -o %cpu";

  noop = function() {};

  monitor = {
    /**
    	 * start 开始监控
    	 * @param  {[type]} @options =             {} [description]
    	 * @return {[type]}          [description]
    */

    start: function(options) {
      var checkInterval, _base, _ref,
        _this = this;
      this.options = options != null ? options : {};
      this._checkHandlers = [];
      if ((_ref = (_base = this.options).checkInterval) == null) {
        _base.checkInterval = 3 * 1000;
      }
      checkInterval = this.options.checkInterval;
      this._setMemoryCheck();
      this._setCpuUsageCheck();
      this._setFreeMemoryCheck();
      this._setLoadavgCheck();
      return setTimeout(function() {
        return _this._check(checkInterval);
      }, checkInterval);
    },
    addChecker: function(checker) {
      return this._checkHandlers.push(checker);
    },
    /**
    	 * _check 定时执行check任务
    	 * @param  {[type]} checkInterval [description]
    	 * @return {[type]}               [description]
    */

    _check: function(checkInterval) {
      var func, handler, results, _i, _len, _ref,
        _this = this;
      handler = this.options.cbf;
      if (handler) {
        results = [];
        _ref = this._checkHandlers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          func = _ref[_i];
          func(handler);
        }
      }
      return setTimeout(function() {
        return _this._check(checkInterval);
      }, checkInterval);
    },
    _setLoadavgCheck: function() {
      var cpuTotal, i, loadavg, loadavgLimits, _i, _len,
        _this = this;
      loadavgLimits = this.options.loadavgLimits;
      if (loadavgLimits) {
        cpuTotal = os.cpus().length;
        for (i = _i = 0, _len = loadavgLimits.length; _i < _len; i = ++_i) {
          loadavg = loadavgLimits[i];
          loadavgLimits[i] = loadavg * cpuTotal;
        }
        return this._checkHandlers.push(function(cbf) {
          return _this._checkLoadavg(cbf);
        });
      }
    },
    /**
    	 * _checkLoadavg 检测系统的load avg（每5分钟的）
    	 * @return {[type]} [description]
    */

    _checkLoadavg: function(cbf) {
      var level, loadavg, loadavgLimits, result;
      if (cbf == null) {
        cbf = noop;
      }
      loadavgLimits = this.options.loadavgLimits;
      result = null;
      if ((loadavgLimits != null ? loadavgLimits.length : void 0) >= 2) {
        loadavg = os.loadavg()[1];
        level = this._getIndex(loadavgLimits, loadavg);
        result = {
          type: 'loadavg',
          level: level,
          value: loadavg
        };
      }
      return cbf(null, result);
    },
    _setFreeMemoryCheck: function() {
      var freeMemory, freeMemoryLimits, i, totalmem, _i, _len,
        _this = this;
      freeMemoryLimits = this.options.freeMemoryLimits;
      if (freeMemoryLimits) {
        totalmem = Math.floor(os.totalmem() / MBSize);
        for (i = _i = 0, _len = freeMemoryLimits.length; _i < _len; i = ++_i) {
          freeMemory = freeMemoryLimits[i];
          freeMemory = freeMemoryLimits[i];
          if (freeMemory !== GLOBAL.parseInt(freeMemory) && freeMemory < 1) {
            freeMemoryLimits[i] = freeMemory * totalmem;
          }
        }
        return this._checkHandlers.push(function(cbf) {
          return _this._checkFreememory(cbf);
        });
      }
    },
    /**
    	 * _checkFreememory 检测可用内存
    	 * @return {[type]} [description]
    */

    _checkFreememory: function(cbf) {
      var freeMemory, freeMemoryLimits, level, result;
      if (cbf == null) {
        cbf = noop;
      }
      freeMemoryLimits = this.options.freeMemoryLimits;
      result = null;
      if ((freeMemoryLimits != null ? freeMemoryLimits.length : void 0) >= 2) {
        freeMemory = Math.floor(os.freemem() / MBSize);
        level = this._getIndex(freeMemoryLimits, freeMemory);
        result = {
          type: 'freeMemory',
          level: level,
          value: freeMemory
        };
      }
      return cbf(null, result);
    },
    _setMemoryCheck: function() {
      var _this = this;
      if (this.options.memoryLimits) {
        return this._checkHandlers.push(function(cbf) {
          return _this._checkMemory(cbf);
        });
      }
    },
    /**
    	 * _checkMemory 检测node使用了的内存
    	 * @return {[type]} [description]
    */

    _checkMemory: function(cbf) {
      var level, memoryLimits, memoryUsage, memoryUseTotal, result;
      if (cbf == null) {
        cbf = noop;
      }
      memoryLimits = this.options.memoryLimits;
      result = null;
      if ((memoryLimits != null ? memoryLimits.length : void 0) >= 2) {
        memoryUsage = process.memoryUsage();
        memoryUseTotal = Math.floor((memoryUsage.rss + memoryUsage.heapTotal) / MBSize);
        level = this._getIndex(memoryLimits, memoryUseTotal);
        result = {
          type: 'memoryUsage',
          level: level,
          value: memoryUseTotal
        };
      }
      return cbf(null, result);
    },
    _setCpuUsageCheck: function() {
      var _this = this;
      if (this.options.cpuUsageLimits) {
        return this._checkHandlers.push(function(cbf) {
          return _this._checkCpuUsage(cbf);
        });
      }
    },
    /**
    	 * _checkCpuUsage 检测CPU的使用率，使用ps命令
    	 * @param  {[type]} cbf =             noop [description]
    	 * @return {[type]}     [description]
    */

    _checkCpuUsage: function(cbf) {
      var cpuUsageLimits,
        _this = this;
      if (cbf == null) {
        cbf = noop;
      }
      cpuUsageLimits = this.options.cpuUsageLimits;
      return cpuUsageExec(cpuUsageCmd, function(err, result) {
        var level, usage, _ref;
        if (err) {
          return cbf(err);
        } else if (result) {
          usage = (_ref = result.split('\n')[1]) != null ? _ref.trim() : void 0;
          if (usage) {
            usage = GLOBAL.parseFloat(usage);
            level = _this._getIndex(cpuUsageLimits, usage);
            return cbf(null, {
              type: 'cpuUsage',
              level: level,
              value: usage
            });
          }
        }
      });
    },
    /**
    	 * _getIndex 获取在数组中的位置
    	 * @param  {[type]} arr   [description]
    	 * @param  {[type]} value [description]
    	 * @return {[type]}       [description]
    */

    _getIndex: function(arr, value) {
      var cardinal, checkValue, i, index, _i, _len;
      index = arr.length;
      cardinal = 1;
      if (arr[0] > arr[1]) {
        cardinal = -1;
      }
      for (i = _i = 0, _len = arr.length; _i < _len; i = ++_i) {
        checkValue = arr[i];
        if ((checkValue - value) * cardinal > 0) {
          index = i;
          break;
        }
      }
      return index;
    }
  };

  module.exports = monitor;

}).call(this);
