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

var onShowCB;
var onHideCB;
App({
  onLaunch: function onLaunch(options) {
    console.info('App onLaunched');

    $global.__cocosCallback = function () {
      require('./polyfills.bundle.js');
      require('./system.bundle.js');
      require('./load-module.js');
      const importMap = require('./src/import-map.js');
      let System = $global.System;
      System.warmup({
        importMap,
        importMapUrl: 'src/import-map.js',
      });
      System.import('./web-adapter.js')
      .then(() => {
        return System.import('cc');
      })
      .then((cc) => {
        return System.import('./engine-adapter.js')
        .then(() => {
          return System.import('./application.js')
          .then(({ Application }) => {
            const application = new Application();
            application.init(cc);
            return application.start();
          });
        });
      })
      .catch((err) => {
        console.error(err);
      });    
    };

    my.onShow = function (cb) {
      onShowCB = cb;
    };

    my.onHide = function (cb) {
      onHideCB = cb;
    };
  },
  onShow: function onShow(options) {
    onShowCB && onShowCB();
  },
  onHide: function onHide(options) {
    onHideCB && onHideCB();
  }
});