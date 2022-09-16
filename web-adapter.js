
$global.System.register('no-schema:/web-adapter.js', [], (exports, context) => { return { setters: [], execute () {


  var window = $global;
  var cc = window.cc = window.cc || {};
  var b2 = window.b2 = window.b2 || {};
  var sp = window.sp = window.sp || {};
  var dragonBones = window.dragonBones = window.dragonBones || {};
  var __globalAdapter = window.__globalAdapter = window.__globalAdapter || {};
  var __cocos_require__ = window.__cocos_require__;
  var Image = window.Image;
  var HTMLCanvasElement = window.HTMLCanvasElement;
  var HTMLImageElement = window.HTMLImageElement;
  var ImageBitmap = window.ImageBitmap;
  var document = window.document;
  var DOMParser = window.DOMParser;
  var performance = window.performance;
  var XMLHttpRequest = window.XMLHttpRequest;
  var __extends = window.__extends;
  var __assign = window.__assign;
  var __rest = window.__rest;
  var __decorate = window.__decorate;
  var __param = window.__param;
  var __metadata = window.__metadata;
  var __awaiter = window.__awaiter;
  var __generator = window.__generator;
  var __exportStar = window.__exportStar;
  var __createBinding = window.__createBinding;
  var __values = window.__values;
  var __read = window.__read;
  var __spread = window.__spread;
  var __spreadArrays = window.__spreadArrays;
  var __await = window.__await;
  var __asyncGenerator = window.__asyncGenerator;
  var __asyncDelegator = window.__asyncDelegator;
  var __asyncValues = window.__asyncValues;
  var __makeTemplateObject = window.__makeTemplateObject;
  var __importStar = window.__importStar;
  var __importDefault = window.__importDefault;
  var __classPrivateFieldGet = window.__classPrivateFieldGet;
  var __classPrivateFieldSet = window.__classPrivateFieldSet;(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    "use strict";
    
    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    
    var _HTMLAudioElement2 = _interopRequireDefault(require("./HTMLAudioElement"));
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
    
    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
    
    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }
    
    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
    
    function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }
    
    function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }
    
    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }
    
    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
    
    var HAVE_NOTHING = 0;
    var HAVE_METADATA = 1;
    var HAVE_CURRENT_DATA = 2;
    var HAVE_FUTURE_DATA = 3;
    var HAVE_ENOUGH_DATA = 4;
    var SN_SEED = 1;
    var _innerAudioContextMap = {};
    
    var Audio = /*#__PURE__*/function (_HTMLAudioElement) {
      _inherits(Audio, _HTMLAudioElement);
    
      function Audio(url) {
        var _this;
    
        _classCallCheck(this, Audio);
    
        _this = _possibleConstructorReturn(this, _getPrototypeOf(Audio).call(this));
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
        key: "cloneNode",
        value: function cloneNode() {
          var newAudio = new Audio();
          newAudio.loop = this.loop;
          newAudio.autoplay = this.autoplay;
          newAudio.src = this.src;
          return newAudio;
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
      }]);
    
      return Audio;
    }(_HTMLAudioElement2["default"]);
    
    exports["default"] = Audio;
    
    },{"./HTMLAudioElement":5}],2:[function(require,module,exports){
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
    
    },{"./WindowProperties":14}],3:[function(require,module,exports){
    "use strict";
    
    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    
    var _Node2 = _interopRequireDefault(require("./Node"));
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }
    
    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
    
    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }
    
    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
    
    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    
    var Element = /*#__PURE__*/function (_Node) {
      _inherits(Element, _Node);
    
      function Element() {
        var _this;
    
        _classCallCheck(this, Element);
    
        _this = _possibleConstructorReturn(this, _getPrototypeOf(Element).call(this));
    
        _defineProperty(_assertThisInitialized(_this), "className", '');
    
        _defineProperty(_assertThisInitialized(_this), "children", []);
    
        return _this;
      }
    
      return Element;
    }(_Node2["default"]);
    
    exports["default"] = Element;
    
    },{"./Node":11}],4:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
    
    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
    
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
    
    },{}],5:[function(require,module,exports){
    "use strict";
    
    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    
    var _HTMLElement2 = _interopRequireDefault(require("./HTMLElement"));
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }
    
    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
    
    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }
    
    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
    
    var HTMLAudioElement = /*#__PURE__*/function (_HTMLElement) {
      _inherits(HTMLAudioElement, _HTMLElement);
    
      function HTMLAudioElement() {
        _classCallCheck(this, HTMLAudioElement);
    
        return _possibleConstructorReturn(this, _getPrototypeOf(HTMLAudioElement).call(this, 'audio'));
      }
    
      return HTMLAudioElement;
    }(_HTMLElement2["default"]);
    
    exports["default"] = HTMLAudioElement;
    
    },{"./HTMLElement":7}],6:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    var HTMLCanvasElement = my.createOffscreenCanvas().constructor;
    var _default = HTMLCanvasElement;
    exports["default"] = _default;
    
    },{}],7:[function(require,module,exports){
    "use strict";
    
    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    
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
    
    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
    
    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }
    
    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
    
    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }
    
    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
    
    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    
    var HTMLElement = /*#__PURE__*/function (_Element) {
      _inherits(HTMLElement, _Element);
    
      function HTMLElement() {
        var _this;
    
        var tagName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    
        _classCallCheck(this, HTMLElement);
    
        _this = _possibleConstructorReturn(this, _getPrototypeOf(HTMLElement).call(this));
    
        _defineProperty(_assertThisInitialized(_this), "className", '');
    
        _defineProperty(_assertThisInitialized(_this), "childern", []);
    
        _defineProperty(_assertThisInitialized(_this), "style", {
          width: "".concat(_WindowProperties.innerWidth, "px"),
          height: "".concat(_WindowProperties.innerHeight, "px")
        });
    
        _defineProperty(_assertThisInitialized(_this), "insertBefore", _index.noop);
    
        _defineProperty(_assertThisInitialized(_this), "innerHTML", '');
    
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
      }]);
    
      return HTMLElement;
    }(_Element2["default"]);
    
    exports["default"] = HTMLElement;
    
    },{"./Element":3,"./WindowProperties":14,"./util/index.js":23}],8:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    var screencanvas = $global.screencanvas;
    var HTMLImageElement = screencanvas.createImage().constructor;
    var _default = HTMLImageElement;
    exports["default"] = _default;
    
    },{}],9:[function(require,module,exports){
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
    
    },{}],10:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var ImageBitmap = function ImageBitmap() {// TODO
    
      _classCallCheck(this, ImageBitmap);
    };
    
    exports["default"] = ImageBitmap;
    
    },{}],11:[function(require,module,exports){
    "use strict";
    
    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    
    var _EventTarget2 = _interopRequireDefault(require("./EventTarget.js"));
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
    
    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
    
    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }
    
    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
    
    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }
    
    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
    
    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    
    var Node = /*#__PURE__*/function (_EventTarget) {
      _inherits(Node, _EventTarget);
    
      function Node() {
        var _this;
    
        _classCallCheck(this, Node);
    
        _this = _possibleConstructorReturn(this, _getPrototypeOf(Node).call(this));
    
        _defineProperty(_assertThisInitialized(_this), "childNodes", []);
    
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
    
    },{"./EventTarget.js":4}],12:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var WebGLRenderingContext = function WebGLRenderingContext() {// TODO
    
      _classCallCheck(this, WebGLRenderingContext);
    };
    
    exports["default"] = WebGLRenderingContext;
    
    },{}],13:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
    
    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
    
    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    
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
    
        _defineProperty(this, "binaryType", '');
    
        _defineProperty(this, "bufferedAmount", 0);
    
        _defineProperty(this, "extensions", '');
    
        _defineProperty(this, "onclose", null);
    
        _defineProperty(this, "onerror", null);
    
        _defineProperty(this, "onmessage", null);
    
        _defineProperty(this, "onopen", null);
    
        _defineProperty(this, "protocol", '');
    
        _defineProperty(this, "readyState", 3);
    
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
    
    _defineProperty(WebSocket, "CONNECTING", 0);
    
    _defineProperty(WebSocket, "OPEN", 1);
    
    _defineProperty(WebSocket, "CLOSING", 2);
    
    _defineProperty(WebSocket, "CLOSED", 3);
    
    },{}],14:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ontouchend = exports.ontouchmove = exports.ontouchstart = exports.performance = exports.screen = exports.devicePixelRatio = exports.innerHeight = exports.innerWidth = void 0;
    
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
    
    },{}],15:[function(require,module,exports){
    "use strict";
    
    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    
    var _EventTarget2 = _interopRequireDefault(require("./EventTarget.js"));
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
    
    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
    
    function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }
    
    function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
    
    function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }
    
    function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
    
    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    
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
    
      // TODO 没法模拟 HEADERS_RECEIVED 和 LOADING 两个状态
    
      /*
       * TODO 这一批事件应该是在 XMLHttpRequestEventTarget.prototype 上面的
       */
      function XMLHttpRequest() {
        var _this2;
    
        _classCallCheck(this, XMLHttpRequest);
    
        _this2 = _possibleConstructorReturn(this, _getPrototypeOf(XMLHttpRequest).call(this));
    
        _defineProperty(_assertThisInitialized(_this2), "timeout", 0);
    
        _defineProperty(_assertThisInitialized(_this2), "onabort", null);
    
        _defineProperty(_assertThisInitialized(_this2), "onerror", null);
    
        _defineProperty(_assertThisInitialized(_this2), "onload", null);
    
        _defineProperty(_assertThisInitialized(_this2), "onloadstart", null);
    
        _defineProperty(_assertThisInitialized(_this2), "onprogress", null);
    
        _defineProperty(_assertThisInitialized(_this2), "ontimeout", null);
    
        _defineProperty(_assertThisInitialized(_this2), "onloadend", null);
    
        _defineProperty(_assertThisInitialized(_this2), "onreadystatechange", null);
    
        _defineProperty(_assertThisInitialized(_this2), "readyState", 0);
    
        _defineProperty(_assertThisInitialized(_this2), "response", null);
    
        _defineProperty(_assertThisInitialized(_this2), "responseText", null);
    
        _defineProperty(_assertThisInitialized(_this2), "responseType", '');
    
        _defineProperty(_assertThisInitialized(_this2), "responseXML", null);
    
        _defineProperty(_assertThisInitialized(_this2), "status", 0);
    
        _defineProperty(_assertThisInitialized(_this2), "statusText", '');
    
        _defineProperty(_assertThisInitialized(_this2), "upload", {});
    
        _defineProperty(_assertThisInitialized(_this2), "withCredentials", false);
    
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
    
    _defineProperty(XMLHttpRequest, "UNSEND", 0);
    
    _defineProperty(XMLHttpRequest, "OPENED", 1);
    
    _defineProperty(XMLHttpRequest, "HEADERS_RECEIVED", 2);
    
    _defineProperty(XMLHttpRequest, "LOADING", 3);
    
    _defineProperty(XMLHttpRequest, "DONE", 4);
    
    },{"./EventTarget.js":4}],16:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    var screencanvas = $global.screencanvas;
    var cancelAnimationFrame = screencanvas.cancelAnimationFrame.bind(screencanvas);
    var _default = cancelAnimationFrame;
    exports["default"] = _default;
    
    },{}],17:[function(require,module,exports){
    "use strict";
    
    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.document = void 0;
    
    var _window = _interopRequireWildcard(require("./window"));
    
    var _HTMLElement = _interopRequireDefault(require("./HTMLElement"));
    
    var _Image = _interopRequireDefault(require("./Image"));
    
    var _Canvas = _interopRequireDefault(require("./Canvas"));
    
    var _Audio = _interopRequireDefault(require("./Audio"));
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
    
    function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }
    
    function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
    
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
    exports.document = document;
    
    },{"./Audio":1,"./Canvas":2,"./HTMLElement":7,"./Image":9,"./window":24}],18:[function(require,module,exports){
    "use strict";
    
    function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
    
    var _window = _interopRequireWildcard(require("./window"));
    
    var _document = require("./document");
    
    function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }
    
    function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
    
    var global = $global;
    
    function inject() {
      // 暴露全局的 canvas
      _window.canvas = $global.screencanvas;
      _window.document = _document.document;
    
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
    
    },{"./document":17,"./window":24}],19:[function(require,module,exports){
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
    
    },{}],20:[function(require,module,exports){
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
    
    },{}],21:[function(require,module,exports){
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
    
    },{"./util/index.js":23}],22:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;
    var screencanvas = $global.screencanvas;
    var requestAnimationFrame = screencanvas.requestAnimationFrame.bind(screencanvas);
    var _default = requestAnimationFrame;
    exports["default"] = _default;
    
    },{}],23:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.noop = noop;
    
    function noop() {}
    
    },{}],24:[function(require,module,exports){
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
    Object.defineProperty(exports, "navigator", {
      enumerable: true,
      get: function get() {
        return _navigator2["default"];
      }
    });
    Object.defineProperty(exports, "XMLHttpRequest", {
      enumerable: true,
      get: function get() {
        return _XMLHttpRequest2["default"];
      }
    });
    Object.defineProperty(exports, "WebSocket", {
      enumerable: true,
      get: function get() {
        return _WebSocket2["default"];
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
    Object.defineProperty(exports, "HTMLCanvasElement", {
      enumerable: true,
      get: function get() {
        return _HTMLCanvasElement2["default"];
      }
    });
    Object.defineProperty(exports, "WebGLRenderingContext", {
      enumerable: true,
      get: function get() {
        return _WebGLRenderingContext2["default"];
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
    Object.defineProperty(exports, "requestAnimationFrame", {
      enumerable: true,
      get: function get() {
        return _requestAnimationFrame2["default"];
      }
    });
    Object.defineProperty(exports, "cancelAnimationFrame", {
      enumerable: true,
      get: function get() {
        return _cancelAnimationFrame2["default"];
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
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
          return _WindowProperties[key];
        }
      });
    });
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
    
    },{"./HTMLCanvasElement":6,"./HTMLElement":7,"./HTMLImageElement":8,"./Image":9,"./ImageBitmap":10,"./WebGLRenderingContext":12,"./WebSocket":13,"./WindowProperties":14,"./XMLHttpRequest":15,"./cancelAnimationFrame":16,"./localStorage":19,"./location":20,"./navigator":21,"./requestAnimationFrame":22}]},{},[18]);
    

}}});