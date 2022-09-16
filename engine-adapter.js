$global.System.register('no-schema:/engine-adapter.js', [], (exports, context) => { return { setters: [], execute () {


(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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

},{"./Audio":2}],4:[function(require,module,exports){
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

},{"./Audio":2}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
"use strict";

// NOTE: can't cache file on Taobao iOS end
cc.assetManager.cacheManager.cacheEnabled = cc.sys.os !== cc.sys.OS_IOS;

},{}],8:[function(require,module,exports){
"use strict";

require('./AudioEngine');

require('./AudioSource');

require('./AssetManager');

require('./cache-manager');

require('./Label');

require('./Editbox');

},{"./AssetManager":1,"./AudioEngine":3,"./AudioSource":4,"./Editbox":5,"./Label":6,"./cache-manager":7}]},{},[8]);


}}});