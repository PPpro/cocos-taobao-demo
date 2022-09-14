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
var __classPrivateFieldSet = window.__classPrivateFieldSet;
"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var touchstartCB;
var touchcancelCB;
var touchendCB;
var touchmoveCB;

function handleTouchEvent(event) {
  if (my.isIDE) {
    return;
  }

  var changedTouches = event.changedTouches;

  if (changedTouches) {
    var _iterator = _createForOfIteratorHelper(changedTouches),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var touch = _step.value;
        touch.clientX = touch.x;
        touch.clientY = touch.y;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
}

Page({
  onReady: function onReady() {
    my.onTouchStart = function (cb) {
      touchstartCB = cb;
    };

    my.onTouchCancel = function (cb) {
      touchcancelCB = cb;
    };

    my.onTouchEnd = function (cb) {
      touchendCB = cb;
    };

    my.onTouchMove = function (cb) {
      touchmoveCB = cb;
    };

    my.createCanvas({
      id: 'GameCanvas',
      success: function success(canvas) {
        $global.screencanvas = canvas;

        $global.__cocosCallback();
      },
      fail: function fail(err) {
        console.error('failed to init on screen canvas', err);
      }
    });
  },
  onError: function onError(err) {
    console.error('error in page: ', err);
  },
  onTouchStart: function onTouchStart(event) {
    handleTouchEvent(event);
    touchstartCB && touchstartCB(event);
  },
  onTouchCancel: function onTouchCancel(event) {
    handleTouchEvent(event);
    touchcancelCB && touchcancelCB(event);
  },
  onTouchEnd: function onTouchEnd(event) {
    handleTouchEvent(event);
    touchendCB && touchendCB(event);
  },
  onTouchMove: function onTouchMove(event) {
    handleTouchEvent(event);
    touchmoveCB && touchmoveCB(event);
  },
  canvasOnReady: function canvasOnReady() {}
});