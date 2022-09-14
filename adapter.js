var window = $global;var cc = window.cc = window.cc || {};var b2 = window.b2 = window.b2 || {};var sp = window.sp = window.sp || {};var dragonBones = window.dragonBones = window.dragonBones || {};var __globalAdapter = window.__globalAdapter = window.__globalAdapter || {};var __cocos_require__ = window.__cocos_require__;var Image = window.Image;var HTMLCanvasElement = window.HTMLCanvasElement;var HTMLImageElement = window.HTMLImageElement;var ImageBitmap = window.ImageBitmap;var document = window.document;var DOMParser = window.DOMParser;var performance = window.performance;var XMLHttpRequest = window.XMLHttpRequest;var __extends = window.__extends;var __assign = window.__assign;var __rest = window.__rest;var __decorate = window.__decorate;var __param = window.__param;var __metadata = window.__metadata;var __awaiter = window.__awaiter;var __generator = window.__generator;var __exportStar = window.__exportStar;var __createBinding = window.__createBinding;var __values = window.__values;var __read = window.__read;var __spread = window.__spread;var __spreadArrays = window.__spreadArrays;var __await = window.__await;var __asyncGenerator = window.__asyncGenerator;var __asyncDelegator = window.__asyncDelegator;var __asyncValues = window.__asyncValues;var __makeTemplateObject = window.__makeTemplateObject;var __importStar = window.__importStar;var __importDefault = window.__importDefault;var __classPrivateFieldGet = window.__classPrivateFieldGet;var __classPrivateFieldSet = window.__classPrivateFieldSet;
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/****************************************************************************
 Copyright (c) 2019 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of cache-manager software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in cache-manager License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
var _window$fsUtils = window.fsUtils,
    getUserDataPath = _window$fsUtils.getUserDataPath,
    readJsonSync = _window$fsUtils.readJsonSync,
    makeDirSync = _window$fsUtils.makeDirSync,
    writeFileSync = _window$fsUtils.writeFileSync,
    copyFile = _window$fsUtils.copyFile,
    downloadFile = _window$fsUtils.downloadFile,
    writeFile = _window$fsUtils.writeFile,
    deleteFile = _window$fsUtils.deleteFile,
    rmdirSync = _window$fsUtils.rmdirSync,
    unzip = _window$fsUtils.unzip,
    isOutOfStorage = _window$fsUtils.isOutOfStorage;
var checkNextPeriod = false;
var writeCacheFileList = null;
var startWrite = false;
var nextCallbacks = [];
var callbacks = [];
var cleaning = false;
var suffix = 0;
var REGEX = /^https?:\/\/.*/;
var cacheManager = {
  cacheDir: 'gamecaches',
  cachedFileName: 'cacheList.json',
  // whether or not cache asset into user's storage space
  cacheEnabled: true,
  // whether or not auto clear cache when storage ran out
  autoClear: true,
  // cache one per cycle
  cacheInterval: 500,
  deleteInterval: 500,
  writeFileInterval: 2000,
  // whether or not storage space has run out
  outOfStorage: false,
  tempFiles: null,
  cachedFiles: null,
  cacheQueue: {},
  version: '1.0',
  getCache: function getCache(url) {
    return this.cachedFiles.has(url) ? this.cachedFiles.get(url).url : '';
  },
  getTemp: function getTemp(url) {
    return this.tempFiles.has(url) ? this.tempFiles.get(url) : '';
  },
  init: function init() {
    this.cacheDir = getUserDataPath() + '/' + this.cacheDir;
    var cacheFilePath = this.cacheDir + '/' + this.cachedFileName;
    var result = readJsonSync(cacheFilePath);

    if (result instanceof Error || !result.version) {
      if (!(result instanceof Error)) rmdirSync(this.cacheDir, true);
      this.cachedFiles = new cc.AssetManager.Cache();
      makeDirSync(this.cacheDir, true);
      writeFileSync(cacheFilePath, JSON.stringify({
        files: this.cachedFiles._map,
        version: this.version
      }), 'utf8');
    } else {
      this.cachedFiles = new cc.AssetManager.Cache(result.files);
    }

    this.tempFiles = new cc.AssetManager.Cache();
  },
  updateLastTime: function updateLastTime(url) {
    if (this.cachedFiles.has(url)) {
      var cache = this.cachedFiles.get(url);
      cache.lastTime = Date.now();
    }
  },
  _write: function _write() {
    writeCacheFileList = null;
    startWrite = true;
    writeFile(this.cacheDir + '/' + this.cachedFileName, JSON.stringify({
      files: this.cachedFiles._map,
      version: this.version
    }), 'utf8', function () {
      startWrite = false;

      for (var i = 0, j = callbacks.length; i < j; i++) {
        callbacks[i]();
      }

      callbacks.length = 0;
      callbacks.push.apply(callbacks, nextCallbacks);
      nextCallbacks.length = 0;
    });
  },
  writeCacheFile: function writeCacheFile(cb) {
    if (!writeCacheFileList) {
      writeCacheFileList = setTimeout(this._write.bind(this), this.writeFileInterval);

      if (startWrite === true) {
        cb && nextCallbacks.push(cb);
      } else {
        cb && callbacks.push(cb);
      }
    } else {
      cb && callbacks.push(cb);
    }
  },
  _cache: function _cache() {
    var self = this;

    for (var id in this.cacheQueue) {
      var callback = function callback(err) {
        checkNextPeriod = false;

        if (err) {
          if (isOutOfStorage(err.message)) {
            self.outOfStorage = true;
            self.autoClear && self.clearLRU();
            return;
          }
        } else {
          self.cachedFiles.add(id, {
            bundle: cacheBundleRoot,
            url: localPath,
            lastTime: time
          });
          delete self.cacheQueue[id];
          self.writeCacheFile();
        }

        if (!cc.js.isEmptyObject(self.cacheQueue)) {
          checkNextPeriod = true;
          setTimeout(self._cache.bind(self), self.cacheInterval);
        }
      };

      var _this$cacheQueue$id = this.cacheQueue[id],
          srcUrl = _this$cacheQueue$id.srcUrl,
          isCopy = _this$cacheQueue$id.isCopy,
          cacheBundleRoot = _this$cacheQueue$id.cacheBundleRoot;
      var time = Date.now().toString();
      var localPath = '';

      if (cacheBundleRoot) {
        localPath = "".concat(this.cacheDir, "/").concat(cacheBundleRoot, "/").concat(time).concat(suffix++).concat(cc.path.extname(id));
      } else {
        localPath = "".concat(this.cacheDir, "/").concat(time).concat(suffix++).concat(cc.path.extname(id));
      }

      if (!isCopy) {
        downloadFile(srcUrl, localPath, null, callback);
      } else {
        copyFile(srcUrl, localPath, callback);
      }

      return;
    }

    checkNextPeriod = false;
  },
  cacheFile: function cacheFile(id, srcUrl, cacheEnabled, cacheBundleRoot, isCopy) {
    cacheEnabled = cacheEnabled !== undefined ? cacheEnabled : this.cacheEnabled;
    if (!cacheEnabled || this.cacheQueue[id] || this.cachedFiles.has(id)) return;
    this.cacheQueue[id] = {
      srcUrl: srcUrl,
      cacheBundleRoot: cacheBundleRoot,
      isCopy: isCopy
    };

    if (!checkNextPeriod) {
      checkNextPeriod = true;

      if (!this.outOfStorage) {
        setTimeout(this._cache.bind(this), this.cacheInterval);
      } else {
        checkNextPeriod = false;
      }
    }
  },
  clearCache: function clearCache() {
    var _this = this;

    rmdirSync(this.cacheDir, true);
    this.cachedFiles = new cc.AssetManager.Cache();
    makeDirSync(this.cacheDir, true);
    var cacheFilePath = this.cacheDir + '/' + this.cachedFileName;
    this.outOfStorage = false;
    writeFileSync(cacheFilePath, JSON.stringify({
      files: this.cachedFiles._map,
      version: this.version
    }), 'utf8');
    cc.assetManager.bundles.forEach(function (bundle) {
      if (REGEX.test(bundle.base)) _this.makeBundleFolder(bundle.name);
    });
  },
  clearLRU: function clearLRU() {
    if (cleaning) return;
    cleaning = true;
    var caches = [];
    var self = this;
    this.cachedFiles.forEach(function (val, key) {
      if (val.bundle === 'internal') return;
      if (self._isZipFile(key) && cc.assetManager.bundles.find(function (bundle) {
        return bundle.base.indexOf(val.url) !== -1;
      })) return;
      caches.push({
        originUrl: key,
        url: val.url,
        lastTime: val.lastTime
      });
    });
    caches.sort(function (a, b) {
      return a.lastTime - b.lastTime;
    });
    caches.length = Math.floor(caches.length / 3);
    if (caches.length === 0) return;

    for (var i = 0, l = caches.length; i < l; i++) {
      this.cachedFiles.remove(caches[i].originUrl);
    }

    this.writeCacheFile(function () {
      function deferredDelete() {
        var item = caches.pop();

        if (self._isZipFile(item.originUrl)) {
          rmdirSync(item.url, true);

          self._deleteFileCB();
        } else {
          deleteFile(item.url, self._deleteFileCB.bind(self));
        }

        if (caches.length > 0) {
          setTimeout(deferredDelete, self.deleteInterval);
        } else {
          cleaning = false;
        }
      }

      setTimeout(deferredDelete, self.deleteInterval);
    });
  },
  removeCache: function removeCache(url) {
    if (this.cachedFiles.has(url)) {
      var self = this;
      var path = this.cachedFiles.remove(url).url;
      this.writeCacheFile(function () {
        if (self._isZipFile(url)) {
          rmdirSync(path, true);

          self._deleteFileCB();
        } else {
          deleteFile(path, self._deleteFileCB.bind(self));
        }
      });
    }
  },
  _deleteFileCB: function _deleteFileCB(err) {
    if (!err) this.outOfStorage = false;
  },
  makeBundleFolder: function makeBundleFolder(bundleName) {
    makeDirSync(this.cacheDir + '/' + bundleName, true);
  },
  unzipAndCacheBundle: function unzipAndCacheBundle(id, zipFilePath, cacheBundleRoot, onComplete) {
    var time = Date.now().toString();
    var targetPath = "".concat(this.cacheDir, "/").concat(cacheBundleRoot, "/").concat(time).concat(suffix++);
    var self = this;
    makeDirSync(targetPath, true);
    unzip(zipFilePath, targetPath, function (err) {
      if (err) {
        rmdirSync(targetPath, true);

        if (isOutOfStorage(err.message)) {
          self.outOfStorage = true;
          self.autoClear && self.clearLRU();
        }

        onComplete && onComplete(err);
        return;
      }

      self.cachedFiles.add(id, {
        bundle: cacheBundleRoot,
        url: targetPath,
        lastTime: time
      });
      self.writeCacheFile();
      onComplete && onComplete(null, targetPath);
    });
  },
  _isZipFile: function _isZipFile(url) {
    return url.slice(-4) === '.zip';
  }
};
cc.assetManager.cacheManager = module.exports = cacheManager;

},{}],2:[function(require,module,exports){
"use strict";

var cacheManager = require('../cache-manager');

var _window$fsUtils = window.fsUtils,
    fs = _window$fsUtils.fs,
    downloadFile = _window$fsUtils.downloadFile,
    readText = _window$fsUtils.readText,
    readArrayBuffer = _window$fsUtils.readArrayBuffer,
    readJson = _window$fsUtils.readJson,
    loadSubpackage = _window$fsUtils.loadSubpackage,
    getUserDataPath = _window$fsUtils.getUserDataPath,
    exists = _window$fsUtils.exists;
var REGEX = /^https?:\/\/.*/;
var cachedSubpackageList = {};
var downloader = cc.assetManager.downloader;
var parser = cc.assetManager.parser;
var presets = cc.assetManager.presets;
var isSubDomain = __globalAdapter.isSubContext;
downloader.maxConcurrency = 8;
downloader.maxRequestsPerFrame = 64;
presets['scene'].maxConcurrency = 10;
presets['scene'].maxRequestsPerFrame = 64;
var SUBCONTEXT_ROOT, REMOTE_SERVER_ROOT;
var subpackages = {},
    remoteBundles = {};

function downloadScript(url, options, onComplete) {
  if (typeof options === 'function') {
    onComplete = options;
    options = null;
  }

  if (REGEX.test(url)) {
    onComplete && onComplete(new Error('Can not load remote scripts'));
  } else {
    __cocos_require__(url);

    onComplete && onComplete(null);
  }
}

function handleZip(url, options, onComplete) {
  var cachedUnzip = cacheManager.cachedFiles.get(url);

  if (cachedUnzip) {
    cacheManager.updateLastTime(url);
    onComplete && onComplete(null, cachedUnzip.url);
  } else if (REGEX.test(url)) {
    downloadFile(url, null, options.header, options.onFileProgress, function (err, downloadedZipPath) {
      if (err) {
        onComplete && onComplete(err);
        return;
      }

      cacheManager.unzipAndCacheBundle(url, downloadedZipPath, options.__cacheBundleRoot__, onComplete);
    });
  } else {
    cacheManager.unzipAndCacheBundle(url, url, options.__cacheBundleRoot__, onComplete);
  }
}

function downloadDomAudio(url, options, onComplete) {
  if (typeof options === 'function') {
    onComplete = options;
    options = null;
  }

  var dom;
  var sys = cc.sys;

  if (sys.platform === sys.TAOBAO) {
    dom = window.document.createElement('audio');
  } else {
    dom = document.createElement('audio');
  }

  dom.src = url; // HACK: wechat does not callback when load large number of assets

  onComplete && onComplete(null, dom);
}

function download(url, func, options, onFileProgress, onComplete) {
  var result = transformUrl(url, options);

  if (result.inLocal) {
    func(result.url, options, onComplete);
  } else if (result.inCache) {
    cacheManager.updateLastTime(url);
    func(result.url, options, function (err, data) {
      if (err) {
        cacheManager.removeCache(url);
      }

      onComplete(err, data);
    });
  } else {
    downloadFile(url, null, options.header, onFileProgress, function (err, path) {
      if (err) {
        onComplete(err, null);
        return;
      }

      func(path, options, function (err, data) {
        if (!err) {
          cacheManager.tempFiles.add(url, path);
          cacheManager.cacheFile(url, path, options.cacheEnabled, options.__cacheBundleRoot__, true);
        }

        onComplete(err, data);
      });
    });
  }
}

function parseArrayBuffer(url, options, onComplete) {
  readArrayBuffer(url, onComplete);
}

function parseText(url, options, onComplete) {
  readText(url, onComplete);
}

function parseJson(url, options, onComplete) {
  readJson(url, onComplete);
}

function downloadText(url, options, onComplete) {
  download(url, parseText, options, options.onFileProgress, onComplete);
}

var downloadJson = !isSubDomain ? function (url, options, onComplete) {
  download(url, parseJson, options, options.onFileProgress, onComplete);
} : function (url, options, onComplete) {
  var _transformUrl = transformUrl(url, options),
      url = _transformUrl.url;

  url = url.slice(SUBCONTEXT_ROOT.length + 1); // remove subcontext root in url

  var content = __cocos_require__(cc.path.changeExtname(url, '.js'));

  onComplete && onComplete(null, content);
};
var loadFont = !isSubDomain ? function (url, options, onComplete) {
  var fontFamily = __globalAdapter.loadFont(url);

  onComplete(null, fontFamily || 'Arial');
} : function (url, options, onComplete) {
  onComplete(null, 'Arial');
};

function doNothing(content, options, onComplete) {
  exists(content, function (existence) {
    if (existence) {
      onComplete(null, content);
    } else {
      onComplete(new Error("file ".concat(content, " does not exist!")));
    }
  });
}

function downloadAsset(url, options, onComplete) {
  download(url, doNothing, options, options.onFileProgress, onComplete);
}

function subdomainTransformUrl(url, options, onComplete) {
  var _transformUrl2 = transformUrl(url, options),
      url = _transformUrl2.url;

  onComplete(null, url);
}

function downloadBundle(nameOrUrl, options, onComplete) {
  var bundleName = cc.path.basename(nameOrUrl);
  var version = options.version || cc.assetManager.downloader.bundleVers[bundleName];

  if (subpackages[bundleName]) {
    var config = "subpackages/".concat(bundleName, "/config.").concat(version ? version + '.' : '', "json");

    var loadedCb = function loadedCb() {
      downloadJson(config, options, function (err, data) {
        data && (data.base = "subpackages/".concat(bundleName, "/"));
        onComplete(err, data);
      });
    };

    if (cachedSubpackageList[bundleName]) {
      return loadedCb();
    }

    loadSubpackage(bundleName, options.onFileProgress, function (err) {
      if (err) {
        onComplete(err, null);
        return;
      }

      cachedSubpackageList[bundleName] = true;
      loadedCb();
    });
  } else {
    var js, url;

    if (REGEX.test(nameOrUrl) || !isSubDomain && nameOrUrl.startsWith(getUserDataPath())) {
      url = nameOrUrl;
      js = "src/scripts/".concat(bundleName, "/index.js");
      cacheManager.makeBundleFolder(bundleName);
    } else {
      if (remoteBundles[bundleName]) {
        url = "".concat(REMOTE_SERVER_ROOT, "remote/").concat(bundleName);
        js = "src/scripts/".concat(bundleName, "/index.js");
        cacheManager.makeBundleFolder(bundleName);
      } else {
        url = "assets/".concat(bundleName);
        js = "assets/".concat(bundleName, "/index.js");
      }
    }

    __cocos_require__(js);

    options.__cacheBundleRoot__ = bundleName;
    var config = "".concat(url, "/config.").concat(version ? version + '.' : '', "json");
    downloadJson(config, options, function (err, data) {
      if (err) {
        onComplete && onComplete(err);
        return;
      }

      if (data.isZip) {
        var zipVersion = data.zipVersion;
        var zipUrl = "".concat(url, "/res.").concat(zipVersion ? zipVersion + '.' : '', "zip");
        handleZip(zipUrl, options, function (err, unzipPath) {
          if (err) {
            onComplete && onComplete(err);
            return;
          }

          data.base = unzipPath + '/res/'; // PATCH: for android alipay version before v10.1.95 (v10.1.95 included)
          // to remove in the future

          var sys = cc.sys;

          if (sys.platform === sys.ALIPAY_GAME && sys.os === sys.OS_ANDROID) {
            var resPath = unzipPath + 'res/';

            if (fs.accessSync({
              path: resPath
            })) {
              data.base = resPath;
            }
          }

          onComplete && onComplete(null, data);
        });
      } else {
        data.base = url + '/';
        onComplete && onComplete(null, data);
      }
    });
  }
}

;
var originParsePVRTex = parser.parsePVRTex;

var parsePVRTex = function parsePVRTex(file, options, onComplete) {
  readArrayBuffer(file, function (err, data) {
    if (err) return onComplete(err);
    originParsePVRTex(data, options, onComplete);
  });
};

var originParsePKMTex = parser.parsePKMTex;

var parsePKMTex = function parsePKMTex(file, options, onComplete) {
  readArrayBuffer(file, function (err, data) {
    if (err) return onComplete(err);
    originParsePKMTex(data, options, onComplete);
  });
};

function parsePlist(url, options, onComplete) {
  readText(url, function (err, file) {
    var result = null;

    if (!err) {
      result = cc.plistParser.parse(file);
      if (!result) err = new Error('parse failed');
    }

    onComplete && onComplete(err, result);
  });
}

var downloadImage = isSubDomain ? subdomainTransformUrl : downloadAsset;
downloader.downloadDomAudio = downloadDomAudio;
downloader.downloadScript = downloadScript;
parser.parsePVRTex = parsePVRTex;
parser.parsePKMTex = parsePKMTex;
downloader.register({
  '.js': downloadScript,
  // Audio
  '.mp3': downloadAsset,
  '.ogg': downloadAsset,
  '.wav': downloadAsset,
  '.m4a': downloadAsset,
  // Image
  '.png': downloadImage,
  '.jpg': downloadImage,
  '.bmp': downloadImage,
  '.jpeg': downloadImage,
  '.gif': downloadImage,
  '.ico': downloadImage,
  '.tiff': downloadImage,
  '.image': downloadImage,
  '.webp': downloadImage,
  '.pvr': downloadAsset,
  '.pkm': downloadAsset,
  '.font': downloadAsset,
  '.eot': downloadAsset,
  '.ttf': downloadAsset,
  '.woff': downloadAsset,
  '.svg': downloadAsset,
  '.ttc': downloadAsset,
  // Txt
  '.txt': downloadAsset,
  '.xml': downloadAsset,
  '.vsh': downloadAsset,
  '.fsh': downloadAsset,
  '.atlas': downloadAsset,
  '.tmx': downloadAsset,
  '.tsx': downloadAsset,
  '.plist': downloadAsset,
  '.fnt': downloadAsset,
  '.json': downloadJson,
  '.ExportJson': downloadAsset,
  '.binary': downloadAsset,
  '.bin': downloadAsset,
  '.dbbin': downloadAsset,
  '.skel': downloadAsset,
  '.mp4': downloadAsset,
  '.avi': downloadAsset,
  '.mov': downloadAsset,
  '.mpg': downloadAsset,
  '.mpeg': downloadAsset,
  '.rm': downloadAsset,
  '.rmvb': downloadAsset,
  'bundle': downloadBundle,
  'default': downloadText
});
parser.register({
  '.png': downloader.downloadDomImage,
  '.jpg': downloader.downloadDomImage,
  '.bmp': downloader.downloadDomImage,
  '.jpeg': downloader.downloadDomImage,
  '.gif': downloader.downloadDomImage,
  '.ico': downloader.downloadDomImage,
  '.tiff': downloader.downloadDomImage,
  '.image': downloader.downloadDomImage,
  '.webp': downloader.downloadDomImage,
  '.pvr': parsePVRTex,
  '.pkm': parsePKMTex,
  '.font': loadFont,
  '.eot': loadFont,
  '.ttf': loadFont,
  '.woff': loadFont,
  '.svg': loadFont,
  '.ttc': loadFont,
  // Audio
  '.mp3': downloadDomAudio,
  '.ogg': downloadDomAudio,
  '.wav': downloadDomAudio,
  '.m4a': downloadDomAudio,
  // Txt
  '.txt': parseText,
  '.xml': parseText,
  '.vsh': parseText,
  '.fsh': parseText,
  '.atlas': parseText,
  '.tmx': parseText,
  '.tsx': parseText,
  '.fnt': parseText,
  '.plist': parsePlist,
  '.binary': parseArrayBuffer,
  '.bin': parseArrayBuffer,
  '.dbbin': parseArrayBuffer,
  '.skel': parseArrayBuffer,
  '.ExportJson': parseJson
});
var transformUrl = !isSubDomain ? function (url, options) {
  var inLocal = false;
  var inCache = false;
  var isInUserDataPath = url.startsWith(getUserDataPath());

  if (isInUserDataPath) {
    inLocal = true;
  } else if (REGEX.test(url)) {
    if (!options.reload) {
      var cache = cacheManager.cachedFiles.get(url);

      if (cache) {
        inCache = true;
        url = cache.url;
      } else {
        var tempUrl = cacheManager.tempFiles.get(url);

        if (tempUrl) {
          inLocal = true;
          url = tempUrl;
        }
      }
    }
  } else {
    inLocal = true;
  }

  return {
    url: url,
    inLocal: inLocal,
    inCache: inCache
  };
} : function (url, options) {
  if (!REGEX.test(url)) {
    url = SUBCONTEXT_ROOT + '/' + url;
  }

  return {
    url: url
  };
};

if (!isSubDomain) {
  cc.assetManager.transformPipeline.append(function (task) {
    var input = task.output = task.input;

    for (var i = 0, l = input.length; i < l; i++) {
      var item = input[i];
      var options = item.options;

      if (!item.config) {
        if (item.ext === 'bundle') continue;
        options.cacheEnabled = options.cacheEnabled !== undefined ? options.cacheEnabled : false;
      } else {
        options.__cacheBundleRoot__ = item.config.name;
      }
    }
  });
  var originInit = cc.assetManager.init;

  cc.assetManager.init = function (options) {
    originInit.call(cc.assetManager, options);
    options.subpackages && options.subpackages.forEach(function (x) {
      return subpackages[x] = 'subpackages/' + x;
    });
    options.remoteBundles && options.remoteBundles.forEach(function (x) {
      return remoteBundles[x] = true;
    });
    REMOTE_SERVER_ROOT = options.server || '';
    if (REMOTE_SERVER_ROOT && !REMOTE_SERVER_ROOT.endsWith('/')) REMOTE_SERVER_ROOT += '/';
    cacheManager.init();
  };
} else {
  var originInit = cc.assetManager.init;

  cc.assetManager.init = function (options) {
    originInit.call(cc.assetManager, options);
    SUBCONTEXT_ROOT = options.subContextRoot || '';
  };
}

},{"../cache-manager":1}],3:[function(require,module,exports){
"use strict";

var Audio = cc._Audio;

if (Audio) {
  var originGetDuration = Audio.prototype.getDuration;
  Object.assign(Audio.prototype, {
    _createElement: function _createElement() {
      var elem = this._src._nativeAsset; // Reuse dom audio element

      if (!this._element) {
        this._element = __globalAdapter.createInnerAudioContext();
      }

      this._element.src = elem.src;
    },
    destroy: function destroy() {
      if (this._element) {
        this._element.destroy();

        this._element = null;
      }
    },
    setCurrentTime: function setCurrentTime(num) {
      var self = this;
      this._src && this._src._ensureLoaded(function () {
        self._element.seek(num);
      });
    },
    stop: function stop() {
      var self = this;
      this._src && this._src._ensureLoaded(function () {
        // HACK: some platforms won't set currentTime to 0 when stop audio
        self._element.seek(0);

        self._element.stop();

        self._unbindEnded();

        self.emit('stop');
        self._state = Audio.State.STOPPED;
      });
    },
    _bindEnded: function _bindEnded() {
      var elem = this._element;

      if (elem && elem.onEnded && !this._onended._binded) {
        this._onended._binded = true;
        elem.onEnded(this._onended);
      }
    },
    _unbindEnded: function _unbindEnded() {
      var elem = this._element;

      if (elem && elem.offEnded && this._onended._binded) {
        this._onended._binded = false;
        elem.offEnded && elem.offEnded(this._onended);
      }
    },
    getDuration: function getDuration() {
      var duration = originGetDuration.call(this); // HACK: in mini game, if dynamicly load audio, can't get duration from audioClip
      // because duration is not coming from audio deserialization

      duration = duration || (this._element ? this._element.duration : 0);
      return duration;
    },
    // adapt some special operations on web platform
    _touchToPlay: function _touchToPlay() {},
    _forceUpdatingState: function _forceUpdatingState() {}
  });
}

},{}],4:[function(require,module,exports){
"use strict";

if (cc && cc.audioEngine) {
  cc.audioEngine._maxAudioInstance = 10;
}

},{}],5:[function(require,module,exports){
"use strict";

var inputManager = cc.internal.inputManager;
var globalAdapter = window.__globalAdapter;
Object.assign(inputManager, {
  setAccelerometerEnabled: function setAccelerometerEnabled(isEnable) {
    var scheduler = cc.director.getScheduler();
    scheduler.enableForTarget(this);

    if (isEnable) {
      this._registerAccelerometerEvent();

      scheduler.scheduleUpdate(this);
    } else {
      this._unregisterAccelerometerEvent();

      scheduler.unscheduleUpdate(this);
    }
  },
  // No need to adapt
  // setAccelerometerInterval (interval) {  },
  _registerAccelerometerEvent: function _registerAccelerometerEvent() {
    this._accelCurTime = 0;
    var self = this;
    this._acceleration = new cc.Acceleration();
    globalAdapter.startAccelerometer(function (res) {
      self._acceleration.x = res.x;
      self._acceleration.y = res.y;
      self._acceleration.z = res.y;
    });
  },
  _unregisterAccelerometerEvent: function _unregisterAccelerometerEvent() {
    this._accelCurTime = 0;
    globalAdapter.stopAccelerometer();
  }
});

},{}],6:[function(require,module,exports){
"use strict";

(function () {
  if (!(cc && cc.EditBox)) {
    return;
  }

  var EditBox = cc.EditBox;
  var js = cc.js;
  var KeyboardReturnType = EditBox.KeyboardReturnType;
  var MAX_VALUE = 65535;
  var KEYBOARD_HIDE_TIME = 600;
  var _hideKeyboardTimeout = null;
  var _currentEditBoxImpl = null;

  function getKeyboardReturnType(type) {
    switch (type) {
      case KeyboardReturnType.DEFAULT:
      case KeyboardReturnType.DONE:
        return 'done';

      case KeyboardReturnType.SEND:
        return 'send';

      case KeyboardReturnType.SEARCH:
        return 'search';

      case KeyboardReturnType.GO:
        return 'go';

      case KeyboardReturnType.NEXT:
        return 'next';
    }

    return 'done';
  }

  var BaseClass = EditBox._ImplClass;

  function MiniGameEditBoxImpl() {
    BaseClass.call(this);
    this._eventListeners = {
      onKeyboardInput: null,
      onKeyboardConfirm: null,
      onKeyboardComplete: null
    };
  }

  js.extend(MiniGameEditBoxImpl, BaseClass);
  EditBox._ImplClass = MiniGameEditBoxImpl;
  Object.assign(MiniGameEditBoxImpl.prototype, {
    init: function init(delegate) {
      if (!delegate) {
        cc.error('EditBox init failed');
        return;
      }

      this._delegate = delegate;
    },
    beginEditing: function beginEditing() {
      var _this = this;

      // In case multiply register events
      if (this._editing) {
        return;
      }

      this._ensureKeyboardHide(function () {
        var delegate = _this._delegate;

        _this._showKeyboard();

        _this._registerKeyboardEvent();

        _this._editing = true;
        _currentEditBoxImpl = _this;
        delegate.editBoxEditingDidBegan();
      });
    },
    endEditing: function endEditing() {
      this._hideKeyboard();

      var cbs = this._eventListeners;
      cbs.onKeyboardComplete && cbs.onKeyboardComplete();
    },
    _registerKeyboardEvent: function _registerKeyboardEvent() {
      var self = this;
      var delegate = this._delegate;
      var cbs = this._eventListeners;

      cbs.onKeyboardInput = function (res) {
        if (delegate._string !== res.value) {
          delegate.editBoxTextChanged(res.value);
        }
      };

      cbs.onKeyboardConfirm = function (res) {
        delegate.editBoxEditingReturn();
        var cbs = self._eventListeners;
        cbs.onKeyboardComplete && cbs.onKeyboardComplete();
      };

      cbs.onKeyboardComplete = function () {
        self._editing = false;
        _currentEditBoxImpl = null;

        self._unregisterKeyboardEvent();

        delegate.editBoxEditingDidEnded();
      };

      __globalAdapter.onKeyboardInput(cbs.onKeyboardInput);

      __globalAdapter.onKeyboardConfirm(cbs.onKeyboardConfirm);

      __globalAdapter.onKeyboardComplete(cbs.onKeyboardComplete);
    },
    _unregisterKeyboardEvent: function _unregisterKeyboardEvent() {
      var cbs = this._eventListeners;

      if (cbs.onKeyboardInput) {
        __globalAdapter.offKeyboardInput(cbs.onKeyboardInput);

        cbs.onKeyboardInput = null;
      }

      if (cbs.onKeyboardConfirm) {
        __globalAdapter.offKeyboardConfirm(cbs.onKeyboardConfirm);

        cbs.onKeyboardConfirm = null;
      }

      if (cbs.onKeyboardComplete) {
        __globalAdapter.offKeyboardComplete(cbs.onKeyboardComplete);

        cbs.onKeyboardComplete = null;
      }
    },
    _otherEditing: function _otherEditing() {
      return !!_currentEditBoxImpl && _currentEditBoxImpl !== this && _currentEditBoxImpl._editing;
    },
    _ensureKeyboardHide: function _ensureKeyboardHide(cb) {
      var otherEditing = this._otherEditing();

      if (!otherEditing && !_hideKeyboardTimeout) {
        return cb();
      }

      if (_hideKeyboardTimeout) {
        clearTimeout(_hideKeyboardTimeout);
      }

      if (otherEditing) {
        _currentEditBoxImpl.endEditing();
      }

      _hideKeyboardTimeout = setTimeout(function () {
        _hideKeyboardTimeout = null;
        cb();
      }, KEYBOARD_HIDE_TIME);
    },
    _showKeyboard: function _showKeyboard() {
      var delegate = this._delegate;
      var multiline = delegate.inputMode === EditBox.InputMode.ANY;
      var maxLength = delegate.maxLength < 0 ? MAX_VALUE : delegate.maxLength;

      __globalAdapter.showKeyboard({
        defaultValue: delegate._string,
        maxLength: maxLength,
        multiple: multiline,
        confirmHold: false,
        confirmType: getKeyboardReturnType(delegate.returnType),
        success: function success(res) {},
        fail: function fail(res) {
          cc.warn(res.errMsg);
        }
      });
    },
    _hideKeyboard: function _hideKeyboard() {
      __globalAdapter.hideKeyboard({
        success: function success(res) {},
        fail: function fail(res) {
          cc.warn(res.errMsg);
        }
      });
    }
  });
})();

},{}],7:[function(require,module,exports){
"use strict";

var inputManager = cc.internal.inputManager;
var renderer = cc.renderer;
var game = cc.game;
var dynamicAtlasManager = cc.dynamicAtlasManager;
var originRun = game.run;
Object.assign(game, {
  _banRunningMainLoop: __globalAdapter.isSubContext,
  _firstSceneLaunched: false,
  run: function run() {
    var _this = this;

    cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
      _this._firstSceneLaunched = true;
    });
    originRun.apply(this, arguments);
  },
  setFrameRate: function setFrameRate(frameRate) {
    this.config.frameRate = frameRate;

    if (__globalAdapter.setPreferredFramesPerSecond) {
      __globalAdapter.setPreferredFramesPerSecond(frameRate);
    } else {
      if (this._intervalId) {
        window.cancelAnimFrame(this._intervalId);
      }

      this._intervalId = 0;
      this._paused = true;

      this._setAnimFrame();

      this._runMainLoop();
    }
  },
  _runMainLoop: function _runMainLoop() {
    if (this._banRunningMainLoop) {
      return;
    }

    var self = this,
        _callback,
        config = self.config,
        director = cc.director,
        skip = true,
        frameRate = config.frameRate;

    cc.debug.setDisplayStats(config.showFPS);

    _callback = function callback() {
      if (!self._paused) {
        self._intervalId = window.requestAnimFrame(_callback);

        if (frameRate === 30 && !__globalAdapter.setPreferredFramesPerSecond) {
          skip = !skip;

          if (skip) {
            return;
          }
        }

        director.mainLoop();
      }
    };

    self._intervalId = window.requestAnimFrame(_callback);
    self._paused = false;
  },
  _initRenderer: function _initRenderer() {
    // Avoid setup to be called twice.
    if (this._rendererInitialized) return; // frame and container are useless on minigame platform

    var sys = cc.sys;

    if (sys.platform === sys.TAOBAO) {
      this.frame = this.container = window.document.createElement("DIV");
    } else {
      this.frame = this.container = document.createElement("DIV");
    }

    var localCanvas;

    if (__globalAdapter.isSubContext) {
      localCanvas = window.sharedCanvas || __globalAdapter.getSharedCanvas();
    } else if (sys.platform === sys.TAOBAO) {
      localCanvas = window.canvas;
    } else {
      localCanvas = canvas;
    }

    this.canvas = localCanvas;

    this._determineRenderType(); // WebGL context created successfully


    if (this.renderType === this.RENDER_TYPE_WEBGL) {
      var opts = {
        'stencil': true,
        // MSAA is causing serious performance dropdown on some browsers.
        'antialias': cc.macro.ENABLE_WEBGL_ANTIALIAS,
        'alpha': cc.macro.ENABLE_TRANSPARENT_CANVAS,
        'preserveDrawingBuffer': false
      };
      renderer.initWebGL(localCanvas, opts);
      this._renderContext = renderer.device._gl; // Enable dynamic atlas manager by default

      if (!cc.macro.CLEANUP_IMAGE_CACHE && dynamicAtlasManager) {
        dynamicAtlasManager.enabled = true;
      }
    }

    if (!this._renderContext) {
      this.renderType = this.RENDER_TYPE_CANVAS; // Could be ignored by module settings

      renderer.initCanvas(localCanvas);
      this._renderContext = renderer.device._ctx;
    }

    this._rendererInitialized = true;
  },
  _initEvents: function _initEvents() {
    // register system events
    if (this.config.registerSystemEvent) {
      inputManager.registerSystemEvent(this.canvas);
    }

    var hidden = false;

    function onHidden() {
      if (!hidden) {
        hidden = true;
        game.emit(game.EVENT_HIDE);
      }
    }

    function onShown(res) {
      if (hidden) {
        hidden = false;

        if (game.renderType === game.RENDER_TYPE_WEBGL) {
          game._renderContext.finish();
        }

        game.emit(game.EVENT_SHOW, res);
      }
    }

    __globalAdapter.onAudioInterruptionEnd && __globalAdapter.onAudioInterruptionEnd(function () {
      if (cc.audioEngine) cc.audioEngine._restore();
    });
    __globalAdapter.onAudioInterruptionBegin && __globalAdapter.onAudioInterruptionBegin(function () {
      if (cc.audioEngine) cc.audioEngine._break();
    }); // Maybe not support in open data context

    __globalAdapter.onShow && __globalAdapter.onShow(onShown);
    __globalAdapter.onHide && __globalAdapter.onHide(onHidden);
    this.on(game.EVENT_HIDE, function () {
      game.pause();
    });
    this.on(game.EVENT_SHOW, function () {
      game.resume();
    });
  },
  end: function end() {} // mini game platform not support this api

});

},{}],8:[function(require,module,exports){
"use strict";

var mgr = cc.internal.inputManager;
var canvasPosition = {
  left: 0,
  top: 0,
  width: window.innerWidth,
  height: window.innerHeight
};

if (mgr) {
  Object.assign(mgr, {
    _updateCanvasBoundingRect: function _updateCanvasBoundingRect() {},
    registerSystemEvent: function registerSystemEvent(element) {
      if (this._isRegisterEvent) return;
      this._glView = cc.view;
      var self = this; //register touch event

      var _touchEventsMap = {
        onTouchStart: this.handleTouchesBegin,
        onTouchMove: this.handleTouchesMove,
        onTouchEnd: this.handleTouchesEnd,
        onTouchCancel: this.handleTouchesCancel
      };

      var registerTouchEvent = function registerTouchEvent(eventName) {
        var handler = _touchEventsMap[eventName];

        __globalAdapter[eventName](function (event) {
          if (!event.changedTouches) return;
          handler.call(self, self.getTouchesByEvent(event, canvasPosition));
        });
      };

      for (var eventName in _touchEventsMap) {
        registerTouchEvent(eventName);
      }

      this._isRegisterEvent = true;
    }
  });
}

},{}],9:[function(require,module,exports){
"use strict";

Object.assign(cc.screen, {
  autoFullScreen: function autoFullScreen(element, onFullScreenChange) {// Not support on mini game
  }
});

},{}],10:[function(require,module,exports){
"use strict";

var Texture2D = cc.Texture2D;

if (Texture2D) {
  Object.assign(Texture2D.prototype, {
    initWithElement: function initWithElement(element) {
      if (!element) return;
      this._image = element;
      this.handleLoadedTexture();
    }
  });
}

},{}],11:[function(require,module,exports){
"use strict";

function adaptSys(sys, env) {
  if (!env) {
    env = __globalAdapter.getSystemInfoSync();
  }

  var language = env.language || '';
  var system = env.system || 'iOS';
  var platform = env.platform || 'iOS';
  sys.isNative = false;
  sys.isBrowser = false;
  sys.isMobile = true;
  sys.language = language.substr(0, 2);
  sys.languageCode = language.toLowerCase();
  platform = platform.toLowerCase();

  if (platform === "android") {
    sys.os = sys.OS_ANDROID;
  } else if (platform === "ios") {
    sys.os = sys.OS_IOS;
  }

  system = system.toLowerCase(); // Adaptation to Android P

  if (system === 'android p') {
    system = 'android p 9.0';
  }

  var version = /[\d\.]+/.exec(system);
  sys.osVersion = version ? version[0] : system;
  sys.osMainVersion = parseInt(sys.osVersion);
  sys.browserType = null;
  sys.browserVersion = null;
  var w = env.windowWidth;
  var h = env.windowHeight;
  var ratio = env.pixelRatio || 1;
  sys.windowPixelResolution = {
    width: ratio * w,
    height: ratio * h
  };
  sys.localStorage = window.localStorage;

  var _supportWebGL = __globalAdapter.isSubContext ? false : true;

  ;
  var _supportWebp = false;

  try {
    var _canvas = document.createElement("canvas");

    _supportWebp = _canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch (err) {}

  sys.capabilities = {
    "canvas": true,
    "opengl": !!_supportWebGL,
    "webp": _supportWebp
  };
  sys.__audioSupport = {
    ONLY_ONE: false,
    WEB_AUDIO: false,
    DELAY_CREATE_CTX: false,
    format: ['.mp3']
  };
}

module.exports = adaptSys;

},{}],12:[function(require,module,exports){
"use strict";

function adaptContainerStrategy(containerStrategyProto) {
  containerStrategyProto._setupContainer = function (view, width, height) {
    // Setup pixel ratio for retina display
    var devicePixelRatio = view._devicePixelRatio = 1;

    if (view.isRetinaEnabled()) {
      devicePixelRatio = view._devicePixelRatio = Math.min(view._maxPixelRatio, window.devicePixelRatio || 1);
    } // size of sharedCanvas is readonly in subContext


    if (__globalAdapter.isSubContext) {
      return;
    }

    var locCanvas = cc.game.canvas; // Setup canvas

    width *= devicePixelRatio;
    height *= devicePixelRatio; // FIX: black screen on Baidu platform
    // reset canvas size may call gl.clear(), especially when you call cc.director.loadScene()

    if (locCanvas.width !== width || locCanvas.height !== height) {
      locCanvas.width = width;
      locCanvas.height = height;
    }
  };
}

module.exports = adaptContainerStrategy;

},{}],13:[function(require,module,exports){
"use strict";

function adaptView(viewProto) {
  Object.assign(viewProto, {
    _adjustViewportMeta: function _adjustViewportMeta() {// minigame not support
    },
    setRealPixelResolution: function setRealPixelResolution(width, height, resolutionPolicy) {
      // Reset the resolution size and policy
      this.setDesignResolutionSize(width, height, resolutionPolicy);
    },
    enableAutoFullScreen: function enableAutoFullScreen(enabled) {
      cc.warn('cc.view.enableAutoFullScreen() is not supported on minigame platform.');
    },
    isAutoFullScreenEnabled: function isAutoFullScreenEnabled() {
      return false;
    },
    setCanvasSize: function setCanvasSize() {
      cc.warn('cc.view.setCanvasSize() is not supported on minigame platform.');
    },
    setFrameSize: function setFrameSize() {
      cc.warn('frame size is readonly on minigame platform.');
    },
    _initFrameSize: function _initFrameSize() {
      var locFrameSize = this._frameSize;

      if (__globalAdapter.isSubContext) {
        var sharedCanvas = window.sharedCanvas || __globalAdapter.getSharedCanvas();

        locFrameSize.width = sharedCanvas.width;
        locFrameSize.height = sharedCanvas.height;
      } else {
        locFrameSize.width = window.innerWidth;
        locFrameSize.height = window.innerHeight;
      }
    }
  });
}

module.exports = adaptView;

},{}],14:[function(require,module,exports){
"use strict";

var adapter = window.__globalAdapter;
Object.assign(adapter, {
  adaptSys: require('./BaseSystemInfo'),
  adaptView: require('./View'),
  adaptContainerStrategy: require('./ContainerStrategy')
});

},{"./BaseSystemInfo":11,"./ContainerStrategy":12,"./View":13}],15:[function(require,module,exports){
"use strict";

require('./Audio');

require('./AudioEngine');

require('./DeviceMotionEvent');

require('./Editbox');

require('./Game');

require('./InputManager');

require('./AssetManager');

require('./Screen');

require('./Texture2D');

require('./misc');

},{"./AssetManager":2,"./Audio":3,"./AudioEngine":4,"./DeviceMotionEvent":5,"./Editbox":6,"./Game":7,"./InputManager":8,"./Screen":9,"./Texture2D":10,"./misc":16}],16:[function(require,module,exports){
"use strict";

cc.macro.DOWNLOAD_MAX_CONCURRENT = 10;

},{}],17:[function(require,module,exports){
"use strict";

var utils = {
  /**
   * @param {Object} target 
   * @param {Object} origin 
   * @param {String} methodName 
   * @param {String} targetMethodName 
   */
  cloneMethod: function cloneMethod(target, origin, methodName, targetMethodName) {
    if (origin[methodName]) {
      targetMethodName = targetMethodName || methodName;
      target[targetMethodName] = origin[methodName].bind(origin);
    }
  }
};
module.exports = utils;

},{}],18:[function(require,module,exports){
"use strict";

function DOMParser(options) {
  this.options = options || {
    locator: {}
  };
}

DOMParser.prototype.parseFromString = function (source, mimeType) {
  var options = this.options;
  var sax = new XMLReader();
  var domBuilder = options.domBuilder || new DOMHandler(); //contentHandler and LexicalHandler

  var errorHandler = options.errorHandler;
  var locator = options.locator;
  var defaultNSMap = options.xmlns || {};
  var isHTML = /\/x?html?$/.test(mimeType); //mimeType.toLowerCase().indexOf('html') > -1;

  var entityMap = isHTML ? htmlEntity.entityMap : {
    'lt': '<',
    'gt': '>',
    'amp': '&',
    'quot': '"',
    'apos': "'"
  };

  if (locator) {
    domBuilder.setDocumentLocator(locator);
  }

  sax.errorHandler = buildErrorHandler(errorHandler, domBuilder, locator);
  sax.domBuilder = options.domBuilder || domBuilder;

  if (isHTML) {
    defaultNSMap[''] = 'http://www.w3.org/1999/xhtml';
  }

  defaultNSMap.xml = defaultNSMap.xml || 'http://www.w3.org/XML/1998/namespace';

  if (source) {
    sax.parse(source, defaultNSMap, entityMap);
  } else {
    sax.errorHandler.error("invalid doc source");
  }

  return domBuilder.doc;
};

function buildErrorHandler(errorImpl, domBuilder, locator) {
  if (!errorImpl) {
    if (domBuilder instanceof DOMHandler) {
      return domBuilder;
    }

    errorImpl = domBuilder;
  }

  var errorHandler = {};
  var isCallback = errorImpl instanceof Function;
  locator = locator || {};

  function build(key) {
    var fn = errorImpl[key];

    if (!fn && isCallback) {
      fn = errorImpl.length == 2 ? function (msg) {
        errorImpl(key, msg);
      } : errorImpl;
    }

    errorHandler[key] = fn && function (msg) {
      fn('[xmldom ' + key + ']\t' + msg + _locator(locator));
    } || function () {};
  }

  build('warning');
  build('error');
  build('fatalError');
  return errorHandler;
} //console.log('#\n\n\n\n\n\n\n####')

/**
 * +ContentHandler+ErrorHandler
 * +LexicalHandler+EntityResolver2
 * -DeclHandler-DTDHandler 
 * 
 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
 */


function DOMHandler() {
  this.cdata = false;
}

function position(locator, node) {
  node.lineNumber = locator.lineNumber;
  node.columnNumber = locator.columnNumber;
}
/**
 * @see org.xml.sax.ContentHandler#startDocument
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
 */


DOMHandler.prototype = {
  startDocument: function startDocument() {
    this.doc = new DOMImplementation().createDocument(null, null, null);

    if (this.locator) {
      this.doc.documentURI = this.locator.systemId;
    }
  },
  startElement: function startElement(namespaceURI, localName, qName, attrs) {
    var doc = this.doc;
    var el = doc.createElementNS(namespaceURI, qName || localName);
    var len = attrs.length;
    appendElement(this, el);
    this.currentElement = el;
    this.locator && position(this.locator, el);

    for (var i = 0; i < len; i++) {
      var namespaceURI = attrs.getURI(i);
      var value = attrs.getValue(i);
      var qName = attrs.getQName(i);
      var attr = doc.createAttributeNS(namespaceURI, qName);
      this.locator && position(attrs.getLocator(i), attr);
      attr.value = attr.nodeValue = value;
      el.setAttributeNode(attr);
    }
  },
  endElement: function endElement(namespaceURI, localName, qName) {
    var current = this.currentElement;
    var tagName = current.tagName;
    this.currentElement = current.parentNode;
  },
  startPrefixMapping: function startPrefixMapping(prefix, uri) {},
  endPrefixMapping: function endPrefixMapping(prefix) {},
  processingInstruction: function processingInstruction(target, data) {
    var ins = this.doc.createProcessingInstruction(target, data);
    this.locator && position(this.locator, ins);
    appendElement(this, ins);
  },
  ignorableWhitespace: function ignorableWhitespace(ch, start, length) {},
  characters: function characters(chars, start, length) {
    chars = _toString.apply(this, arguments); //console.log(chars)

    if (chars) {
      if (this.cdata) {
        var charNode = this.doc.createCDATASection(chars);
      } else {
        var charNode = this.doc.createTextNode(chars);
      }

      if (this.currentElement) {
        this.currentElement.appendChild(charNode);
      } else if (/^\s*$/.test(chars)) {
        this.doc.appendChild(charNode); //process xml
      }

      this.locator && position(this.locator, charNode);
    }
  },
  skippedEntity: function skippedEntity(name) {},
  endDocument: function endDocument() {
    this.doc.normalize();
  },
  setDocumentLocator: function setDocumentLocator(locator) {
    if (this.locator = locator) {
      // && !('lineNumber' in locator)){
      locator.lineNumber = 0;
    }
  },
  //LexicalHandler
  comment: function comment(chars, start, length) {
    chars = _toString.apply(this, arguments);
    var comm = this.doc.createComment(chars);
    this.locator && position(this.locator, comm);
    appendElement(this, comm);
  },
  startCDATA: function startCDATA() {
    //used in characters() methods
    this.cdata = true;
  },
  endCDATA: function endCDATA() {
    this.cdata = false;
  },
  startDTD: function startDTD(name, publicId, systemId) {
    var impl = this.doc.implementation;

    if (impl && impl.createDocumentType) {
      var dt = impl.createDocumentType(name, publicId, systemId);
      this.locator && position(this.locator, dt);
      appendElement(this, dt);
    }
  },

  /**
   * @see org.xml.sax.ErrorHandler
   * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
   */
  warning: function warning(error) {
    console.warn('[xmldom warning]\t' + error, _locator(this.locator));
  },
  error: function error(_error) {
    console.error('[xmldom error]\t' + _error, _locator(this.locator));
  },
  fatalError: function fatalError(error) {
    console.error('[xmldom fatalError]\t' + error, _locator(this.locator));
    throw error;
  }
};

function _locator(l) {
  if (l) {
    return '\n@' + (l.systemId || '') + '#[line:' + l.lineNumber + ',col:' + l.columnNumber + ']';
  }
}

function _toString(chars, start, length) {
  if (typeof chars == 'string') {
    return chars.substr(start, length);
  } else {
    //java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
    if (chars.length >= start + length || start) {
      return new java.lang.String(chars, start, length) + '';
    }

    return chars;
  }
}
/*
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
 * used method of org.xml.sax.ext.LexicalHandler:
 *  #comment(chars, start, length)
 *  #startCDATA()
 *  #endCDATA()
 *  #startDTD(name, publicId, systemId)
 *
 *
 * IGNORED method of org.xml.sax.ext.LexicalHandler:
 *  #endDTD()
 *  #startEntity(name)
 *  #endEntity(name)
 *
 *
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
 * IGNORED method of org.xml.sax.ext.DeclHandler
 * 	#attributeDecl(eName, aName, type, mode, value)
 *  #elementDecl(name, model)
 *  #externalEntityDecl(name, publicId, systemId)
 *  #internalEntityDecl(name, value)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
 * IGNORED method of org.xml.sax.EntityResolver2
 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
 *  #resolveEntity(publicId, systemId)
 *  #getExternalSubset(name, baseURI)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
 * IGNORED method of org.xml.sax.DTDHandler
 *  #notationDecl(name, publicId, systemId) {};
 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
 */


"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function (key) {
  DOMHandler.prototype[key] = function () {
    return null;
  };
});
/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */

function appendElement(hander, node) {
  if (!hander.currentElement) {
    hander.doc.appendChild(node);
  } else {
    hander.currentElement.appendChild(node);
  }
} //appendChild and setAttributeNS are preformance key
//if(typeof require == 'function'){


var htmlEntity = require('./entities');

var XMLReader = require('./sax').XMLReader;

var DOMImplementation = exports.DOMImplementation = require('./dom').DOMImplementation;

exports.XMLSerializer = require('./dom').XMLSerializer;
exports.DOMParser = DOMParser; //}

},{"./dom":19,"./entities":20,"./sax":21}],19:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

/*
 * DOM Level 2
 * Object DOMException
 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
 */
function copy(src, dest) {
  for (var p in src) {
    dest[p] = src[p];
  }
}
/**
^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
 */


function _extends(Class, Super) {
  var pt = Class.prototype;

  if (!(pt instanceof Super)) {
    var t = function t() {};

    ;
    t.prototype = Super.prototype;
    t = new t(); // copy(pt,t);

    for (var p in pt) {
      t[p] = pt[p];
    }

    Class.prototype = pt = t;
  }

  if (pt.constructor != Class) {
    if (typeof Class != 'function') {
      console.error("unknow Class:" + Class);
    }

    pt.constructor = Class;
  }
}

var htmlns = 'http://www.w3.org/1999/xhtml'; // Node Types

var NodeType = {};
var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
var TEXT_NODE = NodeType.TEXT_NODE = 3;
var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
var NOTATION_NODE = NodeType.NOTATION_NODE = 12; // ExceptionCode

var ExceptionCode = {};
var ExceptionMessage = {};
var INDEX_SIZE_ERR = ExceptionCode.INDEX_SIZE_ERR = (ExceptionMessage[1] = "Index size error", 1);
var DOMSTRING_SIZE_ERR = ExceptionCode.DOMSTRING_SIZE_ERR = (ExceptionMessage[2] = "DOMString size error", 2);
var HIERARCHY_REQUEST_ERR = ExceptionCode.HIERARCHY_REQUEST_ERR = (ExceptionMessage[3] = "Hierarchy request error", 3);
var WRONG_DOCUMENT_ERR = ExceptionCode.WRONG_DOCUMENT_ERR = (ExceptionMessage[4] = "Wrong document", 4);
var INVALID_CHARACTER_ERR = ExceptionCode.INVALID_CHARACTER_ERR = (ExceptionMessage[5] = "Invalid character", 5);
var NO_DATA_ALLOWED_ERR = ExceptionCode.NO_DATA_ALLOWED_ERR = (ExceptionMessage[6] = "No data allowed", 6);
var NO_MODIFICATION_ALLOWED_ERR = ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = (ExceptionMessage[7] = "No modification allowed", 7);
var NOT_FOUND_ERR = ExceptionCode.NOT_FOUND_ERR = (ExceptionMessage[8] = "Not found", 8);
var NOT_SUPPORTED_ERR = ExceptionCode.NOT_SUPPORTED_ERR = (ExceptionMessage[9] = "Not supported", 9);
var INUSE_ATTRIBUTE_ERR = ExceptionCode.INUSE_ATTRIBUTE_ERR = (ExceptionMessage[10] = "Attribute in use", 10); //level2

var INVALID_STATE_ERR = ExceptionCode.INVALID_STATE_ERR = (ExceptionMessage[11] = "Invalid state", 11);
var SYNTAX_ERR = ExceptionCode.SYNTAX_ERR = (ExceptionMessage[12] = "Syntax error", 12);
var INVALID_MODIFICATION_ERR = ExceptionCode.INVALID_MODIFICATION_ERR = (ExceptionMessage[13] = "Invalid modification", 13);
var NAMESPACE_ERR = ExceptionCode.NAMESPACE_ERR = (ExceptionMessage[14] = "Invalid namespace", 14);
var INVALID_ACCESS_ERR = ExceptionCode.INVALID_ACCESS_ERR = (ExceptionMessage[15] = "Invalid access", 15);

function DOMException(code, message) {
  if (message instanceof Error) {
    var error = message;
  } else {
    error = this;
    Error.call(this, ExceptionMessage[code]);
    this.message = ExceptionMessage[code];
    if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
  }

  error.code = code;
  if (message) this.message = this.message + ": " + message;
  return error;
}

;
DOMException.prototype = Error.prototype;
copy(ExceptionCode, DOMException);
/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
 * The items in the NodeList are accessible via an integral index, starting from 0.
 */

function NodeList() {}

;
NodeList.prototype = {
  /**
   * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
   * @standard level1
   */
  length: 0,

  /**
   * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
   * @standard level1
   * @param index  unsigned long 
   *   Index into the collection.
   * @return Node
   * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
   */
  item: function item(index) {
    return this[index] || null;
  },
  toString: function toString(isHTML, nodeFilter) {
    for (var buf = [], i = 0; i < this.length; i++) {
      serializeToString(this[i], buf, isHTML, nodeFilter);
    }

    return buf.join('');
  }
};

function LiveNodeList(node, refresh) {
  this._node = node;
  this._refresh = refresh;

  _updateLiveList(this);
}

function _updateLiveList(list) {
  var inc = list._node._inc || list._node.ownerDocument._inc;

  if (list._inc != inc) {
    var ls = list._refresh(list._node); //console.log(ls.length)


    __set__(list, 'length', ls.length); //copy(ls,list);


    for (var p in ls) {
      list[p] = ls[p];
    }

    list._inc = inc;
  }
}

LiveNodeList.prototype.item = function (i) {
  _updateLiveList(this);

  return this[i];
};

_extends(LiveNodeList, NodeList);
/**
 * 
 * Objects implementing the NamedNodeMap interface are used to represent collections of nodes that can be accessed by name. Note that NamedNodeMap does not inherit from NodeList; NamedNodeMaps are not maintained in any particular order. Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index, but this is simply to allow convenient enumeration of the contents of a NamedNodeMap, and does not imply that the DOM specifies an order to these Nodes.
 * NamedNodeMap objects in the DOM are live.
 * used for attributes or DocumentType entities 
 */


function NamedNodeMap() {}

;

function _findNodeIndex(list, node) {
  var i = list.length;

  while (i--) {
    if (list[i] === node) {
      return i;
    }
  }
}

function _addNamedNode(el, list, newAttr, oldAttr) {
  if (oldAttr) {
    list[_findNodeIndex(list, oldAttr)] = newAttr;
  } else {
    list[list.length++] = newAttr;
  }

  if (el) {
    newAttr.ownerElement = el;
    var doc = el.ownerDocument;

    if (doc) {
      oldAttr && _onRemoveAttribute(doc, el, oldAttr);

      _onAddAttribute(doc, el, newAttr);
    }
  }
}

function _removeNamedNode(el, list, attr) {
  //console.log('remove attr:'+attr)
  var i = _findNodeIndex(list, attr);

  if (i >= 0) {
    var lastIndex = list.length - 1;

    while (i < lastIndex) {
      list[i] = list[++i];
    }

    list.length = lastIndex;

    if (el) {
      var doc = el.ownerDocument;

      if (doc) {
        _onRemoveAttribute(doc, el, attr);

        attr.ownerElement = null;
      }
    }
  } else {
    throw DOMException(NOT_FOUND_ERR, new Error(el.tagName + '@' + attr));
  }
}

NamedNodeMap.prototype = {
  length: 0,
  item: NodeList.prototype.item,
  getNamedItem: function getNamedItem(key) {
    //		if(key.indexOf(':')>0 || key == 'xmlns'){
    //			return null;
    //		}
    //console.log()
    var i = this.length;

    while (i--) {
      var attr = this[i]; //console.log(attr.nodeName,key)

      if (attr.nodeName == key) {
        return attr;
      }
    }
  },
  setNamedItem: function setNamedItem(attr) {
    var el = attr.ownerElement;

    if (el && el != this._ownerElement) {
      throw new DOMException(INUSE_ATTRIBUTE_ERR);
    }

    var oldAttr = this.getNamedItem(attr.nodeName);

    _addNamedNode(this._ownerElement, this, attr, oldAttr);

    return oldAttr;
  },

  /* returns Node */
  setNamedItemNS: function setNamedItemNS(attr) {
    // raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
    var el = attr.ownerElement,
        oldAttr;

    if (el && el != this._ownerElement) {
      throw new DOMException(INUSE_ATTRIBUTE_ERR);
    }

    oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);

    _addNamedNode(this._ownerElement, this, attr, oldAttr);

    return oldAttr;
  },

  /* returns Node */
  removeNamedItem: function removeNamedItem(key) {
    var attr = this.getNamedItem(key);

    _removeNamedNode(this._ownerElement, this, attr);

    return attr;
  },
  // raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
  //for level2
  removeNamedItemNS: function removeNamedItemNS(namespaceURI, localName) {
    var attr = this.getNamedItemNS(namespaceURI, localName);

    _removeNamedNode(this._ownerElement, this, attr);

    return attr;
  },
  getNamedItemNS: function getNamedItemNS(namespaceURI, localName) {
    var i = this.length;

    while (i--) {
      var node = this[i];

      if (node.localName == localName && node.namespaceURI == namespaceURI) {
        return node;
      }
    }

    return null;
  }
};
/**
 * @see http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490
 */

function DOMImplementation(
/* Object */
features) {
  this._features = {};

  if (features) {
    for (var feature in features) {
      this._features = features[feature];
    }
  }
}

;
DOMImplementation.prototype = {
  hasFeature: function hasFeature(
  /* string */
  feature,
  /* string */
  version) {
    var versions = this._features[feature.toLowerCase()];

    if (versions && (!version || version in versions)) {
      return true;
    } else {
      return false;
    }
  },
  // Introduced in DOM Level 2:
  createDocument: function createDocument(namespaceURI, qualifiedName, doctype) {
    // raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
    var doc = new Document();
    doc.implementation = this;
    doc.childNodes = new NodeList();
    doc.doctype = doctype;

    if (doctype) {
      doc.appendChild(doctype);
    }

    if (qualifiedName) {
      var root = doc.createElementNS(namespaceURI, qualifiedName);
      doc.appendChild(root);
    }

    return doc;
  },
  // Introduced in DOM Level 2:
  createDocumentType: function createDocumentType(qualifiedName, publicId, systemId) {
    // raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR
    var node = new DocumentType();
    node.name = qualifiedName;
    node.nodeName = qualifiedName;
    node.publicId = publicId;
    node.systemId = systemId; // Introduced in DOM Level 2:
    //readonly attribute DOMString        internalSubset;
    //TODO:..
    //  readonly attribute NamedNodeMap     entities;
    //  readonly attribute NamedNodeMap     notations;

    return node;
  }
};
/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
 */

function Node() {}

;
Node.prototype = {
  firstChild: null,
  lastChild: null,
  previousSibling: null,
  nextSibling: null,
  attributes: null,
  parentNode: null,
  childNodes: null,
  ownerDocument: null,
  nodeValue: null,
  namespaceURI: null,
  prefix: null,
  localName: null,
  // Modified in DOM Level 2:
  insertBefore: function insertBefore(newChild, refChild) {
    //raises 
    return _insertBefore(this, newChild, refChild);
  },
  replaceChild: function replaceChild(newChild, oldChild) {
    //raises 
    this.insertBefore(newChild, oldChild);

    if (oldChild) {
      this.removeChild(oldChild);
    }
  },
  removeChild: function removeChild(oldChild) {
    return _removeChild(this, oldChild);
  },
  appendChild: function appendChild(newChild) {
    return this.insertBefore(newChild, null);
  },
  hasChildNodes: function hasChildNodes() {
    return this.firstChild != null;
  },
  cloneNode: function cloneNode(deep) {
    return _cloneNode(this.ownerDocument || this, this, deep);
  },
  // Modified in DOM Level 2:
  normalize: function normalize() {
    var child = this.firstChild;

    while (child) {
      var next = child.nextSibling;

      if (next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE) {
        this.removeChild(next);
        child.appendData(next.data);
      } else {
        child.normalize();
        child = next;
      }
    }
  },
  // Introduced in DOM Level 2:
  isSupported: function isSupported(feature, version) {
    return this.ownerDocument.implementation.hasFeature(feature, version);
  },
  // Introduced in DOM Level 2:
  hasAttributes: function hasAttributes() {
    return this.attributes.length > 0;
  },
  lookupPrefix: function lookupPrefix(namespaceURI) {
    var el = this;

    while (el) {
      var map = el._nsMap; //console.dir(map)

      if (map) {
        for (var n in map) {
          if (map[n] == namespaceURI) {
            return n;
          }
        }
      }

      el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
    }

    return null;
  },
  // Introduced in DOM Level 3:
  lookupNamespaceURI: function lookupNamespaceURI(prefix) {
    var el = this;

    while (el) {
      var map = el._nsMap; //console.dir(map)

      if (map) {
        if (prefix in map) {
          return map[prefix];
        }
      }

      el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
    }

    return null;
  },
  // Introduced in DOM Level 3:
  isDefaultNamespace: function isDefaultNamespace(namespaceURI) {
    var prefix = this.lookupPrefix(namespaceURI);
    return prefix == null;
  }
};

function _xmlEncoder(c) {
  return c == '<' && '&lt;' || c == '>' && '&gt;' || c == '&' && '&amp;' || c == '"' && '&quot;' || '&#' + c.charCodeAt() + ';';
}

copy(NodeType, Node);
copy(NodeType, Node.prototype);
/**
 * @param callback return true for continue,false for break
 * @return boolean true: break visit;
 */

function _visitNode(node, callback) {
  if (callback(node)) {
    return true;
  }

  if (node = node.firstChild) {
    do {
      if (_visitNode(node, callback)) {
        return true;
      }
    } while (node = node.nextSibling);
  }
}

function Document() {}

function _onAddAttribute(doc, el, newAttr) {
  doc && doc._inc++;
  var ns = newAttr.namespaceURI;

  if (ns == 'http://www.w3.org/2000/xmlns/') {
    //update namespace
    el._nsMap[newAttr.prefix ? newAttr.localName : ''] = newAttr.value;
  }
}

function _onRemoveAttribute(doc, el, newAttr, remove) {
  doc && doc._inc++;
  var ns = newAttr.namespaceURI;

  if (ns == 'http://www.w3.org/2000/xmlns/') {
    //update namespace
    delete el._nsMap[newAttr.prefix ? newAttr.localName : ''];
  }
}

function _onUpdateChild(doc, el, newChild) {
  if (doc && doc._inc) {
    doc._inc++; //update childNodes

    var cs = el.childNodes;

    if (newChild) {
      cs[cs.length++] = newChild;
    } else {
      //console.log(1)
      var child = el.firstChild;
      var i = 0;

      while (child) {
        cs[i++] = child;
        child = child.nextSibling;
      }

      cs.length = i;
    }
  }
}
/**
 * attributes;
 * children;
 * 
 * writeable properties:
 * nodeValue,Attr:value,CharacterData:data
 * prefix
 */


function _removeChild(parentNode, child) {
  var previous = child.previousSibling;
  var next = child.nextSibling;

  if (previous) {
    previous.nextSibling = next;
  } else {
    parentNode.firstChild = next;
  }

  if (next) {
    next.previousSibling = previous;
  } else {
    parentNode.lastChild = previous;
  }

  _onUpdateChild(parentNode.ownerDocument, parentNode);

  return child;
}
/**
 * preformance key(refChild == null)
 */


function _insertBefore(parentNode, newChild, nextChild) {
  var cp = newChild.parentNode;

  if (cp) {
    cp.removeChild(newChild); //remove and update
  }

  if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
    var newFirst = newChild.firstChild;

    if (newFirst == null) {
      return newChild;
    }

    var newLast = newChild.lastChild;
  } else {
    newFirst = newLast = newChild;
  }

  var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;
  newFirst.previousSibling = pre;
  newLast.nextSibling = nextChild;

  if (pre) {
    pre.nextSibling = newFirst;
  } else {
    parentNode.firstChild = newFirst;
  }

  if (nextChild == null) {
    parentNode.lastChild = newLast;
  } else {
    nextChild.previousSibling = newLast;
  }

  do {
    newFirst.parentNode = parentNode;
  } while (newFirst !== newLast && (newFirst = newFirst.nextSibling));

  _onUpdateChild(parentNode.ownerDocument || parentNode, parentNode); //console.log(parentNode.lastChild.nextSibling == null)


  if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
    newChild.firstChild = newChild.lastChild = null;
  }

  return newChild;
}

function _appendSingleChild(parentNode, newChild) {
  var cp = newChild.parentNode;

  if (cp) {
    var pre = parentNode.lastChild;
    cp.removeChild(newChild); //remove and update

    var pre = parentNode.lastChild;
  }

  var pre = parentNode.lastChild;
  newChild.parentNode = parentNode;
  newChild.previousSibling = pre;
  newChild.nextSibling = null;

  if (pre) {
    pre.nextSibling = newChild;
  } else {
    parentNode.firstChild = newChild;
  }

  parentNode.lastChild = newChild;

  _onUpdateChild(parentNode.ownerDocument, parentNode, newChild);

  return newChild; //console.log("__aa",parentNode.lastChild.nextSibling == null)
}

Document.prototype = {
  //implementation : null,
  nodeName: '#document',
  nodeType: DOCUMENT_NODE,
  doctype: null,
  documentElement: null,
  _inc: 1,
  insertBefore: function insertBefore(newChild, refChild) {
    //raises 
    if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
      var child = newChild.firstChild;

      while (child) {
        var next = child.nextSibling;
        this.insertBefore(child, refChild);
        child = next;
      }

      return newChild;
    }

    if (this.documentElement == null && newChild.nodeType == ELEMENT_NODE) {
      this.documentElement = newChild;
    }

    return _insertBefore(this, newChild, refChild), newChild.ownerDocument = this, newChild;
  },
  removeChild: function removeChild(oldChild) {
    if (this.documentElement == oldChild) {
      this.documentElement = null;
    }

    return _removeChild(this, oldChild);
  },
  // Introduced in DOM Level 2:
  importNode: function importNode(importedNode, deep) {
    return _importNode(this, importedNode, deep);
  },
  // Introduced in DOM Level 2:
  getElementById: function getElementById(id) {
    var rtv = null;

    _visitNode(this.documentElement, function (node) {
      if (node.nodeType == ELEMENT_NODE) {
        if (node.getAttribute('id') == id) {
          rtv = node;
          return true;
        }
      }
    });

    return rtv;
  },
  //document factory method:
  createElement: function createElement(tagName) {
    var node = new Element();
    node.ownerDocument = this;
    node.nodeName = tagName;
    node.tagName = tagName;
    node.childNodes = new NodeList();
    var attrs = node.attributes = new NamedNodeMap();
    attrs._ownerElement = node;
    return node;
  },
  createDocumentFragment: function createDocumentFragment() {
    var node = new DocumentFragment();
    node.ownerDocument = this;
    node.childNodes = new NodeList();
    return node;
  },
  createTextNode: function createTextNode(data) {
    var node = new Text();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  },
  createComment: function createComment(data) {
    var node = new Comment();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  },
  createCDATASection: function createCDATASection(data) {
    var node = new CDATASection();
    node.ownerDocument = this;
    node.appendData(data);
    return node;
  },
  createProcessingInstruction: function createProcessingInstruction(target, data) {
    var node = new ProcessingInstruction();
    node.ownerDocument = this;
    node.tagName = node.target = target;
    node.nodeValue = node.data = data;
    return node;
  },
  createAttribute: function createAttribute(name) {
    var node = new Attr();
    node.ownerDocument = this;
    node.name = name;
    node.nodeName = name;
    node.localName = name;
    node.specified = true;
    return node;
  },
  createEntityReference: function createEntityReference(name) {
    var node = new EntityReference();
    node.ownerDocument = this;
    node.nodeName = name;
    return node;
  },
  // Introduced in DOM Level 2:
  createElementNS: function createElementNS(namespaceURI, qualifiedName) {
    var node = new Element();
    var pl = qualifiedName.split(':');
    var attrs = node.attributes = new NamedNodeMap();
    node.childNodes = new NodeList();
    node.ownerDocument = this;
    node.nodeName = qualifiedName;
    node.tagName = qualifiedName;
    node.namespaceURI = namespaceURI;

    if (pl.length == 2) {
      node.prefix = pl[0];
      node.localName = pl[1];
    } else {
      //el.prefix = null;
      node.localName = qualifiedName;
    }

    attrs._ownerElement = node;
    return node;
  },
  // Introduced in DOM Level 2:
  createAttributeNS: function createAttributeNS(namespaceURI, qualifiedName) {
    var node = new Attr();
    var pl = qualifiedName.split(':');
    node.ownerDocument = this;
    node.nodeName = qualifiedName;
    node.name = qualifiedName;
    node.namespaceURI = namespaceURI;
    node.specified = true;

    if (pl.length == 2) {
      node.prefix = pl[0];
      node.localName = pl[1];
    } else {
      //el.prefix = null;
      node.localName = qualifiedName;
    }

    return node;
  }
};

_extends(Document, Node);

function Element() {
  this._nsMap = {};
}

;
Element.prototype = {
  nodeType: ELEMENT_NODE,
  hasAttribute: function hasAttribute(name) {
    return this.getAttributeNode(name) != null;
  },
  getAttribute: function getAttribute(name) {
    var attr = this.getAttributeNode(name);
    return attr && attr.value || '';
  },
  getAttributeNode: function getAttributeNode(name) {
    return this.attributes.getNamedItem(name);
  },
  setAttribute: function setAttribute(name, value) {
    var attr = this.ownerDocument.createAttribute(name);
    attr.value = attr.nodeValue = "" + value;
    this.setAttributeNode(attr);
  },
  removeAttribute: function removeAttribute(name) {
    var attr = this.getAttributeNode(name);
    attr && this.removeAttributeNode(attr);
  },
  //four real opeartion method
  appendChild: function appendChild(newChild) {
    if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
      return this.insertBefore(newChild, null);
    } else {
      return _appendSingleChild(this, newChild);
    }
  },
  setAttributeNode: function setAttributeNode(newAttr) {
    return this.attributes.setNamedItem(newAttr);
  },
  setAttributeNodeNS: function setAttributeNodeNS(newAttr) {
    return this.attributes.setNamedItemNS(newAttr);
  },
  removeAttributeNode: function removeAttributeNode(oldAttr) {
    //console.log(this == oldAttr.ownerElement)
    return this.attributes.removeNamedItem(oldAttr.nodeName);
  },
  //get real attribute name,and remove it by removeAttributeNode
  removeAttributeNS: function removeAttributeNS(namespaceURI, localName) {
    var old = this.getAttributeNodeNS(namespaceURI, localName);
    old && this.removeAttributeNode(old);
  },
  hasAttributeNS: function hasAttributeNS(namespaceURI, localName) {
    return this.getAttributeNodeNS(namespaceURI, localName) != null;
  },
  getAttributeNS: function getAttributeNS(namespaceURI, localName) {
    var attr = this.getAttributeNodeNS(namespaceURI, localName);
    return attr && attr.value || '';
  },
  setAttributeNS: function setAttributeNS(namespaceURI, qualifiedName, value) {
    var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
    attr.value = attr.nodeValue = "" + value;
    this.setAttributeNode(attr);
  },
  getAttributeNodeNS: function getAttributeNodeNS(namespaceURI, localName) {
    return this.attributes.getNamedItemNS(namespaceURI, localName);
  },
  getElementsByTagName: function getElementsByTagName(tagName) {
    return new LiveNodeList(this, function (base) {
      var ls = [];

      _visitNode(base, function (node) {
        if (node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)) {
          ls.push(node);
        }
      });

      return ls;
    });
  },
  getElementsByTagNameNS: function getElementsByTagNameNS(namespaceURI, localName) {
    return new LiveNodeList(this, function (base) {
      var ls = [];

      _visitNode(base, function (node) {
        if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === '*' || node.namespaceURI === namespaceURI) && (localName === '*' || node.localName == localName)) {
          ls.push(node);
        }
      });

      return ls;
    });
  }
};
Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;

_extends(Element, Node);

function Attr() {}

;
Attr.prototype.nodeType = ATTRIBUTE_NODE;

_extends(Attr, Node);

function CharacterData() {}

;
CharacterData.prototype = {
  data: '',
  substringData: function substringData(offset, count) {
    return this.data.substring(offset, offset + count);
  },
  appendData: function appendData(text) {
    text = this.data + text;
    this.nodeValue = this.data = text;
    this.length = text.length;
  },
  insertData: function insertData(offset, text) {
    this.replaceData(offset, 0, text);
  },
  appendChild: function appendChild(newChild) {
    throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR]);
  },
  deleteData: function deleteData(offset, count) {
    this.replaceData(offset, count, "");
  },
  replaceData: function replaceData(offset, count, text) {
    var start = this.data.substring(0, offset);
    var end = this.data.substring(offset + count);
    text = start + text + end;
    this.nodeValue = this.data = text;
    this.length = text.length;
  }
};

_extends(CharacterData, Node);

function Text() {}

;
Text.prototype = {
  nodeName: "#text",
  nodeType: TEXT_NODE,
  splitText: function splitText(offset) {
    var text = this.data;
    var newText = text.substring(offset);
    text = text.substring(0, offset);
    this.data = this.nodeValue = text;
    this.length = text.length;
    var newNode = this.ownerDocument.createTextNode(newText);

    if (this.parentNode) {
      this.parentNode.insertBefore(newNode, this.nextSibling);
    }

    return newNode;
  }
};

_extends(Text, CharacterData);

function Comment() {}

;
Comment.prototype = {
  nodeName: "#comment",
  nodeType: COMMENT_NODE
};

_extends(Comment, CharacterData);

function CDATASection() {}

;
CDATASection.prototype = {
  nodeName: "#cdata-section",
  nodeType: CDATA_SECTION_NODE
};

_extends(CDATASection, CharacterData);

function DocumentType() {}

;
DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;

_extends(DocumentType, Node);

function Notation() {}

;
Notation.prototype.nodeType = NOTATION_NODE;

_extends(Notation, Node);

function Entity() {}

;
Entity.prototype.nodeType = ENTITY_NODE;

_extends(Entity, Node);

function EntityReference() {}

;
EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;

_extends(EntityReference, Node);

function DocumentFragment() {}

;
DocumentFragment.prototype.nodeName = "#document-fragment";
DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;

_extends(DocumentFragment, Node);

function ProcessingInstruction() {}

ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;

_extends(ProcessingInstruction, Node);

function XMLSerializer() {}

XMLSerializer.prototype.serializeToString = function (node, isHtml, nodeFilter) {
  return nodeSerializeToString.call(node, isHtml, nodeFilter);
};

Node.prototype.toString = nodeSerializeToString;

function nodeSerializeToString(isHtml, nodeFilter) {
  var buf = [];
  var refNode = this.nodeType == 9 && this.documentElement || this;
  var prefix = refNode.prefix;
  var uri = refNode.namespaceURI;

  if (uri && prefix == null) {
    //console.log(prefix)
    var prefix = refNode.lookupPrefix(uri);

    if (prefix == null) {
      //isHTML = true;
      var visibleNamespaces = [{
        namespace: uri,
        prefix: null
      } //{namespace:uri,prefix:''}
      ];
    }
  }

  serializeToString(this, buf, isHtml, nodeFilter, visibleNamespaces); //console.log('###',this.nodeType,uri,prefix,buf.join(''))

  return buf.join('');
}

function needNamespaceDefine(node, isHTML, visibleNamespaces) {
  var prefix = node.prefix || '';
  var uri = node.namespaceURI;

  if (!prefix && !uri) {
    return false;
  }

  if (prefix === "xml" && uri === "http://www.w3.org/XML/1998/namespace" || uri == 'http://www.w3.org/2000/xmlns/') {
    return false;
  }

  var i = visibleNamespaces.length; //console.log('@@@@',node.tagName,prefix,uri,visibleNamespaces)

  while (i--) {
    var ns = visibleNamespaces[i]; // get namespace prefix
    //console.log(node.nodeType,node.tagName,ns.prefix,prefix)

    if (ns.prefix == prefix) {
      return ns.namespace != uri;
    }
  } //console.log(isHTML,uri,prefix=='')
  //if(isHTML && prefix ==null && uri == 'http://www.w3.org/1999/xhtml'){
  //	return false;
  //}
  //node.flag = '11111'
  //console.error(3,true,node.flag,node.prefix,node.namespaceURI)


  return true;
}

function serializeToString(node, buf, isHTML, nodeFilter, visibleNamespaces) {
  if (nodeFilter) {
    node = nodeFilter(node);

    if (node) {
      if (typeof node == 'string') {
        buf.push(node);
        return;
      }
    } else {
      return;
    } //buf.sort.apply(attrs, attributeSorter);

  }

  switch (node.nodeType) {
    case ELEMENT_NODE:
      if (!visibleNamespaces) visibleNamespaces = [];
      var startVisibleNamespaces = visibleNamespaces.length;
      var attrs = node.attributes;
      var len = attrs.length;
      var child = node.firstChild;
      var nodeName = node.tagName;
      isHTML = htmlns === node.namespaceURI || isHTML;
      buf.push('<', nodeName);

      for (var i = 0; i < len; i++) {
        // add namespaces for attributes
        var attr = attrs.item(i);

        if (attr.prefix == 'xmlns') {
          visibleNamespaces.push({
            prefix: attr.localName,
            namespace: attr.value
          });
        } else if (attr.nodeName == 'xmlns') {
          visibleNamespaces.push({
            prefix: '',
            namespace: attr.value
          });
        }
      }

      for (var i = 0; i < len; i++) {
        var attr = attrs.item(i);

        if (needNamespaceDefine(attr, isHTML, visibleNamespaces)) {
          var prefix = attr.prefix || '';
          var uri = attr.namespaceURI;
          var ns = prefix ? ' xmlns:' + prefix : " xmlns";
          buf.push(ns, '="', uri, '"');
          visibleNamespaces.push({
            prefix: prefix,
            namespace: uri
          });
        }

        serializeToString(attr, buf, isHTML, nodeFilter, visibleNamespaces);
      } // add namespace for current node		


      if (needNamespaceDefine(node, isHTML, visibleNamespaces)) {
        var prefix = node.prefix || '';
        var uri = node.namespaceURI;
        var ns = prefix ? ' xmlns:' + prefix : " xmlns";
        buf.push(ns, '="', uri, '"');
        visibleNamespaces.push({
          prefix: prefix,
          namespace: uri
        });
      }

      if (child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)) {
        buf.push('>'); //if is cdata child node

        if (isHTML && /^script$/i.test(nodeName)) {
          while (child) {
            if (child.data) {
              buf.push(child.data);
            } else {
              serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces);
            }

            child = child.nextSibling;
          }
        } else {
          while (child) {
            serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces);
            child = child.nextSibling;
          }
        }

        buf.push('</', nodeName, '>');
      } else {
        buf.push('/>');
      } // remove added visible namespaces
      //visibleNamespaces.length = startVisibleNamespaces;


      return;

    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      var child = node.firstChild;

      while (child) {
        serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces);
        child = child.nextSibling;
      }

      return;

    case ATTRIBUTE_NODE:
      return buf.push(' ', node.name, '="', node.value.replace(/[<&"]/g, _xmlEncoder), '"');

    case TEXT_NODE:
      return buf.push(node.data.replace(/[<&]/g, _xmlEncoder));

    case CDATA_SECTION_NODE:
      return buf.push('<![CDATA[', node.data, ']]>');

    case COMMENT_NODE:
      return buf.push("<!--", node.data, "-->");

    case DOCUMENT_TYPE_NODE:
      var pubid = node.publicId;
      var sysid = node.systemId;
      buf.push('<!DOCTYPE ', node.name);

      if (pubid) {
        buf.push(' PUBLIC "', pubid);

        if (sysid && sysid != '.') {
          buf.push('" "', sysid);
        }

        buf.push('">');
      } else if (sysid && sysid != '.') {
        buf.push(' SYSTEM "', sysid, '">');
      } else {
        var sub = node.internalSubset;

        if (sub) {
          buf.push(" [", sub, "]");
        }

        buf.push(">");
      }

      return;

    case PROCESSING_INSTRUCTION_NODE:
      return buf.push("<?", node.target, " ", node.data, "?>");

    case ENTITY_REFERENCE_NODE:
      return buf.push('&', node.nodeName, ';');
    //case ENTITY_NODE:
    //case NOTATION_NODE:

    default:
      buf.push('??', node.nodeName);
  }
}

function _importNode(doc, node, deep) {
  var node2;

  switch (node.nodeType) {
    case ELEMENT_NODE:
      node2 = node.cloneNode(false);
      node2.ownerDocument = doc;
    //var attrs = node2.attributes;
    //var len = attrs.length;
    //for(var i=0;i<len;i++){
    //node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
    //}

    case DOCUMENT_FRAGMENT_NODE:
      break;

    case ATTRIBUTE_NODE:
      deep = true;
      break;
    //case ENTITY_REFERENCE_NODE:
    //case PROCESSING_INSTRUCTION_NODE:
    ////case TEXT_NODE:
    //case CDATA_SECTION_NODE:
    //case COMMENT_NODE:
    //	deep = false;
    //	break;
    //case DOCUMENT_NODE:
    //case DOCUMENT_TYPE_NODE:
    //cannot be imported.
    //case ENTITY_NODE:
    //case NOTATION_NODE：
    //can not hit in level3
    //default:throw e;
  }

  if (!node2) {
    node2 = node.cloneNode(false); //false
  }

  node2.ownerDocument = doc;
  node2.parentNode = null;

  if (deep) {
    var child = node.firstChild;

    while (child) {
      node2.appendChild(_importNode(doc, child, deep));
      child = child.nextSibling;
    }
  }

  return node2;
} //
//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};


function _cloneNode(doc, node, deep) {
  var node2 = new node.constructor();

  for (var n in node) {
    var v = node[n];

    if (_typeof(v) != 'object') {
      if (v != node2[n]) {
        node2[n] = v;
      }
    }
  }

  if (node.childNodes) {
    node2.childNodes = new NodeList();
  }

  node2.ownerDocument = doc;

  switch (node2.nodeType) {
    case ELEMENT_NODE:
      var attrs = node.attributes;
      var attrs2 = node2.attributes = new NamedNodeMap();
      var len = attrs.length;
      attrs2._ownerElement = node2;

      for (var i = 0; i < len; i++) {
        node2.setAttributeNode(_cloneNode(doc, attrs.item(i), true));
      }

      break;
      ;

    case ATTRIBUTE_NODE:
      deep = true;
  }

  if (deep) {
    var child = node.firstChild;

    while (child) {
      node2.appendChild(_cloneNode(doc, child, deep));
      child = child.nextSibling;
    }
  }

  return node2;
}

function __set__(object, key, value) {
  object[key] = value;
} //do dynamic


try {
  if (Object.defineProperty) {
    var getTextContent = function getTextContent(node) {
      switch (node.nodeType) {
        case ELEMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE:
          var buf = [];
          node = node.firstChild;

          while (node) {
            if (node.nodeType !== 7 && node.nodeType !== 8) {
              buf.push(getTextContent(node));
            }

            node = node.nextSibling;
          }

          return buf.join('');

        default:
          return node.nodeValue;
      }
    };

    Object.defineProperty(LiveNodeList.prototype, 'length', {
      get: function get() {
        _updateLiveList(this);

        return this.$$length;
      }
    });
    Object.defineProperty(Node.prototype, 'textContent', {
      get: function get() {
        return getTextContent(this);
      },
      set: function set(data) {
        switch (this.nodeType) {
          case ELEMENT_NODE:
          case DOCUMENT_FRAGMENT_NODE:
            while (this.firstChild) {
              this.removeChild(this.firstChild);
            }

            if (data || String(data)) {
              this.appendChild(this.ownerDocument.createTextNode(data));
            }

            break;

          default:
            //TODO:
            this.data = data;
            this.value = data;
            this.nodeValue = data;
        }
      }
    });

    __set__ = function __set__(object, key, value) {
      //console.log(value)
      object['$$' + key] = value;
    };
  }
} catch (e) {//ie8
} //if(typeof require == 'function'){


exports.DOMImplementation = DOMImplementation;
exports.XMLSerializer = XMLSerializer; //}

},{}],20:[function(require,module,exports){
"use strict";

exports.entityMap = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
  Agrave: "À",
  Aacute: "Á",
  Acirc: "Â",
  Atilde: "Ã",
  Auml: "Ä",
  Aring: "Å",
  AElig: "Æ",
  Ccedil: "Ç",
  Egrave: "È",
  Eacute: "É",
  Ecirc: "Ê",
  Euml: "Ë",
  Igrave: "Ì",
  Iacute: "Í",
  Icirc: "Î",
  Iuml: "Ï",
  ETH: "Ð",
  Ntilde: "Ñ",
  Ograve: "Ò",
  Oacute: "Ó",
  Ocirc: "Ô",
  Otilde: "Õ",
  Ouml: "Ö",
  Oslash: "Ø",
  Ugrave: "Ù",
  Uacute: "Ú",
  Ucirc: "Û",
  Uuml: "Ü",
  Yacute: "Ý",
  THORN: "Þ",
  szlig: "ß",
  agrave: "à",
  aacute: "á",
  acirc: "â",
  atilde: "ã",
  auml: "ä",
  aring: "å",
  aelig: "æ",
  ccedil: "ç",
  egrave: "è",
  eacute: "é",
  ecirc: "ê",
  euml: "ë",
  igrave: "ì",
  iacute: "í",
  icirc: "î",
  iuml: "ï",
  eth: "ð",
  ntilde: "ñ",
  ograve: "ò",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  ouml: "ö",
  oslash: "ø",
  ugrave: "ù",
  uacute: "ú",
  ucirc: "û",
  uuml: "ü",
  yacute: "ý",
  thorn: "þ",
  yuml: "ÿ",
  nbsp: " ",
  iexcl: "¡",
  cent: "¢",
  pound: "£",
  curren: "¤",
  yen: "¥",
  brvbar: "¦",
  sect: "§",
  uml: "¨",
  copy: "©",
  ordf: "ª",
  laquo: "«",
  not: "¬",
  shy: "­­",
  reg: "®",
  macr: "¯",
  deg: "°",
  plusmn: "±",
  sup2: "²",
  sup3: "³",
  acute: "´",
  micro: "µ",
  para: "¶",
  middot: "·",
  cedil: "¸",
  sup1: "¹",
  ordm: "º",
  raquo: "»",
  frac14: "¼",
  frac12: "½",
  frac34: "¾",
  iquest: "¿",
  times: "×",
  divide: "÷",
  forall: "∀",
  part: "∂",
  exist: "∃",
  empty: "∅",
  nabla: "∇",
  isin: "∈",
  notin: "∉",
  ni: "∋",
  prod: "∏",
  sum: "∑",
  minus: "−",
  lowast: "∗",
  radic: "√",
  prop: "∝",
  infin: "∞",
  ang: "∠",
  and: "∧",
  or: "∨",
  cap: "∩",
  cup: "∪",
  'int': "∫",
  there4: "∴",
  sim: "∼",
  cong: "≅",
  asymp: "≈",
  ne: "≠",
  equiv: "≡",
  le: "≤",
  ge: "≥",
  sub: "⊂",
  sup: "⊃",
  nsub: "⊄",
  sube: "⊆",
  supe: "⊇",
  oplus: "⊕",
  otimes: "⊗",
  perp: "⊥",
  sdot: "⋅",
  Alpha: "Α",
  Beta: "Β",
  Gamma: "Γ",
  Delta: "Δ",
  Epsilon: "Ε",
  Zeta: "Ζ",
  Eta: "Η",
  Theta: "Θ",
  Iota: "Ι",
  Kappa: "Κ",
  Lambda: "Λ",
  Mu: "Μ",
  Nu: "Ν",
  Xi: "Ξ",
  Omicron: "Ο",
  Pi: "Π",
  Rho: "Ρ",
  Sigma: "Σ",
  Tau: "Τ",
  Upsilon: "Υ",
  Phi: "Φ",
  Chi: "Χ",
  Psi: "Ψ",
  Omega: "Ω",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  omicron: "ο",
  pi: "π",
  rho: "ρ",
  sigmaf: "ς",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  thetasym: "ϑ",
  upsih: "ϒ",
  piv: "ϖ",
  OElig: "Œ",
  oelig: "œ",
  Scaron: "Š",
  scaron: "š",
  Yuml: "Ÿ",
  fnof: "ƒ",
  circ: "ˆ",
  tilde: "˜",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
  zwnj: "‌",
  zwj: "‍",
  lrm: "‎",
  rlm: "‏",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  dagger: "†",
  Dagger: "‡",
  bull: "•",
  hellip: "…",
  permil: "‰",
  prime: "′",
  Prime: "″",
  lsaquo: "‹",
  rsaquo: "›",
  oline: "‾",
  euro: "€",
  trade: "™",
  larr: "←",
  uarr: "↑",
  rarr: "→",
  darr: "↓",
  harr: "↔",
  crarr: "↵",
  lceil: "⌈",
  rceil: "⌉",
  lfloor: "⌊",
  rfloor: "⌋",
  loz: "◊",
  spades: "♠",
  clubs: "♣",
  hearts: "♥",
  diams: "♦"
}; //for(var  n in exports.entityMap){console.log(exports.entityMap[n].charCodeAt())}

},{}],21:[function(require,module,exports){
"use strict";

//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
//[5]   	Name	   ::=   	NameStartChar (NameChar)*
var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/; //\u10000-\uEFFFF

var nameChar = new RegExp("[\\-\\.0-9" + nameStartChar.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
var tagNamePattern = new RegExp('^' + nameStartChar.source + nameChar.source + '*(?:\:' + nameStartChar.source + nameChar.source + '*)?$'); //var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')
//S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
//S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE

var S_TAG = 0; //tag name offerring

var S_ATTR = 1; //attr name offerring 

var S_ATTR_SPACE = 2; //attr name end and space offer

var S_EQ = 3; //=space?

var S_ATTR_NOQUOT_VALUE = 4; //attr value(no quot value only)

var S_ATTR_END = 5; //attr value end and no space(quot end)

var S_TAG_SPACE = 6; //(attr value end || tag end ) && (space offer)

var S_TAG_CLOSE = 7; //closed el<el />

function XMLReader() {}

XMLReader.prototype = {
  parse: function parse(source, defaultNSMap, entityMap) {
    var domBuilder = this.domBuilder;
    domBuilder.startDocument();

    _copy(defaultNSMap, defaultNSMap = {});

    _parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);

    domBuilder.endDocument();
  }
};

function _parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
  function fixedFromCharCode(code) {
    // String.prototype.fromCharCode does not supports
    // > 2 bytes unicode chars directly
    if (code > 0xffff) {
      code -= 0x10000;
      var surrogate1 = 0xd800 + (code >> 10),
          surrogate2 = 0xdc00 + (code & 0x3ff);
      return String.fromCharCode(surrogate1, surrogate2);
    } else {
      return String.fromCharCode(code);
    }
  }

  function entityReplacer(a) {
    var k = a.slice(1, -1);

    if (k in entityMap) {
      return entityMap[k];
    } else if (k.charAt(0) === '#') {
      return fixedFromCharCode(parseInt(k.substr(1).replace('x', '0x')));
    } else {
      errorHandler.error('entity not found:' + a);
      return a;
    }
  }

  function appendText(end) {
    //has some bugs
    if (end > start) {
      var xt = source.substring(start, end).replace(/&#?\w+;/g, entityReplacer);
      locator && position(start);
      domBuilder.characters(xt, 0, end - start);
      start = end;
    }
  }

  function position(p, m) {
    while (p >= lineEnd && (m = linePattern.exec(source))) {
      lineStart = m.index;
      lineEnd = lineStart + m[0].length;
      locator.lineNumber++; //console.log('line++:',locator,startPos,endPos)
    }

    locator.columnNumber = p - lineStart + 1;
  }

  var lineStart = 0;
  var lineEnd = 0;
  var linePattern = /.*(?:\r\n?|\n)|.*$/g;
  var locator = domBuilder.locator;
  var parseStack = [{
    currentNSMap: defaultNSMapCopy
  }];
  var closeMap = {};
  var start = 0;

  while (true) {
    try {
      var tagStart = source.indexOf('<', start);

      if (tagStart < 0) {
        if (!source.substr(start).match(/^\s*$/)) {
          var doc = domBuilder.doc;
          var text = doc.createTextNode(source.substr(start));
          doc.appendChild(text);
          domBuilder.currentElement = text;
        }

        return;
      }

      if (tagStart > start) {
        appendText(tagStart);
      }

      switch (source.charAt(tagStart + 1)) {
        case '/':
          var end = source.indexOf('>', tagStart + 3);
          var tagName = source.substring(tagStart + 2, end);
          var config = parseStack.pop();

          if (end < 0) {
            tagName = source.substring(tagStart + 2).replace(/[\s<].*/, ''); //console.error('#@@@@@@'+tagName)

            errorHandler.error("end tag name: " + tagName + ' is not complete:' + config.tagName);
            end = tagStart + 1 + tagName.length;
          } else if (tagName.match(/\s</)) {
            tagName = tagName.replace(/[\s<].*/, '');
            errorHandler.error("end tag name: " + tagName + ' maybe not complete');
            end = tagStart + 1 + tagName.length;
          } //console.error(parseStack.length,parseStack)
          //console.error(config);


          var localNSMap = config.localNSMap;
          var endMatch = config.tagName == tagName;
          var endIgnoreCaseMach = endMatch || config.tagName && config.tagName.toLowerCase() == tagName.toLowerCase();

          if (endIgnoreCaseMach) {
            domBuilder.endElement(config.uri, config.localName, tagName);

            if (localNSMap) {
              for (var prefix in localNSMap) {
                domBuilder.endPrefixMapping(prefix);
              }
            }

            if (!endMatch) {
              errorHandler.fatalError("end tag name: " + tagName + ' is not match the current start tagName:' + config.tagName);
            }
          } else {
            parseStack.push(config);
          }

          end++;
          break;
        // end elment

        case '?':
          // <?...?>
          locator && position(tagStart);
          end = parseInstruction(source, tagStart, domBuilder);
          break;

        case '!':
          // <!doctype,<![CDATA,<!--
          locator && position(tagStart);
          end = parseDCC(source, tagStart, domBuilder, errorHandler);
          break;

        default:
          locator && position(tagStart);
          var el = new ElementAttributes();
          var currentNSMap = parseStack[parseStack.length - 1].currentNSMap; //elStartEnd

          var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler);
          var len = el.length;

          if (!el.closed && fixSelfClosed(source, end, el.tagName, closeMap)) {
            el.closed = true;

            if (!entityMap.nbsp) {
              errorHandler.warning('unclosed xml attribute');
            }
          }

          if (locator && len) {
            var locator2 = copyLocator(locator, {}); //try{//attribute position fixed

            for (var i = 0; i < len; i++) {
              var a = el[i];
              position(a.offset);
              a.locator = copyLocator(locator, {});
            } //}catch(e){console.error('@@@@@'+e)}


            domBuilder.locator = locator2;

            if (appendElement(el, domBuilder, currentNSMap)) {
              parseStack.push(el);
            }

            domBuilder.locator = locator;
          } else {
            if (appendElement(el, domBuilder, currentNSMap)) {
              parseStack.push(el);
            }
          }

          if (el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed) {
            end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
          } else {
            end++;
          }

      }
    } catch (e) {
      errorHandler.error('element parse error: ' + e); //errorHandler.error('element parse error: '+e);

      end = -1; //throw e;
    }

    if (end > start) {
      start = end;
    } else {
      //TODO: 这里有可能sax回退，有位置错误风险
      appendText(Math.max(tagStart, start) + 1);
    }
  }
}

function copyLocator(f, t) {
  t.lineNumber = f.lineNumber;
  t.columnNumber = f.columnNumber;
  return t;
}
/**
 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
 */


function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler) {
  var attrName;
  var value;
  var p = ++start;
  var s = S_TAG; //status

  while (true) {
    var c = source.charAt(p);

    switch (c) {
      case '=':
        if (s === S_ATTR) {
          //attrName
          attrName = source.slice(start, p);
          s = S_EQ;
        } else if (s === S_ATTR_SPACE) {
          s = S_EQ;
        } else {
          //fatalError: equal must after attrName or space after attrName
          throw new Error('attribute equal must after attrName');
        }

        break;

      case '\'':
      case '"':
        if (s === S_EQ || s === S_ATTR //|| s == S_ATTR_SPACE
        ) {
          //equal
          if (s === S_ATTR) {
            errorHandler.warning('attribute value must after "="');
            attrName = source.slice(start, p);
          }

          start = p + 1;
          p = source.indexOf(c, start);

          if (p > 0) {
            value = source.slice(start, p).replace(/&#?\w+;/g, entityReplacer);
            el.add(attrName, value, start - 1);
            s = S_ATTR_END;
          } else {
            //fatalError: no end quot match
            throw new Error('attribute value no end \'' + c + '\' match');
          }
        } else if (s == S_ATTR_NOQUOT_VALUE) {
          value = source.slice(start, p).replace(/&#?\w+;/g, entityReplacer); //console.log(attrName,value,start,p)

          el.add(attrName, value, start); //console.dir(el)

          errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ')!!');
          start = p + 1;
          s = S_ATTR_END;
        } else {
          //fatalError: no equal before
          throw new Error('attribute value must after "="');
        }

        break;

      case '/':
        switch (s) {
          case S_TAG:
            el.setTagName(source.slice(start, p));

          case S_ATTR_END:
          case S_TAG_SPACE:
          case S_TAG_CLOSE:
            s = S_TAG_CLOSE;
            el.closed = true;

          case S_ATTR_NOQUOT_VALUE:
          case S_ATTR:
          case S_ATTR_SPACE:
            break;
          //case S_EQ:

          default:
            throw new Error("attribute invalid close char('/')");
        }

        break;

      case '':
        //end document
        //throw new Error('unexpected end of input')
        errorHandler.error('unexpected end of input');

        if (s == S_TAG) {
          el.setTagName(source.slice(start, p));
        }

        return p;

      case '>':
        switch (s) {
          case S_TAG:
            el.setTagName(source.slice(start, p));

          case S_ATTR_END:
          case S_TAG_SPACE:
          case S_TAG_CLOSE:
            break;
          //normal

          case S_ATTR_NOQUOT_VALUE: //Compatible state

          case S_ATTR:
            value = source.slice(start, p);

            if (value.slice(-1) === '/') {
              el.closed = true;
              value = value.slice(0, -1);
            }

          case S_ATTR_SPACE:
            if (s === S_ATTR_SPACE) {
              value = attrName;
            }

            if (s == S_ATTR_NOQUOT_VALUE) {
              errorHandler.warning('attribute "' + value + '" missed quot(")!!');
              el.add(attrName, value.replace(/&#?\w+;/g, entityReplacer), start);
            } else {
              if (currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !value.match(/^(?:disabled|checked|selected)$/i)) {
                errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
              }

              el.add(value, value, start);
            }

            break;

          case S_EQ:
            throw new Error('attribute value missed!!');
        } //			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))


        return p;

      /*xml space '\x20' | #x9 | #xD | #xA; */

      case "\x80":
        c = ' ';

      default:
        if (c <= ' ') {
          //space
          switch (s) {
            case S_TAG:
              el.setTagName(source.slice(start, p)); //tagName

              s = S_TAG_SPACE;
              break;

            case S_ATTR:
              attrName = source.slice(start, p);
              s = S_ATTR_SPACE;
              break;

            case S_ATTR_NOQUOT_VALUE:
              var value = source.slice(start, p).replace(/&#?\w+;/g, entityReplacer);
              errorHandler.warning('attribute "' + value + '" missed quot(")!!');
              el.add(attrName, value, start);

            case S_ATTR_END:
              s = S_TAG_SPACE;
              break;
            //case S_TAG_SPACE:
            //case S_EQ:
            //case S_ATTR_SPACE:
            //	void();break;
            //case S_TAG_CLOSE:
            //ignore warning
          }
        } else {
          //not space
          //S_TAG,	S_ATTR,	S_EQ,	S_ATTR_NOQUOT_VALUE
          //S_ATTR_SPACE,	S_ATTR_END,	S_TAG_SPACE, S_TAG_CLOSE
          switch (s) {
            //case S_TAG:void();break;
            //case S_ATTR:void();break;
            //case S_ATTR_NOQUOT_VALUE:void();break;
            case S_ATTR_SPACE:
              var tagName = el.tagName;

              if (currentNSMap[''] !== 'http://www.w3.org/1999/xhtml' || !attrName.match(/^(?:disabled|checked|selected)$/i)) {
                errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
              }

              el.add(attrName, attrName, start);
              start = p;
              s = S_ATTR;
              break;

            case S_ATTR_END:
              errorHandler.warning('attribute space is required"' + attrName + '"!!');

            case S_TAG_SPACE:
              s = S_ATTR;
              start = p;
              break;

            case S_EQ:
              s = S_ATTR_NOQUOT_VALUE;
              start = p;
              break;

            case S_TAG_CLOSE:
              throw new Error("elements closed character '/' and '>' must be connected to");
          }
        }

    } //end outer switch
    //console.log('p++',p)


    p++;
  }
}
/**
 * @return true if has new namespace define
 */


function appendElement(el, domBuilder, currentNSMap) {
  var tagName = el.tagName;
  var localNSMap = null; //var currentNSMap = parseStack[parseStack.length-1].currentNSMap;

  var i = el.length;

  while (i--) {
    var a = el[i];
    var qName = a.qName;
    var value = a.value;
    var nsp = qName.indexOf(':');

    if (nsp > 0) {
      var prefix = a.prefix = qName.slice(0, nsp);
      var localName = qName.slice(nsp + 1);
      var nsPrefix = prefix === 'xmlns' && localName;
    } else {
      localName = qName;
      prefix = null;
      nsPrefix = qName === 'xmlns' && '';
    } //can not set prefix,because prefix !== ''


    a.localName = localName; //prefix == null for no ns prefix attribute 

    if (nsPrefix !== false) {
      //hack!!
      if (localNSMap == null) {
        localNSMap = {}; //console.log(currentNSMap,0)

        _copy(currentNSMap, currentNSMap = {}); //console.log(currentNSMap,1)

      }

      currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
      a.uri = 'http://www.w3.org/2000/xmlns/';
      domBuilder.startPrefixMapping(nsPrefix, value);
    }
  }

  var i = el.length;

  while (i--) {
    a = el[i];
    var prefix = a.prefix;

    if (prefix) {
      //no prefix attribute has no namespace
      if (prefix === 'xml') {
        a.uri = 'http://www.w3.org/XML/1998/namespace';
      }

      if (prefix !== 'xmlns') {
        a.uri = currentNSMap[prefix || '']; //{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
      }
    }
  }

  var nsp = tagName.indexOf(':');

  if (nsp > 0) {
    prefix = el.prefix = tagName.slice(0, nsp);
    localName = el.localName = tagName.slice(nsp + 1);
  } else {
    prefix = null; //important!!

    localName = el.localName = tagName;
  } //no prefix element has default namespace


  var ns = el.uri = currentNSMap[prefix || ''];
  domBuilder.startElement(ns, localName, tagName, el); //endPrefixMapping and startPrefixMapping have not any help for dom builder
  //localNSMap = null

  if (el.closed) {
    domBuilder.endElement(ns, localName, tagName);

    if (localNSMap) {
      for (prefix in localNSMap) {
        domBuilder.endPrefixMapping(prefix);
      }
    }
  } else {
    el.currentNSMap = currentNSMap;
    el.localNSMap = localNSMap; //parseStack.push(el);

    return true;
  }
}

function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
  if (/^(?:script|textarea)$/i.test(tagName)) {
    var elEndStart = source.indexOf('</' + tagName + '>', elStartEnd);
    var text = source.substring(elStartEnd + 1, elEndStart);

    if (/[&<]/.test(text)) {
      if (/^script$/i.test(tagName)) {
        //if(!/\]\]>/.test(text)){
        //lexHandler.startCDATA();
        domBuilder.characters(text, 0, text.length); //lexHandler.endCDATA();

        return elEndStart; //}
      } //}else{//text area


      text = text.replace(/&#?\w+;/g, entityReplacer);
      domBuilder.characters(text, 0, text.length);
      return elEndStart; //}
    }
  }

  return elStartEnd + 1;
}

function fixSelfClosed(source, elStartEnd, tagName, closeMap) {
  //if(tagName in closeMap){
  var pos = closeMap[tagName];

  if (pos == null) {
    //console.log(tagName)
    pos = source.lastIndexOf('</' + tagName + '>');

    if (pos < elStartEnd) {
      //忘记闭合
      pos = source.lastIndexOf('</' + tagName);
    }

    closeMap[tagName] = pos;
  }

  return pos < elStartEnd; //} 
}

function _copy(source, target) {
  for (var n in source) {
    target[n] = source[n];
  }
}

function parseDCC(source, start, domBuilder, errorHandler) {
  //sure start with '<!'
  var next = source.charAt(start + 2);

  switch (next) {
    case '-':
      if (source.charAt(start + 3) === '-') {
        var end = source.indexOf('-->', start + 4); //append comment source.substring(4,end)//<!--

        if (end > start) {
          domBuilder.comment(source, start + 4, end - start - 4);
          return end + 3;
        } else {
          errorHandler.error("Unclosed comment");
          return -1;
        }
      } else {
        //error
        return -1;
      }

    default:
      if (source.substr(start + 3, 6) == 'CDATA[') {
        var end = source.indexOf(']]>', start + 9);
        domBuilder.startCDATA();
        domBuilder.characters(source, start + 9, end - start - 9);
        domBuilder.endCDATA();
        return end + 3;
      } //<!DOCTYPE
      //startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId) 


      var matchs = split(source, start);
      var len = matchs.length;

      if (len > 1 && /!doctype/i.test(matchs[0][0])) {
        var name = matchs[1][0];
        var pubid = len > 3 && /^public$/i.test(matchs[2][0]) && matchs[3][0];
        var sysid = len > 4 && matchs[4][0];
        var lastMatch = matchs[len - 1];
        domBuilder.startDTD(name, pubid && pubid.replace(/^(['"])(.*?)\1$/, '$2'), sysid && sysid.replace(/^(['"])(.*?)\1$/, '$2'));
        domBuilder.endDTD();
        return lastMatch.index + lastMatch[0].length;
      }

  }

  return -1;
}

function parseInstruction(source, start, domBuilder) {
  var end = source.indexOf('?>', start);

  if (end) {
    var match = source.substring(start, end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);

    if (match) {
      var len = match[0].length;
      domBuilder.processingInstruction(match[1], match[2]);
      return end + 2;
    } else {
      //error
      return -1;
    }
  }

  return -1;
}
/**
 * @param source
 */


function ElementAttributes(source) {}

ElementAttributes.prototype = {
  setTagName: function setTagName(tagName) {
    if (!tagNamePattern.test(tagName)) {
      throw new Error('invalid tagName:' + tagName);
    }

    this.tagName = tagName;
  },
  add: function add(qName, value, offset) {
    if (!tagNamePattern.test(qName)) {
      throw new Error('invalid attribute:' + qName);
    }

    this[this.length++] = {
      qName: qName,
      value: value,
      offset: offset
    };
  },
  length: 0,
  getLocalName: function getLocalName(i) {
    return this[i].localName;
  },
  getLocator: function getLocator(i) {
    return this[i].locator;
  },
  getQName: function getQName(i) {
    return this[i].qName;
  },
  getURI: function getURI(i) {
    return this[i].uri;
  },
  getValue: function getValue(i) {
    return this[i].value;
  } //	,getIndex:function(uri, localName)){
  //		if(localName){
  //			
  //		}else{
  //			var qName = uri
  //		}
  //	},
  //	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
  //	getType:function(uri,localName){}
  //	getType:function(i){},

};

function split(source, start) {
  var match;
  var buf = [];
  var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
  reg.lastIndex = start;
  reg.exec(source); //skip <

  while (match = reg.exec(source)) {
    buf.push(match);
    if (match[1]) return buf;
  }
}

exports.XMLReader = XMLReader;

},{}],22:[function(require,module,exports){
"use strict";

var _global = window;
var adapter = _global.__globalAdapter = _global.__globalAdapter || {};
Object.assign(adapter, {
  init: function init() {
    require('./wrapper/builtin');

    _global.DOMParser = require('../../common/xmldom/dom-parser').DOMParser;

    require('./wrapper/unify');

    require('./wrapper/fs-utils');

    require('../../common/engine/globalAdapter');

    require('./wrapper/systemInfo');
  },
  adaptEngine: function adaptEngine() {
    require('../../common/engine');

    require('./wrapper/engine');
  }
});

},{"../../common/engine":15,"../../common/engine/globalAdapter":14,"../../common/xmldom/dom-parser":18,"./wrapper/builtin":40,"./wrapper/engine":54,"./wrapper/fs-utils":55,"./wrapper/systemInfo":56,"./wrapper/unify":57}],23:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLAudioElement2 = _interopRequireDefault(require("./HTMLAudioElement"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get.bind(); } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var HAVE_NOTHING = 0;
var HAVE_METADATA = 1;
var HAVE_CURRENT_DATA = 2;
var HAVE_FUTURE_DATA = 3;
var HAVE_ENOUGH_DATA = 4;
var SN_SEED = 1;
var _innerAudioContextMap = {};

var Audio = /*#__PURE__*/function (_HTMLAudioElement) {
  _inherits(Audio, _HTMLAudioElement);

  var _super = _createSuper(Audio);

  function Audio(url) {
    var _this;

    _classCallCheck(this, Audio);

    _this = _super.call(this);
    _this._$sn = SN_SEED++;
    _this.HAVE_NOTHING = HAVE_NOTHING;
    _this.HAVE_METADATA = HAVE_METADATA;
    _this.HAVE_CURRENT_DATA = HAVE_CURRENT_DATA;
    _this.HAVE_FUTURE_DATA = HAVE_FUTURE_DATA;
    _this.HAVE_ENOUGH_DATA = HAVE_ENOUGH_DATA;
    _this.readyState = HAVE_NOTHING;
    var innerAudioContext = my.createInnerAudioContext();
    _innerAudioContextMap[_this._$sn] = innerAudioContext;
    _this._canplayEvents = ['load', 'loadend', 'canplay', 'canplaythrough', 'loadedmetadata'];
    innerAudioContext.onCanplay(function () {
      _this._loaded = true;
      _this.readyState = _this.HAVE_CURRENT_DATA;

      _this._canplayEvents.forEach(function (type) {
        _this.dispatchEvent({
          type: type
        });
      });
    });
    innerAudioContext.onPlay(function () {
      _this._paused = _innerAudioContextMap[_this._$sn].paused;

      _this.dispatchEvent({
        type: 'play'
      });
    });
    innerAudioContext.onPause(function () {
      _this._paused = _innerAudioContextMap[_this._$sn].paused;

      _this.dispatchEvent({
        type: 'pause'
      });
    });
    innerAudioContext.onEnded(function () {
      _this._paused = _innerAudioContextMap[_this._$sn].paused;

      if (_innerAudioContextMap[_this._$sn].loop === false) {
        _this.dispatchEvent({
          type: 'ended'
        });
      }

      _this.readyState = HAVE_ENOUGH_DATA;
    });
    innerAudioContext.onError(function () {
      _this._paused = _innerAudioContextMap[_this._$sn].paused;

      _this.dispatchEvent({
        type: 'error'
      });
    });

    if (url) {
      _this.src = url;
    } else {
      _this._src = '';
    }

    _this._loop = innerAudioContext.loop;
    _this._autoplay = innerAudioContext.autoplay;
    _this._paused = innerAudioContext.paused;
    _this._volume = innerAudioContext.volume;
    _this._muted = false;
    return _this;
  }

  _createClass(Audio, [{
    key: "addEventListener",
    value: function addEventListener(type, listener) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      _get(_getPrototypeOf(Audio.prototype), "addEventListener", this).call(this, type, listener, options);

      type = String(type).toLowerCase();

      if (this._loaded && this._canplayEvents.indexOf(type) !== -1) {
        this.dispatchEvent({
          type: type
        });
      }
    }
  }, {
    key: "load",
    value: function load() {// console.warn('HTMLAudioElement.load() is not implemented.')
      // weixin doesn't need call load() manually
    }
  }, {
    key: "play",
    value: function play() {
      _innerAudioContextMap[this._$sn].play();
    }
  }, {
    key: "resume",
    value: function resume() {
      _innerAudioContextMap[this._$sn].resume();
    }
  }, {
    key: "pause",
    value: function pause() {
      _innerAudioContextMap[this._$sn].pause();
    }
  }, {
    key: "stop",
    value: function stop() {
      _innerAudioContextMap[this._$sn].stop();
    }
  }, {
    key: "destroy",
    value: function destroy() {
      _innerAudioContextMap[this._$sn].destroy();
    }
  }, {
    key: "canPlayType",
    value: function canPlayType() {
      var mediaType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      if (typeof mediaType !== 'string') {
        return '';
      }

      if (mediaType.indexOf('audio/mpeg') > -1 || mediaType.indexOf('audio/mp4')) {
        return 'probably';
      }

      return '';
    }
  }, {
    key: "currentTime",
    get: function get() {
      return _innerAudioContextMap[this._$sn].currentTime;
    },
    set: function set(value) {
      _innerAudioContextMap[this._$sn].seek(value);
    }
  }, {
    key: "duration",
    get: function get() {
      return _innerAudioContextMap[this._$sn].duration;
    }
  }, {
    key: "src",
    get: function get() {
      return this._src;
    },
    set: function set(value) {
      this._src = value;
      this._loaded = false;
      this.readyState = this.HAVE_NOTHING;
      var innerAudioContext = _innerAudioContextMap[this._$sn];
      innerAudioContext.src = value;
    }
  }, {
    key: "loop",
    get: function get() {
      return this._loop;
    },
    set: function set(value) {
      this._loop = value;
      _innerAudioContextMap[this._$sn].loop = value;
    }
  }, {
    key: "autoplay",
    get: function get() {
      return this.autoplay;
    },
    set: function set(value) {
      this._autoplay = value;
      _innerAudioContextMap[this._$sn].autoplay = value;
    }
  }, {
    key: "paused",
    get: function get() {
      return this._paused;
    }
  }, {
    key: "volume",
    get: function get() {
      return this._volume;
    },
    set: function set(value) {
      this._volume = value;

      if (!this._muted) {
        _innerAudioContextMap[this._$sn].volume = value;
      }
    }
  }, {
    key: "muted",
    get: function get() {
      return this._muted;
    },
    set: function set(value) {
      this._muted = value;

      if (value) {
        _innerAudioContextMap[this._$sn].volume = 0;
      } else {
        _innerAudioContextMap[this._$sn].volume = this._volume;
      }
    }
  }, {
    key: "cloneNode",
    value: function cloneNode() {
      var newAudio = new Audio();
      newAudio.loop = this.loop;
      newAudio.autoplay = this.autoplay;
      newAudio.src = this.src;
      return newAudio;
    }
  }]);

  return Audio;
}(_HTMLAudioElement2["default"]);

exports["default"] = Audio;
module.exports = exports["default"];

},{"./HTMLAudioElement":27}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _WindowProperties = require("./WindowProperties");

function Canvas() {}

var CanvasProxy = new Proxy(Canvas, {
  construct: function construct() {
    var canvas = my.createOffscreenCanvas();
    canvas.type = 'canvas'; // canvas.__proto__.__proto__.__proto__ = new HTMLCanvasElement()

    var _getContext = canvas.getContext;

    canvas.getBoundingClientRect = function () {
      var ret = {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
      return ret;
    };

    canvas.style = {
      top: '0px',
      left: '0px',
      width: _WindowProperties.innerWidth + 'px',
      height: _WindowProperties.innerHeight + 'px'
    };

    canvas.addEventListener = function (type, listener) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      // console.log('canvas.addEventListener', type);
      document.addEventListener(type, listener, options);
    };

    canvas.removeEventListener = function (type, listener) {
      // console.log('canvas.removeEventListener', type);
      document.removeEventListener(type, listener);
    };

    canvas.dispatchEvent = function () {
      var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      console.log('canvas.dispatchEvent', event.type, event); // nothing to do
    };

    Object.defineProperty(canvas, 'clientWidth', {
      enumerable: true,
      get: function get() {
        return _WindowProperties.innerWidth;
      }
    });
    Object.defineProperty(canvas, 'clientHeight', {
      enumerable: true,
      get: function get() {
        return _WindowProperties.innerHeight;
      }
    });
    return canvas;
  }
}); // NOTE: this is a hack operation
// let canvas = new window.Canvas()
// console.error(canvas instanceof window.Canvas)  => false

var _default = CanvasProxy;
exports["default"] = _default;
module.exports = exports["default"];

},{"./WindowProperties":36}],25:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Node2 = _interopRequireDefault(require("./Node"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var Element = /*#__PURE__*/function (_Node) {
  _inherits(Element, _Node);

  var _super = _createSuper(Element);

  function Element() {
    var _this;

    _classCallCheck(this, Element);

    _this = _super.call(this);
    _this.className = '';
    _this.children = [];
    return _this;
  }

  return _createClass(Element);
}(_Node2["default"]);

exports["default"] = Element;
module.exports = exports["default"];

},{"./Node":33}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var _events = new WeakMap();

var EventTarget = /*#__PURE__*/function () {
  function EventTarget() {
    _classCallCheck(this, EventTarget);

    _events.set(this, {});
  }

  _createClass(EventTarget, [{
    key: "addEventListener",
    value: function addEventListener(type, listener) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var events = _events.get(this);

      if (!events) {
        events = {};

        _events.set(this, events);
      }

      if (!events[type]) {
        events[type] = [];
      }

      events[type].push(listener);

      if (options.capture) {// console.warn('EventTarget.addEventListener: options.capture is not implemented.')
      }

      if (options.once) {// console.warn('EventTarget.addEventListener: options.once is not implemented.')
      }

      if (options.passive) {// console.warn('EventTarget.addEventListener: options.passive is not implemented.')
      }
    }
  }, {
    key: "removeEventListener",
    value: function removeEventListener(type, listener) {
      var events = _events.get(this);

      if (events) {
        var listeners = events[type];

        if (listeners && listeners.length > 0) {
          for (var i = listeners.length; i--; i > 0) {
            if (listeners[i] === listener) {
              listeners.splice(i, 1);
              break;
            }
          }
        }
      }
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent() {
      var event = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var listeners = _events.get(this)[event.type];

      if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
          listeners[i](event);
        }
      }
    }
  }]);

  return EventTarget;
}();

exports["default"] = EventTarget;
module.exports = exports["default"];

},{}],27:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var HTMLAudioElement = /*#__PURE__*/function (_HTMLElement) {
  _inherits(HTMLAudioElement, _HTMLElement);

  var _super = _createSuper(HTMLAudioElement);

  function HTMLAudioElement() {
    _classCallCheck(this, HTMLAudioElement);

    return _super.call(this, 'audio');
  }

  return _createClass(HTMLAudioElement);
}(_HTMLElement2["default"]);

exports["default"] = HTMLAudioElement;
module.exports = exports["default"];

},{"./HTMLElement":29}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var HTMLCanvasElement = my.createOffscreenCanvas().constructor;
var _default = HTMLCanvasElement;
exports["default"] = _default;
module.exports = exports["default"];

},{}],29:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _Element2 = _interopRequireDefault(require("./Element"));

var _index = require("./util/index.js");

var _WindowProperties = require("./WindowProperties");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var HTMLElement = /*#__PURE__*/function (_Element) {
  _inherits(HTMLElement, _Element);

  var _super = _createSuper(HTMLElement);

  function HTMLElement() {
    var _this;

    var tagName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    _classCallCheck(this, HTMLElement);

    _this = _super.call(this);
    _this.className = '';
    _this.childern = [];
    _this.style = {
      width: "".concat(_WindowProperties.innerWidth, "px"),
      height: "".concat(_WindowProperties.innerHeight, "px")
    };
    _this.insertBefore = _index.noop;
    _this.innerHTML = '';
    _this.tagName = tagName.toUpperCase();
    return _this;
  }

  _createClass(HTMLElement, [{
    key: "setAttribute",
    value: function setAttribute(name, value) {
      this[name] = value;
    }
  }, {
    key: "getAttribute",
    value: function getAttribute(name) {
      return this[name];
    }
  }, {
    key: "clientWidth",
    get: function get() {
      var ret = parseInt(this.style.fontSize, 10) * this.innerHTML.length;
      return Number.isNaN(ret) ? 0 : ret;
    }
  }, {
    key: "clientHeight",
    get: function get() {
      var ret = parseInt(this.style.fontSize, 10);
      return Number.isNaN(ret) ? 0 : ret;
    }
  }, {
    key: "getBoundingClientRect",
    value: function getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: _WindowProperties.innerWidth,
        height: _WindowProperties.innerHeight
      };
    }
  }, {
    key: "focus",
    value: function focus() {}
  }]);

  return HTMLElement;
}(_Element2["default"]);

exports["default"] = HTMLElement;
module.exports = exports["default"];

},{"./Element":25,"./WindowProperties":36,"./util/index.js":45}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var screencanvas = $global.screencanvas;
var HTMLImageElement = screencanvas.createImage().constructor;
var _default = HTMLImageElement;
exports["default"] = _default;
module.exports = exports["default"];

},{}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

// var screencanvas = $global.screencanvas;
function Image() {// empty constructor
} // NOTE: Proxy not supported on iOS 8 and 9.
// let ImageProxy = new Proxy(Image, {
//     construct (target, args) {
//         let img =  screencanvas.createImage();
//         if (!img.addEventListener) {
//             img.addEventListener = function (eventName, eventCB) {
//                 if (eventName === 'load') {
//                     img.onload = eventCB;
//                 } else if (eventName === 'error') {
//                     // img.onerror = eventCB;
//                 }
//             };
//         }
//         if (!img.removeEventListener) {
//           img.removeEventListener = function (eventName) {
//             if (eventName === 'load') {
//               img.onload = null;
//             } else if (eventName === 'error') {
//               // img.onerror = null;
//             }
//           };
//         }
//         return img;
//     },
// });
// NOTE: this is a hack operation
// let img = new window.Image()
// console.error(img instanceof window.Image)  => false
// export default ImageProxy;


var _default = Image;
exports["default"] = _default;
module.exports = exports["default"];

},{}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ImageBitmap = /*#__PURE__*/_createClass(function ImageBitmap() {// TODO

  _classCallCheck(this, ImageBitmap);
});

exports["default"] = ImageBitmap;
module.exports = exports["default"];

},{}],33:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _EventTarget2 = _interopRequireDefault(require("./EventTarget.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var Node = /*#__PURE__*/function (_EventTarget) {
  _inherits(Node, _EventTarget);

  var _super = _createSuper(Node);

  function Node() {
    var _this;

    _classCallCheck(this, Node);

    _this = _super.call(this);
    _this.childNodes = [];
    return _this;
  }

  _createClass(Node, [{
    key: "appendChild",
    value: function appendChild(node) {
      this.childNodes.push(node); // if (node instanceof Node) {
      //   this.childNodes.push(node)
      // } else {
      //   throw new TypeError('Failed to executed \'appendChild\' on \'Node\': parameter 1 is not of type \'Node\'.')
      // }
    }
  }, {
    key: "cloneNode",
    value: function cloneNode() {
      var copyNode = Object.create(this);
      Object.assign(copyNode, this);
      return copyNode;
    }
  }, {
    key: "removeChild",
    value: function removeChild(node) {
      var index = this.childNodes.findIndex(function (child) {
        return child === node;
      });

      if (index > -1) {
        return this.childNodes.splice(index, 1);
      }

      return null;
    }
  }]);

  return Node;
}(_EventTarget2["default"]);

exports["default"] = Node;
module.exports = exports["default"];

},{"./EventTarget.js":26}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebGLRenderingContext = /*#__PURE__*/_createClass(function WebGLRenderingContext() {// TODO

  _classCallCheck(this, WebGLRenderingContext);
});

exports["default"] = WebGLRenderingContext;
module.exports = exports["default"];

},{}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var _socketTask = new WeakMap();

var WebSocket = /*#__PURE__*/function () {
  // The connection is not yet open.
  // The connection is open and ready to communicate.
  // The connection is in the process of closing.
  // The connection is closed or couldn't be opened.
  // TODO 更新 binaryType
  // TODO 更新 bufferedAmount
  // TODO 小程序内目前获取不到，实际上需要根据服务器选择的 sub-protocol 返回
  function WebSocket(url) {
    var _this = this;

    var protocols = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    _classCallCheck(this, WebSocket);

    this.binaryType = '';
    this.bufferedAmount = 0;
    this.extensions = '';
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this.onopen = null;
    this.protocol = '';
    this.readyState = 3;

    if (typeof url !== 'string' || !/(^ws:\/\/)|(^wss:\/\/)/.test(url)) {
      throw new TypeError("Failed to construct 'WebSocket': The URL '".concat(url, "' is invalid"));
    }

    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    var socketTask = my.connectSocket({
      url: url,
      protocols: Array.isArray(protocols) ? protocols : [protocols],
      tcpNoDelay: true
    });

    _socketTask.set(this, socketTask);

    socketTask.onClose(function (res) {
      _this.readyState = WebSocket.CLOSED;

      if (typeof _this.onclose === 'function') {
        _this.onclose(res);
      }
    });
    socketTask.onMessage(function (res) {
      if (typeof _this.onmessage === 'function') {
        _this.onmessage(res);
      }
    });
    socketTask.onOpen(function () {
      _this.readyState = WebSocket.OPEN;

      if (typeof _this.onopen === 'function') {
        _this.onopen();
      }
    });
    socketTask.onError(function (res) {
      if (typeof _this.onerror === 'function') {
        _this.onerror(new Error(res.errMsg));
      }
    });
    return this;
  }

  _createClass(WebSocket, [{
    key: "close",
    value: function close(code, reason) {
      this.readyState = WebSocket.CLOSING;

      var socketTask = _socketTask.get(this);

      socketTask.close({
        code: code,
        reason: reason
      });
    }
  }, {
    key: "send",
    value: function send(data) {
      if (typeof data !== 'string' && !(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data)) {
        throw new TypeError("Failed to send message: The data ".concat(data, " is invalid"));
      }

      var socketTask = _socketTask.get(this);

      socketTask.send({
        data: data
      });
    }
  }]);

  return WebSocket;
}();

exports["default"] = WebSocket;
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;
module.exports = exports["default"];

},{}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.screen = exports.performance = exports.ontouchstart = exports.ontouchmove = exports.ontouchend = exports.innerWidth = exports.innerHeight = exports.devicePixelRatio = void 0;

var _my$getSystemInfoSync = my.getSystemInfoSync(),
    pixelRatio = _my$getSystemInfoSync.pixelRatio,
    windowWidth = _my$getSystemInfoSync.windowWidth,
    windowHeight = _my$getSystemInfoSync.windowHeight;

var devicePixelRatio = pixelRatio;
exports.devicePixelRatio = devicePixelRatio;
var width, height;

if ($global.screencanvas.getBoundingClientRect) {
  var rect = $global.screencanvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
} else {
  width = windowWidth;
  height = windowHeight;
}

var innerWidth = width;
exports.innerWidth = innerWidth;
var innerHeight = height;
exports.innerHeight = innerHeight;
var screen = {
  width: width,
  height: height,
  availWidth: innerWidth,
  availHeight: innerHeight,
  availLeft: 0,
  availTop: 0
};
exports.screen = screen;
var performance = {
  now: Date.now
};
exports.performance = performance;
var ontouchstart = null;
exports.ontouchstart = ontouchstart;
var ontouchmove = null;
exports.ontouchmove = ontouchmove;
var ontouchend = null;
exports.ontouchend = ontouchend;

},{}],37:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _EventTarget2 = _interopRequireDefault(require("./EventTarget.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var _url = new WeakMap();

var _method = new WeakMap();

var _requestHeader = new WeakMap();

var _responseHeader = new WeakMap();

var _requestTask = new WeakMap();

function _triggerEvent(type) {
  if (typeof this["on".concat(type)] === 'function') {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    this["on".concat(type)].apply(this, args);
  }
}

function _changeReadyState(readyState) {
  this.readyState = readyState;

  _triggerEvent.call(this, 'readystatechange');
}

var XMLHttpRequest = /*#__PURE__*/function (_EventTarget) {
  _inherits(XMLHttpRequest, _EventTarget);

  var _super = _createSuper(XMLHttpRequest);

  // TODO 没法模拟 HEADERS_RECEIVED 和 LOADING 两个状态

  /*
   * TODO 这一批事件应该是在 XMLHttpRequestEventTarget.prototype 上面的
   */
  function XMLHttpRequest() {
    var _this2;

    _classCallCheck(this, XMLHttpRequest);

    _this2 = _super.call(this);
    _this2.timeout = 0;
    _this2.onabort = null;
    _this2.onerror = null;
    _this2.onload = null;
    _this2.onloadstart = null;
    _this2.onprogress = null;
    _this2.ontimeout = null;
    _this2.onloadend = null;
    _this2.onreadystatechange = null;
    _this2.readyState = 0;
    _this2.response = null;
    _this2.responseText = null;
    _this2.responseType = '';
    _this2.responseXML = null;
    _this2.status = 0;
    _this2.statusText = '';
    _this2.upload = {};
    _this2.withCredentials = false;

    _requestHeader.set(_assertThisInitialized(_this2), {
      'content-type': 'application/x-www-form-urlencoded'
    });

    _responseHeader.set(_assertThisInitialized(_this2), {});

    return _this2;
  }

  _createClass(XMLHttpRequest, [{
    key: "abort",
    value: function abort() {
      var myRequestTask = _requestTask.get(this);

      if (myRequestTask) {
        myRequestTask.abort();
      }
    }
  }, {
    key: "getAllResponseHeaders",
    value: function getAllResponseHeaders() {
      var responseHeader = _responseHeader.get(this);

      return Object.keys(responseHeader).map(function (header) {
        return "".concat(header, ": ").concat(responseHeader[header]);
      }).join('\n');
    }
  }, {
    key: "getResponseHeader",
    value: function getResponseHeader(header) {
      return _responseHeader.get(this)[header];
    }
  }, {
    key: "open",
    value: function open(method, url
    /* async, user, password 这几个参数在小程序内不支持*/
    ) {
      _method.set(this, method);

      _url.set(this, url);

      _changeReadyState.call(this, XMLHttpRequest.OPENED);
    }
  }, {
    key: "overrideMimeType",
    value: function overrideMimeType() {}
  }, {
    key: "send",
    value: function send() {
      var _this3 = this;

      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      if (this.readyState !== XMLHttpRequest.OPENED) {
        throw new Error("Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.");
      } else {
        var myRequestTask = my.request({
          data: data,
          url: _url.get(this),
          method: _method.get(this),
          header: _requestHeader.get(this),
          dataType: 'other',
          responseType: this.responseType === 'arraybuffer' ? 'arraybuffer' : 'text',
          timeout: this.timeout || undefined,
          success: function success(_ref) {
            var data = _ref.data,
                status = _ref.status,
                header = _ref.header;
            _this3.status = status;

            _responseHeader.set(_this3, header);

            _triggerEvent.call(_this3, 'loadstart');

            _changeReadyState.call(_this3, XMLHttpRequest.HEADERS_RECEIVED);

            _changeReadyState.call(_this3, XMLHttpRequest.LOADING);

            switch (_this3.responseType) {
              case 'json':
                _this3.responseText = data;

                try {
                  _this3.response = JSON.parse(data);
                } catch (e) {
                  _this3.response = null;
                }

                break;

              case '':
              case 'text':
                _this3.responseText = _this3.response = data;
                break;

              case 'arraybuffer':
                _this3.response = data;
                _this3.responseText = '';
                var bytes = new Uint8Array(data);
                var len = bytes.byteLength;

                for (var i = 0; i < len; i++) {
                  _this3.responseText += String.fromCharCode(bytes[i]);
                }

                break;

              default:
                _this3.response = null;
            }

            _changeReadyState.call(_this3, XMLHttpRequest.DONE);

            _triggerEvent.call(_this3, 'load');

            _triggerEvent.call(_this3, 'loadend');
          },
          fail: function fail(_ref2) {
            var errMsg = _ref2.errMsg;

            // TODO 规范错误
            if (errMsg.indexOf('abort') !== -1) {
              _triggerEvent.call(_this3, 'abort');
            } else if (errMsg.indexOf('timeout') !== -1) {
              _triggerEvent.call(_this3, 'timeout');
            } else {
              _triggerEvent.call(_this3, 'error', errMsg);
            }

            _triggerEvent.call(_this3, 'loadend');
          }
        });

        _requestTask.set(this, myRequestTask);
      }
    }
  }, {
    key: "setRequestHeader",
    value: function setRequestHeader(header, value) {
      var myHeader = _requestHeader.get(this);

      myHeader[header] = value;

      _requestHeader.set(this, myHeader);
    }
  }, {
    key: "addEventListener",
    value: function addEventListener(type, listener) {
      if (typeof listener === 'function') {
        var _this = this;

        var event = {
          target: _this
        };

        this['on' + type] = function (event) {
          listener.call(_this, event);
        };
      }
    }
  }]);

  return XMLHttpRequest;
}(_EventTarget2["default"]);

exports["default"] = XMLHttpRequest;
XMLHttpRequest.UNSEND = 0;
XMLHttpRequest.OPENED = 1;
XMLHttpRequest.HEADERS_RECEIVED = 2;
XMLHttpRequest.LOADING = 3;
XMLHttpRequest.DONE = 4;
module.exports = exports["default"];

},{"./EventTarget.js":26}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var screencanvas = $global.screencanvas;
var cancelAnimationFrame = screencanvas.cancelAnimationFrame.bind(screencanvas);
var _default = cancelAnimationFrame;
exports["default"] = _default;
module.exports = exports["default"];

},{}],39:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _window = _interopRequireWildcard(require("./window"));

var _HTMLElement = _interopRequireDefault(require("./HTMLElement"));

var _Image = _interopRequireDefault(require("./Image"));

var _Canvas = _interopRequireDefault(require("./Canvas"));

var _Audio = _interopRequireDefault(require("./Audio"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var events = {};
var document = {
  readyState: 'complete',
  visibilityState: 'visible',
  documentElement: _window,
  hidden: false,
  style: {},
  location: _window.location,
  ontouchstart: null,
  ontouchmove: null,
  ontouchend: null,
  head: new _HTMLElement["default"]('head'),
  body: new _HTMLElement["default"]('body'),
  createElement: function createElement(tagName) {
    tagName = tagName.toLowerCase();

    if (tagName === 'canvas') {
      return new _Canvas["default"]();
    } else if (tagName === 'audio') {
      return new _Audio["default"]();
    } else if (tagName === 'img') {
      return new _Image["default"]();
    }

    return new _HTMLElement["default"](tagName);
  },
  createElementNS: function createElementNS(nameSpace, tagName) {
    return this.createElement(tagName);
  },
  getElementById: function getElementById(id) {
    if (id === _window.canvas.id) {
      return _window.canvas;
    }

    return null;
  },
  getElementsByTagName: function getElementsByTagName(tagName) {
    if (tagName === 'head') {
      return [document.head];
    } else if (tagName === 'body') {
      return [document.body];
    } else if (tagName === 'canvas') {
      return [_window.canvas];
    }

    return [];
  },
  getElementsByName: function getElementsByName(tagName) {
    if (tagName === 'head') {
      return [document.head];
    } else if (tagName === 'body') {
      return [document.body];
    } else if (tagName === 'canvas') {
      return [_window.canvas];
    }

    return [];
  },
  querySelector: function querySelector(query) {
    if (query === 'head') {
      return document.head;
    } else if (query === 'body') {
      return document.body;
    } else if (query === 'canvas') {
      return _window.canvas;
    } else if (query === "#".concat(_window.canvas.id)) {
      return _window.canvas;
    }

    return null;
  },
  querySelectorAll: function querySelectorAll(query) {
    if (query === 'head') {
      return [document.head];
    } else if (query === 'body') {
      return [document.body];
    } else if (query === 'canvas') {
      return [_window.canvas];
    }

    return [];
  },
  addEventListener: function addEventListener(type, listener) {
    if (!events[type]) {
      events[type] = [];
    }

    events[type].push(listener);
  },
  removeEventListener: function removeEventListener(type, listener) {
    var listeners = events[type];

    if (listeners && listeners.length > 0) {
      for (var i = listeners.length; i--; i > 0) {
        if (listeners[i] === listener) {
          listeners.splice(i, 1);
          break;
        }
      }
    }
  },
  dispatchEvent: function dispatchEvent(event) {
    var listeners = events[event.type];

    if (listeners) {
      for (var i = 0; i < listeners.length; i++) {
        listeners[i](event);
      }
    }
  }
};
var _default = document;
exports["default"] = _default;
module.exports = exports["default"];

},{"./Audio":23,"./Canvas":24,"./HTMLElement":29,"./Image":31,"./window":46}],40:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var _window = _interopRequireWildcard(require("./window"));

var _document = _interopRequireWildcard(require("./document"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var global = $global;

function inject() {
  // 暴露全局的 canvas
  _window.canvas = $global.screencanvas;
  _window.document = _document;

  _window.addEventListener = function (type, listener) {
    _window.document.addEventListener(type, listener);
  };

  _window.removeEventListener = function (type, listener) {
    _window.document.removeEventListener(type, listener);
  };

  _window.dispatchEvent = _window.document.dispatchEvent;

  var _my$getSystemInfoSync = my.getSystemInfoSync(),
      platform = _my$getSystemInfoSync.platform; // 开发者工具无法重定义 window


  if (typeof __devtoolssubcontext === 'undefined' && platform === 'devtools') {
    for (var key in _window) {
      var descriptor = Object.getOwnPropertyDescriptor(global, key);

      if (!descriptor || descriptor.configurable === true) {
        Object.defineProperty(window, key, {
          value: _window[key]
        });
      }
    }

    for (var _key in _window.document) {
      var _descriptor = Object.getOwnPropertyDescriptor(global.document, _key);

      if (!_descriptor || _descriptor.configurable === true) {
        Object.defineProperty(global.document, _key, {
          value: _window.document[_key]
        });
      }
    }

    window.parent = window;
  } else {
    for (var _key2 in _window) {
      global[_key2] = _window[_key2];
    } // global.window = _window
    // window = global
    // window.top = window.parent = window

  }

  global.setTimeout = setTimeout;
  global.clearTimeout = clearTimeout;
  global.setInterval = setInterval;
  global.clearInterval = clearInterval;
}

if (!global.__isAdapterInjected) {
  global.__isAdapterInjected = true;
  inject();
}

},{"./document":39,"./window":46}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var localStorage = {
  get length() {
    var _my$getStorageInfoSyn = my.getStorageInfoSync(),
        keys = _my$getStorageInfoSyn.keys;

    return keys.length;
  },

  key: function key(n) {
    var _my$getStorageInfoSyn2 = my.getStorageInfoSync(),
        keys = _my$getStorageInfoSyn2.keys;

    return keys[n];
  },
  getItem: function getItem(key) {
    var ret = my.getStorageSync({
      key: key
    });
    return ret && ret.data;
  },
  setItem: function setItem(key, data) {
    return my.setStorageSync({
      key: key,
      data: data
    });
  },
  removeItem: function removeItem(key) {
    my.removeStorageSync(key);
  },
  clear: function clear() {
    my.clearStorageSync();
  }
};
var _default = localStorage;
exports["default"] = _default;
module.exports = exports["default"];

},{}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var location = {
  href: 'game.js',
  reload: function reload() {}
};
var _default = location;
exports["default"] = _default;
module.exports = exports["default"];

},{}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _index = require("./util/index.js");

// TODO 需要 my.getSystemInfo 获取更详细信息
var systemInfo = my.getSystemInfoSync();
console.log(systemInfo);
var system = systemInfo.system;
var platform = systemInfo.platform;
var language = systemInfo.language;
var version = systemInfo.version;
var android = system ? system.toLowerCase().indexOf('android') !== -1 : false;
var uaDesc = android ? "Android; CPU ".concat(system) : "iPhone; CPU iPhone OS ".concat(system, " like Mac OS X");
var ua = "Mozilla/5.0 (".concat(uaDesc, ") AppleWebKit/603.1.30 (KHTML, like Gecko) Mobile/14E8301 MicroMessenger/").concat(version, " MiniGame NetType/WIFI Language/").concat(language);
var navigator = {
  platform: platform,
  language: language,
  appVersion: "5.0 (".concat(uaDesc, ") AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1"),
  userAgent: ua,
  onLine: true,
  // TODO 用 my.getNetworkStateChange 和 my.onNetworkStateChange 来返回真实的状态
  // TODO 用 my.getLocation 来封装 geolocation
  geolocation: {
    getCurrentPosition: _index.noop,
    watchPosition: _index.noop,
    clearWatch: _index.noop
  }
};

if (my.onNetworkStatusChange) {
  my.onNetworkStatusChange(function (event) {
    navigator.onLine = event.isConnected;
  });
}

var _default = navigator;
exports["default"] = _default;
module.exports = exports["default"];

},{"./util/index.js":45}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var screencanvas = $global.screencanvas;
var requestAnimationFrame = screencanvas.requestAnimationFrame.bind(screencanvas);
var _default = requestAnimationFrame;
exports["default"] = _default;
module.exports = exports["default"];

},{}],45:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.noop = noop;

function noop() {}

},{}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  navigator: true,
  XMLHttpRequest: true,
  WebSocket: true,
  Image: true,
  ImageBitmap: true,
  HTMLElement: true,
  HTMLImageElement: true,
  HTMLCanvasElement: true,
  WebGLRenderingContext: true,
  localStorage: true,
  location: true,
  requestAnimationFrame: true,
  cancelAnimationFrame: true
};
Object.defineProperty(exports, "HTMLCanvasElement", {
  enumerable: true,
  get: function get() {
    return _HTMLCanvasElement2["default"];
  }
});
Object.defineProperty(exports, "HTMLElement", {
  enumerable: true,
  get: function get() {
    return _HTMLElement2["default"];
  }
});
Object.defineProperty(exports, "HTMLImageElement", {
  enumerable: true,
  get: function get() {
    return _HTMLImageElement2["default"];
  }
});
Object.defineProperty(exports, "Image", {
  enumerable: true,
  get: function get() {
    return _Image2["default"];
  }
});
Object.defineProperty(exports, "ImageBitmap", {
  enumerable: true,
  get: function get() {
    return _ImageBitmap2["default"];
  }
});
Object.defineProperty(exports, "WebGLRenderingContext", {
  enumerable: true,
  get: function get() {
    return _WebGLRenderingContext2["default"];
  }
});
Object.defineProperty(exports, "WebSocket", {
  enumerable: true,
  get: function get() {
    return _WebSocket2["default"];
  }
});
Object.defineProperty(exports, "XMLHttpRequest", {
  enumerable: true,
  get: function get() {
    return _XMLHttpRequest2["default"];
  }
});
Object.defineProperty(exports, "cancelAnimationFrame", {
  enumerable: true,
  get: function get() {
    return _cancelAnimationFrame2["default"];
  }
});
Object.defineProperty(exports, "localStorage", {
  enumerable: true,
  get: function get() {
    return _localStorage2["default"];
  }
});
Object.defineProperty(exports, "location", {
  enumerable: true,
  get: function get() {
    return _location2["default"];
  }
});
Object.defineProperty(exports, "navigator", {
  enumerable: true,
  get: function get() {
    return _navigator2["default"];
  }
});
Object.defineProperty(exports, "requestAnimationFrame", {
  enumerable: true,
  get: function get() {
    return _requestAnimationFrame2["default"];
  }
});

var _navigator2 = _interopRequireDefault(require("./navigator"));

var _XMLHttpRequest2 = _interopRequireDefault(require("./XMLHttpRequest"));

var _WebSocket2 = _interopRequireDefault(require("./WebSocket"));

var _Image2 = _interopRequireDefault(require("./Image"));

var _ImageBitmap2 = _interopRequireDefault(require("./ImageBitmap"));

var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));

var _HTMLImageElement2 = _interopRequireDefault(require("./HTMLImageElement"));

var _HTMLCanvasElement2 = _interopRequireDefault(require("./HTMLCanvasElement"));

var _WebGLRenderingContext2 = _interopRequireDefault(require("./WebGLRenderingContext"));

var _localStorage2 = _interopRequireDefault(require("./localStorage"));

var _location2 = _interopRequireDefault(require("./location"));

var _requestAnimationFrame2 = _interopRequireDefault(require("./requestAnimationFrame"));

var _cancelAnimationFrame2 = _interopRequireDefault(require("./cancelAnimationFrame"));

var _WindowProperties = require("./WindowProperties");

Object.keys(_WindowProperties).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _WindowProperties[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _WindowProperties[key];
    }
  });
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

},{"./HTMLCanvasElement":28,"./HTMLElement":29,"./HTMLImageElement":30,"./Image":31,"./ImageBitmap":32,"./WebGLRenderingContext":34,"./WebSocket":35,"./WindowProperties":36,"./XMLHttpRequest":37,"./cancelAnimationFrame":38,"./localStorage":41,"./location":42,"./navigator":43,"./requestAnimationFrame":44}],47:[function(require,module,exports){
"use strict";

var screencanvas = $global.screencanvas;
var parser = cc.assetManager.parser;
var downloader = cc.assetManager.downloader;

function parseParameters(options, onProgress, onComplete) {
  if (onComplete === undefined) {
    var isCallback = typeof options === 'function';

    if (onProgress) {
      onComplete = onProgress;

      if (!isCallback) {
        onProgress = null;
      }
    } else if (onProgress === undefined && isCallback) {
      onComplete = options;
      options = null;
      onProgress = null;
    }

    if (onProgress !== undefined && isCallback) {
      onProgress = options;
      options = null;
    }
  }

  options = options || Object.create(null);
  return {
    options: options,
    onProgress: onProgress,
    onComplete: onComplete
  };
}

function doNothing(url, options, onComplete) {
  onComplete(null, url);
}

downloader.downloadDomAudio = doNothing;

function downloadImage(url, options, onComplete) {
  var parameters = parseParameters(options, undefined, onComplete);
  options = parameters.options;
  onComplete = parameters.onComplete;
  var img = screencanvas.createImage();
  var timer = setTimeout(function () {
    clearEvent();
    onComplete && onComplete(new Error(cc.debug.getError(4930, url)));
  }, 8000);

  function clearEvent() {
    img.onload = null; // img.onerror = null;
  }

  function loadCallback() {
    clearEvent();
    clearTimeout(timer);
    onComplete && onComplete(null, img);
  }

  function errorCallback() {
    clearEvent();
    clearTimeout(timer);
    onComplete && onComplete(new Error(cc.debug.getError(4930, url)));
  }

  img.onload = loadCallback; // NOTE: crash when registering error callback
  // img.onerror = errorCallback;

  img.src = url;
  return img;
}

downloader.downloadDomImage = downloadImage;
downloader.register({
  // Audio
  '.mp3': doNothing,
  '.ogg': doNothing,
  '.wav': doNothing,
  '.m4a': doNothing,
  // Image
  '.png': doNothing,
  '.jpg': doNothing,
  '.bmp': doNothing,
  '.jpeg': doNothing,
  '.gif': doNothing,
  '.ico': doNothing,
  '.tiff': doNothing,
  '.image': doNothing,
  '.webp': doNothing,
  '.pvr': doNothing,
  '.pkm': doNothing
});
parser.register({
  // Audio
  '.mp3': doNothing,
  '.ogg': doNothing,
  '.wav': doNothing,
  '.m4a': doNothing,
  // Image
  '.png': downloadImage,
  '.jpg': downloadImage,
  '.bmp': downloadImage,
  '.jpeg': downloadImage,
  '.gif': downloadImage,
  '.ico': downloadImage,
  '.tiff': downloadImage,
  '.image': downloadImage,
  '.webp': downloadImage
});

},{}],48:[function(require,module,exports){
"use strict";

var game = cc.game;
var EventTarget = cc.EventTarget;
var State = {
  ERROR: -1,
  INITIALZING: 0,
  PLAYING: 1,
  PAUSED: 2,
  STOPPED: 3
};

function Audio(url, serializedDuration) {
  var _this = this;

  this._nativeAudio = my.createInnerAudioContext();
  this._et = new EventTarget();

  this._setSrc(url);

  var nativeAudio = this._nativeAudio;
  this._serializedDuration = serializedDuration;
  this.reset(); // BUG: access duration invokes onEnded callback.
  // this._ensureLoaded(() => {
  //     this._duration = nativeAudio.duration;
  // });

  this._duration = 1;

  this._onShow = function () {
    if (_this._blocked) {
      _this._nativeAudio.play();
    }

    _this._blocked = false;
  };

  this._onHide = function () {
    if (_this.getState() === State.PLAYING) {
      _this._nativeAudio.pause();

      _this._blocked = true;
    }
  };

  nativeAudio.onCanplay(function () {
    _this._et.emit('load');
  });
  nativeAudio.onError(function (err) {
    _this._et.emit('error', err);
  });
  nativeAudio.onEnded(function () {
    _this.finishCB && _this.finishCB();
    _this._state = State.INITIALZING;

    _this._et.emit('ended');
  });
  nativeAudio.onStop(function () {
    _this._et.emit('stop');
  }); // nativeAudio.onTimeUpdate(() => { this._currentTime = nativeAudio.currentTime; });  // BUG: onTimeUpdate not working

  game.on(game.EVENT_SHOW, this._onShow);
  game.on(game.EVENT_HIDE, this._onHide);
}

Audio.State = State;
Object.assign(Audio.prototype, {
  reset: function reset() {
    this.id = -1;
    this.finishCB = null; // For audioEngine custom ended callback.

    this._state = State.INITIALZING;
    this._loop = false;
    this._currentTime = 0;
    this._volume = 1;
    this._blocked = false;
    this._loaded = false;
    this.offLoad();
    this.offError();
    this.offEnded();
    this.offStop();
    this.offAudioLoad();
  },
  destroy: function destroy() {
    this.reset();
    game.off(game.EVENT_SHOW, this._onShow);
    game.off(game.EVENT_HIDE, this._onHide); // offCanplay offOnError offStop offEnded is not supported for now.

    this._nativeAudio.destroy();

    this._nativeAudio = null;
  },
  getSrc: function getSrc() {
    return this._src;
  },
  // NOTE: don't set src twice, which is not supported on TAOBAO
  _setSrc: function _setSrc(path) {
    var _this2 = this;

    if (this._src === path) {
      return;
    }

    var nativeAudio = this._nativeAudio;
    var done = false;
    this._loaded = false; // HACK: onCanplay callback not working on Taobao.

    var timer = setTimeout(function () {
      if (done) {
        return;
      }

      cc.warn('Timeout to load audio');
      done = true;

      _this2._et.emit('audio-load');
    }, 3000);
    this.onLoad(function () {
      if (done) {
        return;
      }

      clearTimeout(timer);
      done = true;

      _this2._et.emit('audio-load');
    });
    this.onError(function (err) {
      if (done) {
        return;
      }

      clearTimeout(timer);
      done = true;
      cc.error(err);
    });
    nativeAudio.src = path;
    this._src = path;
  },
  getState: function getState() {
    return this._state;
  },
  getDuration: function getDuration() {
    return this._serializedDuration ? this._serializedDuration : this._duration;
  },
  // getCurrentTime () { return this._currentTime; },  // onTimeUpdate not working...
  getCurrentTime: function getCurrentTime() {
    return this._nativeAudio.currentTime;
  },
  seek: function seek(val) {
    var _this3 = this;

    if (this._currentTime === val) {
      return;
    }

    this._ensureLoaded(function () {
      _this3._nativeAudio.seek(val);

      _this3._currentTime = val;
    });
  },
  getLoop: function getLoop() {
    return this._loop;
  },
  setLoop: function setLoop(val) {
    var _this4 = this;

    if (this._loop === val) {
      return;
    }

    this._ensureLoaded(function () {
      _this4._nativeAudio.loop = val;
      _this4._loop = val;
    });
  },
  getVolume: function getVolume() {
    return this._volume;
  },
  setVolume: function setVolume(val) {
    var _this5 = this;

    if (this._volume === val) {
      return;
    }

    this._ensureLoaded(function () {
      _this5._nativeAudio.volume = val;
      _this5._volume = val;
    });
  },
  play: function play() {
    if (this.getState() !== State.PLAYING) {
      this._nativeAudio.play();

      this._state = State.PLAYING;
    }
  },
  resume: function resume() {
    if (this.getState() === State.PAUSED) {
      this._nativeAudio.play();

      this._state = State.PLAYING;
    }
  },
  pause: function pause() {
    if (this.getState() === State.PLAYING) {
      this._nativeAudio.pause();

      this._state = State.PAUSED;
    }
  },
  stop: function stop() {
    this._nativeAudio.stop();

    this._state = State.STOPPED;
  },
  onceAudioLoad: function onceAudioLoad(cb) {
    this._et.once('audio-load', cb);
  },
  offAudioLoad: function offAudioLoad() {
    var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

    this._et.off('audio-load', cb);
  },
  onLoad: function onLoad(cb) {
    this._et.on('load', cb);
  },
  offLoad: function offLoad() {
    var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

    this._et.off('load', cb);
  },
  onError: function onError(cb) {
    this._et.on('error', cb);
  },
  offError: function offError() {
    var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

    this._et.off('error', cb);
  },
  onEnded: function onEnded(cb) {
    this._et.on('ended', cb);
  },
  offEnded: function offEnded() {
    var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

    this._et.off('ended', cb);
  },
  onStop: function onStop(cb) {
    this._et.on('stop', cb);
  },
  offStop: function offStop() {
    var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

    this._et.off('stop', cb);
  },
  _ensureLoaded: function _ensureLoaded(cb) {
    var _this6 = this;

    if (this._loaded) {
      cb();
    } else {
      this.onceAudioLoad(function () {
        _this6._loaded = true;
        cb();
      });
    }
  }
});
module.exports = Audio;

},{}],49:[function(require,module,exports){
"use strict";

var Audio = require('./Audio');

var AudioClip = cc.AudioClip;
var js = cc.js;
var isAndroid = cc.sys.os = cc.sys.OS_ANDROID;
var _instanceId = 0;
var _id2audio = {};
var _audioPool = [];
var _maxPoolSize = 32;

function handleVolume(volume) {
  if (volume === undefined) {
    // set default volume as 1
    volume = 1;
  } else if (typeof volume === 'string') {
    volume = Number.parseFloat(volume);
  }

  return volume;
}

;

function getOrCreateAudio(path, serializedDuration) {
  var audio;

  _audioPool.some(function (item, index) {
    if (item.getSrc() === path) {
      audio = item;

      _audioPool.splice(index, 1);

      return true;
    }

    return false;
  });

  if (!audio) {
    audio = new Audio(path, serializedDuration);
  }

  audio.id = ++_instanceId;
  audio.onEnded(function () {
    if (isAndroid) {
      // BUG: audio can't reuse after ended on Taobao Android end.
      delete _id2audio[audio.id];
      audio.destroy();
    } else {
      putOrDestroyAudio(audio);
    }
  });
  return audio;
}

function putOrDestroyAudio(audio) {
  if (_audioPool.includes(audio)) {
    return;
  }

  delete _id2audio[audio.id];
  audio.reset();

  if (_audioPool.length < _maxPoolSize) {
    _audioPool.push(audio);
  } else {
    audio.destroy();
  }
}

var _maxPlayingAudio = 10;
cc.audioEngine = {
  AudioState: Audio.State,
  _maxPoolSize: 32,
  _id2audio: _id2audio,
  _pauseIDCache: [],
  _play: function _play(clip, loop, volume) {
    var path;

    if (typeof clip === 'string') {
      path = clip;
    } else {
      path = clip.nativeUrl;
    }

    var audio = getOrCreateAudio(path, clip.duration);
    volume = handleVolume(volume);
    audio.setLoop(loop || false);
    audio.setVolume(volume);
    audio.play();
    return audio;
  },
  play: function play(clip, loop, volume) {
    var audio = this._play(clip, loop, volume);

    this._id2audio[audio.id] = audio;
    return audio.id;
  },
  setLoop: function setLoop(id, loop) {
    var audio = this._id2audio[id];

    if (audio) {
      audio.setLoop(loop);
    }
  },
  isLoop: function isLoop(id) {
    var audio = this._id2audio[id];

    if (audio) {
      return audio.getLoop();
    }

    return false;
  },
  setVolume: function setVolume(id, volume) {
    volume = handleVolume(volume);
    var audio = this._id2audio[id];

    if (audio) {
      return audio.setVolume(volume);
    }
  },
  getVolume: function getVolume(id) {
    var audio = this._id2audio[id];

    if (audio) {
      return audio.getVolume();
    }

    return 1;
  },
  setCurrentTime: function setCurrentTime(id, sec) {
    var audio = this._id2audio[id];

    if (audio) {
      return audio.seek(sec);
    }
  },
  getCurrentTime: function getCurrentTime(id) {
    var audio = this._id2audio[id];

    if (audio) {
      return audio.getCurrentTime();
    }

    return 0;
  },
  getDuration: function getDuration(id) {
    var audio = this._id2audio[id];

    if (audio) {
      return audio.getDuration();
    }

    return 1;
  },
  getState: function getState(id) {
    var audio = this._id2audio[id];

    if (audio) {
      return audio.getState();
    }

    return Audio.State.INITIALZING;
  },
  isPlaying: function isPlaying(id) {
    var audio = this._id2audio[id];

    if (audio) {
      return audio.getState() === Audio.State.PLAYING;
    }

    return false;
  },
  setFinishCallback: function setFinishCallback(id, callback) {
    var audio = this._id2audio[id];

    if (audio) {
      return audio.finishCB = callback;
    }
  },
  pause: function pause(id) {
    var audio = this._id2audio[id];

    if (audio) {
      audio.pause();
    }
  },
  pauseAll: function pauseAll() {
    for (var id in this._id2audio) {
      var audio = this._id2audio[id];

      if (audio) {
        audio.pause();
      }
    }
  },
  resume: function resume(id) {
    var audio = this._id2audio[id];

    if (audio) {
      audio.resume();
    }
  },
  resumeAll: function resumeAll() {
    for (var id in this._id2audio) {
      var audio = this._id2audio[id];

      if (audio) {
        audio.resume();
      }
    }
  },
  stop: function stop(id) {
    var audio = this._id2audio[id];

    if (audio) {
      audio.stop();
    }
  },
  stopAll: function stopAll() {
    for (var id in this._id2audio) {
      var audio = this._id2audio[id];

      if (audio) {
        audio.stop();
      }
    }
  },
  setMaxAudioInstance: function setMaxAudioInstance(num) {// NOT SUPPPORTED
  },
  getMaxAudioInstance: function getMaxAudioInstance() {
    return _maxPlayingAudio;
  },
  uncache: function uncache(clip) {
    var filePath = clip;

    if (typeof clip === 'string') {
      // backward compatibility since 1.10
      cc.warnID(8401, 'cc.audioEngine', 'cc.AudioClip', 'AudioClip', 'cc.AudioClip', 'audio');
      filePath = clip;
    } else {
      if (!clip) {
        return;
      }

      filePath = clip.nativeUrl;
    }

    for (var id in _id2audio) {
      var audio = this._id2audio[id];

      if (audio && audio.getSrc() === filePath) {
        audio.stop();
        putOrDestroyAudio(audio);
      }
    }
  },
  uncacheAll: function uncacheAll() {
    this.stopAll();

    for (var id in _id2audio) {
      var audio = _id2audio[id];

      if (audio) {
        audio.stop();
        putOrDestroyAudio(audio);
      }
    }
  },
  _break: function _break() {// DO NOTHING
  },
  _restore: function _restore() {// DO NOTHING        
  },
  ///////////////////////////////
  // Classification of interface
  _music: null,
  _effectVolume: 1,
  playMusic: function playMusic(clip, loop) {
    if (this._music) {
      if (this._music.getSrc() !== clip.nativeUrl) {
        this._music.stop();

        putOrDestroyAudio(this._music);

        var audio = this._play(clip, loop);

        this._music = audio;
      } else {
        this._music.stop();

        this._music.play();
      }
    } else {
      var _audio = this._play(clip, loop);

      this._music = _audio;
    }

    return this._music.id;
  },
  stopMusic: function stopMusic() {
    this._music.stop();
  },
  pauseMusic: function pauseMusic() {
    this._music.pause();
  },
  resumeMusic: function resumeMusic() {
    this._music.resume();
  },
  getMusicVolume: function getMusicVolume() {
    if (this._music) {
      return this._music.getVolume();
    }

    return 1;
  },
  setMusicVolume: function setMusicVolume(volume) {
    volume = handleVolume(volume);

    if (this._music) {
      this._music.setVolume(volume);
    }
  },
  isMusicPlaying: function isMusicPlaying() {
    return this._music.getState() === Audio.State.PLAYING;
  },
  playEffect: function playEffect(clip, loop) {
    return this.play(clip, loop, this._effectVolume);
  },
  setEffectsVolume: function setEffectsVolume(volume) {
    volume = handleVolume(volume);
    var musicId = this._music.id;
    this._effectVolume = volume;

    for (var id in _id2audio) {
      var audio = _id2audio[id];
      if (!audio || audio.id === musicId) continue;
      audio.setVolume(volume);
    }
  },
  getEffectsVolume: function getEffectsVolume() {
    return this._effectVolume;
  },
  pauseEffect: function pauseEffect(id) {
    return this.pause(id);
  },
  pauseAllEffects: function pauseAllEffects() {
    var musicId = this._music.id;

    for (var id in _id2audio) {
      var audio = _id2audio[id];
      if (!audio || audio.id === musicId) continue;
      audio.pause();
    }
  },
  resumeEffect: function resumeEffect(id) {
    this.resume(id);
  },
  resumeAllEffects: function resumeAllEffects() {
    var musicId = this._music.id;

    for (var id in _id2audio) {
      var audio = _id2audio[id];
      if (!audio || audio.id === musicId) continue;
      audio.resume();
    }
  },
  stopEffect: function stopEffect(id) {
    return this.stop(id);
  },
  stopAllEffects: function stopAllEffects() {
    var musicId = this._music.id;

    for (var id in _id2audio) {
      var audio = _id2audio[id];
      if (!audio || audio.id === musicId) continue;
      audio.stop();
    }
  }
};

},{"./Audio":48}],50:[function(require,module,exports){
"use strict";

var Audio = require('./Audio');

var AudioClip = cc.AudioClip;
var proto = cc.AudioSource.prototype;
Object.defineProperties(proto, {
  isPlaying: {
    get: function get() {
      var state = this.audio.getState();
      return state === cc._Audio.State.PLAYING;
    }
  },
  clip: {
    get: function get() {
      return this._clip;
    },
    set: function set(value) {
      if (value === this._clip) {
        return;
      }

      if (!(value instanceof AudioClip)) {
        return cc.error('Wrong type of AudioClip.');
      }

      this._clip = value;
      this.audio.stop();
      this.audio.destroy();
      this.audio = new Audio(value.nativeUrl, value.duration);
    }
  },
  volume: {
    get: function get() {
      return this._volume;
    },
    set: function set(value) {
      value = misc.clamp01(value);
      this._volume = value;

      if (!this._mute) {
        this.audio.setVolume(value);
      }

      return value;
    }
  },
  mute: {
    get: function get() {
      return this._mute;
    },
    set: function set(value) {
      if (this._mute === value) {
        return;
      }

      this._mute = value;
      this.audio.setVolume(value ? 0 : this._volume);
      return value;
    }
  },
  loop: {
    get: function get() {
      return this._loop;
    },
    set: function set(value) {
      this._loop = value;
      this.audio.setLoop(value);
      return value;
    }
  }
});
Object.assign(proto, {
  onLoad: function onLoad() {
    if (this._clip) {
      this.audio = new Audio(this._clip.nativeUrl, this._clip.duration);
    }
  },
  onEnable: function onEnable() {
    if (this.playOnLoad && this._firstlyEnabled) {
      this._firstlyEnabled = false;
      this.play();
    }
  },
  onDisable: function onDisable() {
    this.stop();
  },
  onDestroy: function onDestroy() {
    this.audio.destroy();
  },
  play: function play() {
    if (!this._clip) return;
    var audio = this.audio;
    audio.setVolume(this._mute ? 0 : this._volume);
    audio.setLoop(this._loop);
    audio.seek(0);
    audio.play();
  },
  stop: function stop() {
    this.audio.stop();
  },
  pause: function pause() {
    this.audio.pause();
  },
  resume: function resume() {
    this.audio.resume();
  },
  rewind: function rewind() {
    this.audio.seek(0);
  },
  getCurrentTime: function getCurrentTime() {
    return this.audio.getCurrentTime();
  },
  setCurrentTime: function setCurrentTime(time) {
    this.audio.seek(time);
    return time;
  },
  getDuration: function getDuration() {
    return this.audio.getDuration();
  }
});

},{"./Audio":48}],51:[function(require,module,exports){
"use strict";

(function () {
  if (!(cc && cc.EditBox)) {
    return;
  }

  var EditBox = cc.EditBox;
  var js = cc.js;
  var KeyboardReturnType = EditBox.KeyboardReturnType;
  var MAX_VALUE = 65535;

  function getKeyboardReturnType(type) {
    switch (type) {
      case KeyboardReturnType.DEFAULT:
      case KeyboardReturnType.DONE:
        return 'done';

      case KeyboardReturnType.SEND:
        return 'send';

      case KeyboardReturnType.SEARCH:
        return 'search';

      case KeyboardReturnType.GO:
        return 'go';

      case KeyboardReturnType.NEXT:
        return 'next';
    }

    return 'done';
  }

  var BaseClass = EditBox._ImplClass;

  function MiniGameEditBoxImpl() {
    BaseClass.call(this);
  }

  js.extend(MiniGameEditBoxImpl, BaseClass);
  EditBox._ImplClass = MiniGameEditBoxImpl;
  Object.assign(MiniGameEditBoxImpl.prototype, {
    init: function init(delegate) {
      if (!delegate) {
        cc.error('EditBox init failed');
        return;
      }

      this._delegate = delegate;
    },
    beginEditing: function beginEditing() {
      // In case multiply register events
      if (this._editing) {
        return;
      }

      var delegate = this._delegate;

      this._showPrompt();

      this._editing = true;
      delegate.editBoxEditingDidBegan();
    },
    endEditing: function endEditing() {
      cc.warn("Can't support to end editing.");
    },
    _showPrompt: function _showPrompt() {
      var self = this;
      var delegate = this._delegate;
      var multiline = delegate.inputMode === EditBox.InputMode.ANY;
      var maxLength = delegate.maxLength < 0 ? MAX_VALUE : delegate.maxLength;

      if (multiline) {
        cc.warn("Multiline editing is not supported");
      }

      my.prompt({
        title: '',
        message: delegate.placeholder,
        // placeholder: delegate.placeholder,
        okButtonText: getKeyboardReturnType(delegate.returnType),
        cancelButtonText: 'cancel',
        success: function success(result) {
          if (result.ok) {
            var inputValue = result.inputValue;
            inputValue = maxLength <= inputValue.length ? inputValue.substring(0, maxLength) : inputValue;

            if (delegate._string !== inputValue) {
              delegate.editBoxTextChanged(inputValue);
            }

            delegate.editBoxEditingReturn();
          }

          self._editing = false;
          delegate.editBoxEditingDidEnded();
        }
      });
    }
  });
})();

},{}],52:[function(require,module,exports){
"use strict";

if (cc && cc.Label) {
  var gfx = cc.gfx;
  var Label = cc.Label; // shared label canvas

  var _sharedLabelCanvas = my.createOffscreenCanvas();

  var _sharedLabelCanvasCtx = _sharedLabelCanvas.getContext('2d');

  var canvasData = {
    canvas: _sharedLabelCanvas,
    context: _sharedLabelCanvasCtx
  };
  cc.game.on(cc.game.EVENT_ENGINE_INITED, function () {
    Object.assign(Label._canvasPool, {
      get: function get() {
        return canvasData;
      },
      put: function put() {// do nothing
      }
    });
  });
  var _originUpdateMaterial = Label.prototype._updateMaterialWebgl; // fix ttf font black border

  Object.assign(Label.prototype, {
    _updateMaterialWebgl: function _updateMaterialWebgl() {
      _originUpdateMaterial.call(this); // init blend factor


      var material = this._materials[0];

      if (!this._frame || !material) {
        return;
      }

      var dstBlendFactor = cc.macro.BlendFactor.ONE_MINUS_SRC_ALPHA;
      var srcBlendFactor;

      if (!(__globalAdapter.isDevTool || this.font instanceof cc.BitmapFont)) {
        // Premultiplied alpha on runtime
        srcBlendFactor = cc.macro.BlendFactor.ONE;
      } else {
        srcBlendFactor = cc.macro.BlendFactor.SRC_ALPHA;
      } // set blend func


      material.effect.setBlend(true, gfx.BLEND_FUNC_ADD, srcBlendFactor, dstBlendFactor, gfx.BLEND_FUNC_ADD, srcBlendFactor, dstBlendFactor);
    }
  });
}

},{}],53:[function(require,module,exports){
"use strict";

// NOTE: can't cache file on Taobao iOS end
cc.assetManager.cacheManager.cacheEnabled = cc.sys.os !== cc.sys.OS_IOS;

},{}],54:[function(require,module,exports){
"use strict";

require('./AudioEngine');

require('./AudioSource');

require('./AssetManager');

require('./cache-manager');

require('./Label');

require('./Editbox');

},{"./AssetManager":47,"./AudioEngine":49,"./AudioSource":50,"./Editbox":51,"./Label":52,"./cache-manager":53}],55:[function(require,module,exports){
"use strict";

/****************************************************************************
 Copyright (c) 2017-2019 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
// TODO: verify the my API
var fs = my.getFileSystemManager ? my.getFileSystemManager() : null;
var outOfStorageRegExp = /the maximum size of the file storage/; // not exactly right

var fsUtils = {
  fs: fs,
  isOutOfStorage: function isOutOfStorage(errMsg) {
    return outOfStorageRegExp.test(errMsg);
  },
  getUserDataPath: function getUserDataPath() {
    return my.env.USER_DATA_PATH;
  },
  checkFsValid: function checkFsValid() {
    if (!fs) {
      console.warn('Can not get the file system!');
      return false;
    }

    return true;
  },
  deleteFile: function deleteFile(filePath, onComplete) {
    fs.unlink({
      filePath: filePath,
      success: function success() {
        onComplete && onComplete(null);
      },
      fail: function fail(res) {
        console.warn("Delete file failed: path: ".concat(filePath, " message: ").concat(res.errorMessage));
        onComplete && onComplete(new Error(res.errorMessage));
      }
    });
  },
  downloadFile: function downloadFile(remoteUrl, filePath, header, onProgress, onComplete) {
    var options = {
      url: remoteUrl,
      success: function success(res) {
        if (!filePath) {
          onComplete && onComplete(null, res.apFilePath);
        } else {
          fsUtils.copyFile(res.apFilePath, filePath, onComplete);
        }
      },
      fail: function fail(res) {
        console.warn("Download file failed: path: ".concat(remoteUrl, " message: ").concat(res.errorMessage));
        onComplete && onComplete(new Error(res.errorMessage), null);
      }
    };
    if (header) options.header = header;
    var task = my.downloadFile(options);
    onProgress && task.onProgressUpdate(onProgress);
  },
  saveFile: function saveFile(srcPath, destPath, onComplete) {
    // Hack, seems like my.saveFile dose not work
    fsUtils.copyFile(srcPath, destPath, onComplete);
  },
  copyFile: function copyFile(srcPath, destPath, onComplete) {
    fs.copyFile({
      srcPath: srcPath,
      destPath: destPath,
      success: function success() {
        onComplete && onComplete(null);
      },
      fail: function fail(res) {
        console.warn("Copy file failed: path: ".concat(srcPath, " message: ").concat(res.errorMessage));
        onComplete && onComplete(new Error(res.errorMessage));
      }
    });
  },
  writeFile: function writeFile(path, data, encoding, onComplete) {
    fs.writeFile({
      filePath: path,
      encoding: encoding,
      data: data,
      success: function success() {
        onComplete && onComplete(null);
      },
      fail: function fail(res) {
        console.warn("Write file failed: path: ".concat(path, " message: ").concat(res.errorMessage));
        onComplete && onComplete(new Error(res.errorMessage));
      }
    });
  },
  writeFileSync: function writeFileSync(path, data, encoding) {
    try {
      fs.writeFileSync({
        filePath: path,
        data: data,
        encoding: encoding
      });
      return null;
    } catch (e) {
      console.warn("Write file failed: path: ".concat(path, " message: ").concat(e.message));
      return new Error(e.message);
    }
  },
  readFile: function readFile(filePath, encoding, onComplete) {
    fs.readFile({
      filePath: filePath,
      encoding: encoding,
      success: function success(res) {
        onComplete && onComplete(null, res.data);
      },
      fail: function fail(res) {
        console.warn("Read file failed: path: ".concat(filePath, " message: ").concat(res.errorMessage));
        onComplete && onComplete(new Error(res.errorMessage), null);
      }
    });
  },
  readDir: function readDir(filePath, onComplete) {
    fs.readdir({
      dirPath: filePath,
      success: function success(res) {
        onComplete && onComplete(null, res.files);
      },
      fail: function fail(res) {
        console.warn("Read directory failed: path: ".concat(filePath, " message: ").concat(res.errorMessage));
        onComplete && onComplete(new Error(res.errorMessage), null);
      }
    });
  },
  readText: function readText(filePath, onComplete) {
    fsUtils.readFile(filePath, 'utf8', onComplete);
  },
  readArrayBuffer: function readArrayBuffer(filePath, onComplete) {
    fsUtils.readFile(filePath, '', onComplete);
  },
  readJson: function readJson(filePath, onComplete) {
    fsUtils.readFile(filePath, 'utf8', function (err, text) {
      var out = null;

      if (!err) {
        try {
          out = JSON.parse(text);
        } catch (e) {
          console.warn("Read json failed: path: ".concat(filePath, " message: ").concat(e.message));
          err = new Error(e.message);
        }
      }

      onComplete && onComplete(err, out);
    });
  },
  readJsonSync: function readJsonSync(path) {
    try {
      var res = fs.readFileSync({
        filePath: path,
        encoding: 'utf8'
      });
      return JSON.parse(res.data);
    } catch (e) {
      console.warn("Read json failed: path: ".concat(path, " message: ").concat(e.message));
      return new Error(e.message);
    }
  },
  makeDirSync: function makeDirSync(path, recursive) {
    try {
      fs.mkdirSync({
        dirPath: path,
        recursive: recursive
      });
      return null;
    } catch (e) {
      console.warn("Make directory failed: path: ".concat(path, " message: ").concat(e.message));
      return new Error(e.message);
    }
  },
  rmdirSync: function rmdirSync(dirPath, recursive) {
    try {
      fs.rmdirSync({
        dirPath: dirPath,
        recursive: recursive
      });
    } catch (e) {
      console.warn("rm directory failed: path: ".concat(dirPath, " message: ").concat(e.message));
      return new Error(e.message);
    }
  },
  exists: function exists(filePath, onComplete) {
    // fs.access is not supported.
    // fs.access({
    //     path: filePath,
    //     success: function () {
    //         onComplete && onComplete(true);
    //     },
    //     fail: function () {
    //         onComplete && onComplete(false);
    //     }
    // });
    fs.readFile({
      filePath: filePath,
      success: function success() {
        onComplete && onComplete(true);
      },
      fail: function fail() {
        onComplete && onComplete(false);
      }
    });
  },
  loadSubpackage: function loadSubpackage(name, onProgress, onComplete) {
    throw new Error('Not Implemented');
  },
  unzip: function unzip(zipFilePath, targetPath, onComplete) {
    fs.unzip({
      zipFilePath: zipFilePath,
      targetPath: targetPath,
      success: function success() {
        onComplete && onComplete(null);
      },
      fail: function fail(res) {
        console.warn("unzip failed: path: ".concat(zipFilePath, " message: ").concat(res.errorMessage));
        onComplete && onComplete(new Error('unzip failed: ' + res.errorMessage));
      }
    });
  }
};
window.fsUtils = module.exports = fsUtils;

},{}],56:[function(require,module,exports){
"use strict";

var adapter = window.__globalAdapter;
var adaptSysFunc = adapter.adaptSys;
Object.assign(adapter, {
  // Extend adaptSys interface
  adaptSys: function adaptSys(sys) {
    adaptSysFunc.call(this, sys);
    sys.platform = sys.TAOBAO;
  }
});

},{}],57:[function(require,module,exports){
"use strict";

var utils = require('../../../common/utils');

if (window.__globalAdapter) {
  var accelerometerChangeCallback = function accelerometerChangeCallback(res, cb) {
    var resClone = {};
    var x = res.x;
    var y = res.y;

    if (isLandscape) {
      var tmp = x;
      x = -y;
      y = tmp;
    }

    resClone.x = x;
    resClone.y = y;
    resClone.z = res.z;
    accelerometerCallback && accelerometerCallback(resClone);
  };

  var globalAdapter = window.__globalAdapter; // SystemInfo

  globalAdapter.isSubContext = false; // sub context not supported

  globalAdapter.isDevTool = my.isIDE;
  utils.cloneMethod(globalAdapter, my, 'getSystemInfoSync'); // Audio

  globalAdapter.createInnerAudioContext = function () {
    var audio = my.createInnerAudioContext();

    if (my.getSystemInfoSync().platform === 'iOS') {
      var currentTime = 0;
      var originalSeek = audio.seek;

      audio.seek = function (time) {
        // need to access audio.paused in the next tick
        setTimeout(function () {
          if (audio.paused) {
            currentTime = time;
          } else {
            originalSeek.call(audio, time);
          }
        }, 50);
      };

      var originalPlay = audio.play;

      audio.play = function () {
        if (currentTime !== 0) {
          audio.seek(currentTime);
          currentTime = 0; // clear cached currentTime
        }

        originalPlay.call(audio);
      };
    }

    return audio;
  }; // FrameRate
  // utils.cloneMethod(globalAdapter, my, 'setPreferredFramesPerSecond');
  // Keyboard


  globalAdapter.showKeyboard = function () {
    return console.warn('showKeyboard not supported.');
  };

  globalAdapter.hideKeyboard = function () {
    return console.warn('hideKeyboard not supported.');
  };

  globalAdapter.updateKeyboard = function () {
    return console.warn('updateKeyboard not supported.');
  };

  globalAdapter.onKeyboardInput = function () {
    return console.warn('onKeyboardInput not supported.');
  };

  globalAdapter.onKeyboardConfirm = function () {
    return console.warn('onKeyboardConfirm not supported.');
  };

  globalAdapter.onKeyboardComplete = function () {
    return console.warn('onKeyboardComplete not supported.');
  };

  globalAdapter.offKeyboardInput = function () {
    return console.warn('offKeyboardInput not supported.');
  };

  globalAdapter.offKeyboardConfirm = function () {
    return console.warn('offKeyboardConfirm not supported.');
  };

  globalAdapter.offKeyboardComplete = function () {
    return console.warn('offKeyboardComplete not supported.');
  }; // Message


  utils.cloneMethod(globalAdapter, my, 'getOpenDataContext');
  utils.cloneMethod(globalAdapter, my, 'onMessage'); // Subpackage not supported
  // utils.cloneMethod(globalAdapter, my, 'loadSubpackage');
  // SharedCanvas

  utils.cloneMethod(globalAdapter, my, 'getSharedCanvas'); // Font

  globalAdapter.loadFont = function (url) {
    // my.loadFont crash when url is not in user data path
    return "Arial";
  }; // hide show Event


  utils.cloneMethod(globalAdapter, my, 'onShow');
  utils.cloneMethod(globalAdapter, my, 'onHide'); // Accelerometer

  var accelerometerCallback = null;
  var systemInfo = my.getSystemInfoSync();
  var windowWidth = systemInfo.windowWidth;
  var windowHeight = systemInfo.windowHeight;
  var isLandscape = windowWidth > windowHeight;
  Object.assign(globalAdapter, {
    startAccelerometer: function startAccelerometer(cb) {
      accelerometerCallback = cb;
      my.onAccelerometerChange && my.onAccelerometerChange(accelerometerChangeCallback);
    },
    stopAccelerometer: function stopAccelerometer() {
      my.offAccelerometerChange && my.offAccelerometerChange(accelerometerChangeCallback);
    }
  });
}

},{"../../../common/utils":17}]},{},[22]);
