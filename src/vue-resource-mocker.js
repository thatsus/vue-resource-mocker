
import url from 'url';
import Vue from 'vue';

let Response = null;

/**
 * Vue plugin that intercepts vue-resource calls so that custom responses can 
 * be used in testing.
 */

class VueResourceMocker {

    constructor() {
        this.routes = {};
    }

    /**
     * Vue calls this when Vue.use() is called.
     */
    install(Vue) {
        if (!Vue.http) {
            throw "Please install the vue-resource plugin before installing the vue-resource-mocker plugin.";
        }
        Vue.http.interceptors.length = 0;
        Vue.http.interceptors.push((request, next) => {
            if (!Response) {
                Response = request.respondWith(null).constructor;
            }
            let route = this.findRoute(request);
            if (!route) {
                next(request.respondWith('File Not Found', {status: 404}));
            } else {
                let response;
                let pathname = url.parse(request.getUrl(), true, true).pathname;
                let params = this.getParams(route.route, pathname)
                    .map(decodeURIComponent);
                params.unshift(request);
                let closure = route.use
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
    }

    /**
     * Change the routes being mocked
     * @param {Object} routes
     */
    setRoutes(routes) {
        this.routes = this.convertRoutes(routes);
    }

    /**
     * Put all the routes in array format.
     * @param  {Object} routes
     * @return {Object}
     */
    convertRoutes(routes) {
        let converted = {};
        for (let method in routes) {
            if (!(routes[method] instanceof Array)) {
                converted[method] = this.convertRouteSet(routes[method]);
            } else {
                converted[method] = routes[method];
            }
        }
        return converted;
    }

    /**
     * Supports convertRoutes
     * @param  {Object} object
     * @return {Array}
     */
    convertRouteSet(object) {
        let array = [];
        for (let route in object) {
            array.push({
                route: route,
                use: object[route],
            });
        }
        return array;
    }

    /**
     * Given a vue-resource request object, returns a route array or null.
     * @param  {Object} request
     * @return {Array|null}
     */
    findRoute(request) {
        let byMethod = this.routes[request.method];
        if (!byMethod) {
            return null;
        }
        let pathname = url.parse(request.getUrl(), true, true).pathname;
        let match = byMethod.filter((route) => {
            if (route.route && route.route.test && route.route.test(pathname)) {
                return true;
            } else if (route.route && this.stringToRegex(route.route).test(pathname)) {
                return true;
            }
            return false;
        })[0];
        return match || null;
    }

    /**
     * Given a string in the curly-brace wildcard format, returns a RegExp 
     * that matches strings like that.
     * @param  {string} str
     * @return {RegExp}
     */
    stringToRegex(str) {
        return new RegExp('^' + str.replace(/{[^}]*}/g, '(.+)') + '$');
    }

    /**
     * Given a route array and a request path, finds any wildcard matched 
     * parts.
     * @param  {Array} route
     * @param  {string} path
     * @return {Array}
     */
    getParams(route, path) {
        if (!route.test) {
            route = this.stringToRegex(route);
        }
        var matches = path.match(route);
        return matches.slice(1);
    }

    getResponseClass() {
        return Response;
    }
};

module.exports = VueResourceMocker;
