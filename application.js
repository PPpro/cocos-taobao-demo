var System = $global.System;
System.register('no-schema:/application.js', [], function (_export, _context) {
  "use strict";

  var cc, Application;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

  return {
    setters: [],
    execute: function () {
      
var window = $global;
var globalThis = $global;
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


      _export("Application", Application = /*#__PURE__*/function () {
        function Application() {
          _classCallCheck(this, Application);

          this.settingsPath = 'src/settings.json';
          this.showFPS = true;
        }

        _createClass(Application, [{
          key: "init",
          value: function init(engine) {
            cc = engine;
            cc.game.onPostBaseInitDelegate.add(this.onPostInitBase.bind(this));
            cc.game.onPostSubsystemInitDelegate.add(this.onPostSystemInit.bind(this));
          }
        }, {
          key: "onPostInitBase",
          value: function onPostInitBase() {// cc.settings.overrideSettings('assets', 'server', '');
            // do custom logic
          }
        }, {
          key: "onPostSystemInit",
          value: function onPostSystemInit() {// do custom logic
          }
        }, {
          key: "start",
          value: function start() {
            return cc.game.init({
              debugMode: true ? cc.DebugMode.INFO : cc.DebugMode.ERROR,
              settingsPath: this.settingsPath,
              overrideSettings: {
                // assets: {
                //      preloadBundles: [{ bundle: 'main', version: 'xxx' }],
                // }
                profiling: {
                  showFPS: this.showFPS
                }
              }
            }).then(function () {
              return cc.game.run();
            });
          }
        }]);

        return Application;
      }());
    }
  };
});