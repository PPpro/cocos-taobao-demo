var window = $global;var cc = window.cc = window.cc || {};var b2 = window.b2 = window.b2 || {};var sp = window.sp = window.sp || {};var dragonBones = window.dragonBones = window.dragonBones || {};var __globalAdapter = window.__globalAdapter = window.__globalAdapter || {};var __cocos_require__ = window.__cocos_require__;var Image = window.Image;var HTMLCanvasElement = window.HTMLCanvasElement;var HTMLImageElement = window.HTMLImageElement;var ImageBitmap = window.ImageBitmap;var document = window.document;var DOMParser = window.DOMParser;var performance = window.performance;var XMLHttpRequest = window.XMLHttpRequest;var __extends = window.__extends;var __assign = window.__assign;var __rest = window.__rest;var __decorate = window.__decorate;var __param = window.__param;var __metadata = window.__metadata;var __awaiter = window.__awaiter;var __generator = window.__generator;var __exportStar = window.__exportStar;var __createBinding = window.__createBinding;var __values = window.__values;var __read = window.__read;var __spread = window.__spread;var __spreadArrays = window.__spreadArrays;var __await = window.__await;var __asyncGenerator = window.__asyncGenerator;var __asyncDelegator = window.__asyncDelegator;var __asyncValues = window.__asyncValues;var __makeTemplateObject = window.__makeTemplateObject;var __importStar = window.__importStar;var __importDefault = window.__importDefault;var __classPrivateFieldGet = window.__classPrivateFieldGet;var __classPrivateFieldSet = window.__classPrivateFieldSet;
"use strict";

window.boot = function () {
  var settings = window._CCSettings;
  window._CCSettings = undefined;

  var onStart = function onStart() {
    cc.view.enableRetina(true);
    cc.view.resizeWithBrowserSize(true);
    var launchScene = settings.launchScene; // load scene

    cc.director.loadScene(launchScene, null, function () {
      console.log('Success to load scene: ' + launchScene);
    });
  };

  var option = {
    id: 'GameCanvas',
    debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
    showFPS: settings.debug,
    frameRate: 60,
    groupList: settings.groupList,
    collisionMatrix: settings.collisionMatrix
  };
  cc.assetManager.init({
    bundleVers: settings.bundleVers,
    subpackages: settings.subpackages,
    remoteBundles: settings.remoteBundles,
    server: settings.server
  });
  var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
  var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
  var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
  var START_SCENE = cc.AssetManager.BuiltinBundleName.START_SCENE;
  var bundleRoot = [INTERNAL];
  settings.hasResourcesBundle && bundleRoot.push(RESOURCES);
  settings.hasStartSceneBundle && bundleRoot.push(MAIN);
  var count = 0;

  function cb(err) {
    if (err) return console.error(err.message, err.stack);
    count++;

    if (count === bundleRoot.length + 1) {
      // if there is start-scene bundle. should load start-scene bundle in the last stage. 
      // Otherwise the main bundle should be the last
      cc.assetManager.loadBundle(settings.hasStartSceneBundle ? START_SCENE : MAIN, function (err) {
        if (!err) cc.game.run(option, onStart);
      });
    }
  } // load plugins


  cc.assetManager.loadScript(settings.jsList.map(function (x) {
    return 'src/' + x;
  }), cb); // load bundles

  for (var i = 0; i < bundleRoot.length; i++) {
    cc.assetManager.loadBundle(bundleRoot[i], cb);
  }
};