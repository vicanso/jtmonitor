(function() {
  var JTMonitor, MBSize, cpuUsageCmd, cpuUsageExec, events, noop, os, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  MBSize = 1024 * 1024;

  events = require('events');

  os = require('os');

  cpuUsageExec = require('child_process').exec;

  cpuUsageCmd = "ps -p " + process.pid + " -o %cpu";

  noop = function() {};

  JTMonitor = (function(_super) {
    __extends(JTMonitor, _super);

    function JTMonitor() {
      _ref = JTMonitor.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    /**
     * start 开始监控
     * @param  {[type]} @options =             {} [description]
     * @return {[type]}          [description]
    */


    JTMonitor.prototype.start = function(options) {
      var checkInterval, _base,
        _this = this;
      this.options = options != null ? options : {};
      this._checkHandlers = [];
      if ((_base = this.options).checkInterval == null) {
        _base.checkInterval = 30 * 1000;
      }
      checkInterval = this.options.checkInterval;
      this._setMemoryCheck();
      this._setCpuUsageCheck();
      this._setFreeMemoryCheck();
      this._setLoadavgCheck();
      return setTimeout(function() {
        return _this._check(checkInterval);
      }, checkInterval);
    };

    JTMonitor.prototype.addChecker = function(checker) {
      return this._checkHandlers.push(checker);
    };

    /**
     * _check 定时执行check任务
     * @param  {[type]} checkInterval [description]
     * @return {[type]}               [description]
    */


    JTMonitor.prototype._check = function(checkInterval) {
      var func, _i, _len, _ref1,
        _this = this;
      _ref1 = this._checkHandlers;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        func = _ref1[_i];
        func.apply(this);
      }
      return setTimeout(function() {
        return _this._check(checkInterval);
      }, checkInterval);
    };

    JTMonitor.prototype._setLoadavgCheck = function() {
      var cpuTotal, i, loadavg, loadavgLimits, _i, _len;
      loadavgLimits = this.options.loadavgLimits;
      if (loadavgLimits) {
        cpuTotal = os.cpus().length;
        for (i = _i = 0, _len = loadavgLimits.length; _i < _len; i = ++_i) {
          loadavg = loadavgLimits[i];
          loadavgLimits[i] = loadavg * cpuTotal;
        }
        return this._checkHandlers.push(this._checkLoadavg);
      }
    };

    /**
     * _checkLoadavg 检测系统的load avg（每5分钟的）
     * @return {[type]} [description]
    */


    JTMonitor.prototype._checkLoadavg = function() {
      var level, loadavg, loadavgLimits, result;
      loadavgLimits = this.options.loadavgLimits;
      result = null;
      if ((loadavgLimits != null ? loadavgLimits.length : void 0) >= 2) {
        loadavg = os.loadavg()[1];
        level = this._getIndex(loadavgLimits, loadavg);
        result = {
          category: 'loadavg',
          level: level,
          value: GLOBAL.parseFloat(loadavg.toFixed(2)),
          date: new Date
        };
        return this.emit('log', result);
      }
    };

    JTMonitor.prototype._setFreeMemoryCheck = function() {
      var freeMemory, freeMemoryLimits, i, totalmem, _i, _len;
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
        return this._checkHandlers.push(this._checkFreememory);
      }
    };

    /**
     * _checkFreememory 检测可用内存
     * @return {[type]} [description]
    */


    JTMonitor.prototype._checkFreememory = function() {
      var freeMemory, freeMemoryLimits, level, result;
      freeMemoryLimits = this.options.freeMemoryLimits;
      result = null;
      if ((freeMemoryLimits != null ? freeMemoryLimits.length : void 0) >= 2) {
        freeMemory = Math.floor(os.freemem() / MBSize);
        level = this._getIndex(freeMemoryLimits, freeMemory);
        result = {
          category: 'freeMemory',
          level: level,
          value: GLOBAL.parseFloat(freeMemory.toFixed(2)),
          date: new Date
        };
        return this.emit('log', result);
      }
    };

    JTMonitor.prototype._setMemoryCheck = function() {
      if (this.options.memoryLimits) {
        return this._checkHandlers.push(this._checkMemory);
      }
    };

    /**
     * _checkMemory 检测node使用了的内存
     * @return {[type]} [description]
    */


    JTMonitor.prototype._checkMemory = function() {
      var level, memoryLimits, memoryUsage, memoryUseTotal, result;
      memoryLimits = this.options.memoryLimits;
      result = null;
      if ((memoryLimits != null ? memoryLimits.length : void 0) >= 2) {
        memoryUsage = process.memoryUsage();
        memoryUseTotal = Math.floor(memoryUsage.rss / MBSize);
        level = this._getIndex(memoryLimits, memoryUseTotal);
        result = {
          category: 'memoryUsage',
          level: level,
          value: GLOBAL.parseFloat(memoryUseTotal.toFixed(2)),
          date: new Date
        };
        return this.emit('log', result);
      }
    };

    JTMonitor.prototype._setCpuUsageCheck = function() {
      if (this.options.cpuUsageLimits) {
        return this._checkHandlers.push(this._checkCpuUsage);
      }
    };

    /**
     * _checkCpuUsage 检测CPU的使用率，使用ps命令
     * @return {[type]}     [description]
    */


    JTMonitor.prototype._checkCpuUsage = function() {
      var cpuUsageLimits,
        _this = this;
      cpuUsageLimits = this.options.cpuUsageLimits;
      return cpuUsageExec(cpuUsageCmd, function(err, result) {
        var level, usage, _ref1;
        if (result) {
          usage = (_ref1 = result.split('\n')[1]) != null ? _ref1.trim() : void 0;
          if (usage) {
            usage = GLOBAL.parseFloat(usage);
            level = _this._getIndex(cpuUsageLimits, usage);
            result = {
              category: 'cpuUsage',
              level: level,
              value: GLOBAL.parseFloat(usage.toFixed(2)),
              date: new Date
            };
            return _this.emit('log', result);
          }
        }
      });
    };

    /**
     * _getIndex 获取在数组中的位置
     * @param  {[type]} arr   [description]
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
    */


    JTMonitor.prototype._getIndex = function(arr, value) {
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
    };

    return JTMonitor;

  })(events.EventEmitter);

  module.exports = JTMonitor;

}).call(this);
