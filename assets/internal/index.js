var window = $global;var cc = window.cc = window.cc || {};var b2 = window.b2 = window.b2 || {};var sp = window.sp = window.sp || {};var dragonBones = window.dragonBones = window.dragonBones || {};var __globalAdapter = window.__globalAdapter = window.__globalAdapter || {};var __cocos_require__ = window.__cocos_require__;var Image = window.Image;var HTMLCanvasElement = window.HTMLCanvasElement;var HTMLImageElement = window.HTMLImageElement;var ImageBitmap = window.ImageBitmap;var document = window.document;var DOMParser = window.DOMParser;var performance = window.performance;var XMLHttpRequest = window.XMLHttpRequest;var __extends = window.__extends;var __assign = window.__assign;var __rest = window.__rest;var __decorate = window.__decorate;var __param = window.__param;var __metadata = window.__metadata;var __awaiter = window.__awaiter;var __generator = window.__generator;var __exportStar = window.__exportStar;var __createBinding = window.__createBinding;var __values = window.__values;var __read = window.__read;var __spread = window.__spread;var __spreadArrays = window.__spreadArrays;var __await = window.__await;var __asyncGenerator = window.__asyncGenerator;var __asyncDelegator = window.__asyncDelegator;var __asyncValues = window.__asyncValues;var __makeTemplateObject = window.__makeTemplateObject;var __importStar = window.__importStar;var __importDefault = window.__importDefault;var __classPrivateFieldGet = window.__classPrivateFieldGet;var __classPrivateFieldSet = window.__classPrivateFieldSet;
(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var b = o.split("/");
        b = b[b.length - 1];
        if (!t[b]) {
          var a = "function" == typeof __require && __require;
          if (!u && a) return a(b, !0);
          if (i) return i(b, !0);
          throw new Error("Cannot find module '" + o + "'");
        }
        o = b;
      }
      var f = n[o] = {
        exports: {}
      };
      t[o][0].call(f.exports, function(e) {
        var n = t[o][1][e];
        return s(n || e);
      }, f, f.exports, e, t, n, r);
    }
    return n[o].exports;
  }
  var i = "function" == typeof __require && __require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s;
})({}, {}, []);