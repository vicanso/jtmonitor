(function() {
  var MBSize, monitor, os;

  MBSize = 1024 * 1024;

  os = require('os');

  monitor = {
    start: function(options) {
      var checkInterval, cpuTotal, freeMemory, freeMemoryLimits, i, loadavg, loadavgLimits, totalmem, _base, _i, _j, _len, _len1, _ref,
        _this = this;
      this.options = options != null ? options : {};
      if ((_ref = (_base = this.options).checkInterval) == null) {
        _base.checkInterval = 3 * 1000;
      }
      checkInterval = this.options.checkInterval;
      freeMemoryLimits = this.options.freeMemoryLimits;
      if (freeMemoryLimits) {
        totalmem = Math.floor(os.totalmem() / MBSize);
        for (i = _i = 0, _len = freeMemoryLimits.length; _i < _len; i = ++_i) {
          freeMemory = freeMemoryLimits[i];
          freeMemory = freeMemoryLimits[i];
          if (freeMemory !== GLOBAL.parseInt(freeMemory)) {
            freeMemoryLimits[i] = freeMemory * totalmem;
          }
        }
      }
      loadavgLimits = this.options.loadavgLimits;
      if (loadavgLimits) {
        cpuTotal = os.cpus().length;
        for (i = _j = 0, _len1 = loadavgLimits.length; _j < _len1; i = ++_j) {
          loadavg = loadavgLimits[i];
          loadavgLimits[i] = loadavg * cpuTotal;
        }
      }
      setTimeout(function() {
        return _this._check(checkInterval);
      }, checkInterval);
      return this.time = process.hrtime();
    },
    _check: function(checkInterval) {
      var handler, handlers, result, results, _i, _len,
        _this = this;
      handlers = this.options.handlers;
      if (handlers) {
        results = [];
        results.push(this._checkMemory());
        results.push(this._checkFreememory());
        results.push(this._checkLoadavg());
        for (_i = 0, _len = results.length; _i < _len; _i++) {
          result = results[_i];
          if (result) {
            handler = handlers[result.handlerIndex];
            if (handler) {
              handler(result.msg);
            }
          }
        }
      }
      return setTimeout(function() {
        return _this._check(checkInterval);
      }, checkInterval);
    },
    _checkLoadavg: function() {
      var i, loadavg, loadavgLimits, result, _i, _ref;
      loadavgLimits = this.options.loadavgLimits;
      result = null;
      if ((loadavgLimits != null ? loadavgLimits.length : void 0) < 2) {
        return result;
      } else {
        loadavg = os.loadavg()[1];
        for (i = _i = _ref = loadavgLimits.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
          if (loadavg > loadavgLimits[i]) {
            result = {
              handlerIndex: i,
              msg: "loadavg is " + loadavg + ", higher than limit (" + loadavgLimits[i] + ")"
            };
            break;
          }
        }
        return result;
      }
    },
    _checkFreememory: function() {
      var freeMemory, freeMemoryLimits, i, result, _i, _ref;
      freeMemoryLimits = this.options.freeMemoryLimits;
      result = null;
      if ((freeMemoryLimits != null ? freeMemoryLimits.length : void 0) < 2) {
        return result;
      } else {
        freeMemory = Math.floor(os.freemem() / MBSize);
        for (i = _i = _ref = freeMemoryLimits.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
          if (freeMemory < freeMemoryLimits[i]) {
            result = {
              handlerIndex: i,
              msg: "free memory is " + freeMemory + "MB, less than limit (" + freeMemoryLimits[i] + "MB)"
            };
            break;
          }
        }
        return result;
      }
    },
    _checkMemory: function() {
      var i, memoryLimits, memoryUsage, memoryUseTotal, result, _i, _ref;
      memoryLimits = this.options.memoryLimits;
      result = null;
      if ((memoryLimits != null ? memoryLimits.length : void 0) < 2) {
        return result;
      } else {
        memoryUsage = process.memoryUsage();
        memoryUseTotal = Math.floor((memoryUsage.rss + memoryUsage.heapTotal) / MBSize);
        for (i = _i = _ref = memoryLimits.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
          if (memoryUseTotal > memoryLimits[i]) {
            result = {
              handlerIndex: i,
              msg: "memory is used " + memoryUseTotal + "MB, more than limit (" + memoryLimits[i] + "MB)"
            };
            break;
          }
        }
        return result;
      }
    }
  };

  module.exports = monitor;

}).call(this);
