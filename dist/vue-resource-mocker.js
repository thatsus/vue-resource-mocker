module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

module.exports = require("qs");

/***/ },
/* 1 */
/***/ function(module, exports) {

module.exports = require("url");

/***/ },
/* 2 */
/***/ function(module, exports) {

module.exports = require("vue");

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_qs__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_qs___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_qs__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_url__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_url___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_url__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_vue__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_vue__);





var Response = null;

/**
 * Vue plugin that intercepts vue-resource calls so that custom responses can 
 * be used in testing.
 */

var VueResourceMocker = function VueResourceMocker() {
    this.routes = {};
};

/**
 * Vue calls this when Vue.use() is called.
 */
VueResourceMocker.prototype.install = function install (Vue) {
        var this$1 = this;

    if (!Vue.http) {
        throw "Please install the vue-resource plugin before installing the vue-resource-mocker plugin.";
    }
    Vue.http.interceptors.length = 0;
    Vue.http.interceptors.push(function (request, next) {
        if (!Response) {
            Response = request.respondWith(null).constructor;
        }
        var route = this$1.findRoute(request);
        if (!route) {
            next(request.respondWith('File Not Found', {status: 404}));
        } else {
            var response;
            var requestUrl = __WEBPACK_IMPORTED_MODULE_1_url___default.a.parse(request.getUrl(), true, true);
            request.query = __WEBPACK_IMPORTED_MODULE_0_qs___default.a.parse(requestUrl.search, {ignoreQueryPrefix: true});
            var params = this$1.getParams(route.route, requestUrl.pathname)
                .map(decodeURIComponent);
            params.unshift(request);
            var closure = route.use
            try {
                response = closure.apply(null, params);
                if (!(response instanceof Response)) {
                    response = request.respondWith(response, {status: 200});
                }
            } catch (e) {
                response = request.respondWith(e, {status: 500});
            }
            next(response);
        }
    });
};

/**
 * Change the routes being mocked
 * @param {Object} routes
 */
VueResourceMocker.prototype.setRoutes = function setRoutes (routes) {
    this.routes = this.convertRoutes(routes);
};

/**
 * Put all the routes in array format.
 * @param  {Object} routes
 * @return {Object}
 */
VueResourceMocker.prototype.convertRoutes = function convertRoutes (routes) {
        var this$1 = this;

    var converted = {};
    for (var method in routes) {
        if (!(routes[method] instanceof Array)) {
            converted[method] = this$1.convertRouteSet(routes[method]);
        } else {
            converted[method] = routes[method];
        }
    }
    return converted;
};

/**
 * Supports convertRoutes
 * @param  {Object} object
 * @return {Array}
 */
VueResourceMocker.prototype.convertRouteSet = function convertRouteSet (object) {
    var array = [];
    for (var route in object) {
        array.push({
            route: route,
            use: object[route],
        });
    }
    return array;
};

/**
 * Given a vue-resource request object, returns a route array or null.
 * @param  {Object} request
 * @return {Array|null}
 */
VueResourceMocker.prototype.findRoute = function findRoute (request) {
        var this$1 = this;

    var byMethod = this.routes[request.method];
    if (!byMethod) {
        return null;
    }
    var pathname = __WEBPACK_IMPORTED_MODULE_1_url___default.a.parse(request.getUrl(), true, true).pathname;
    var match = byMethod.filter(function (route) {
        if (route.route && route.route.test && route.route.test(pathname)) {
            return true;
        } else if (route.route && this$1.stringToRegex(route.route).test(pathname)) {
            return true;
        }
        return false;
    })[0];
    return match || null;
};

/**
 * Given a string in the curly-brace wildcard format, returns a RegExp 
 * that matches strings like that.
 * @param  {string} str
 * @return {RegExp}
 */
VueResourceMocker.prototype.stringToRegex = function stringToRegex (str) {
    return new RegExp('^' + str.replace(/{[^}]*}/g, '(.+)') + '$');
};

/**
 * Given a route array and a request path, finds any wildcard matched 
 * parts.
 * @param  {Array} route
 * @param  {string} path
 * @return {Array}
 */
VueResourceMocker.prototype.getParams = function getParams (route, path) {
    if (!route.test) {
        route = this.stringToRegex(route);
    }
    var matches = path.match(route);
    return matches.slice(1);
};

VueResourceMocker.prototype.getResponseClass = function getResponseClass () {
    return Response;
};;

module.exports = VueResourceMocker;


/***/ }
/******/ ]);
//# sourceMappingURL=vue-resource-mocker.js.map