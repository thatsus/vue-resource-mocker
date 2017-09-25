
import url from 'url';
import Vue from 'vue';
import VueResource from 'vue-resource';

Vue.use(VueResource);

class VueResourceMocker {

    constructor() {
        this.routes = {};
    }

    install(Vue) {
        Vue.http.interceptors.length = 0;
        Vue.http.interceptors.push((request, next) => {
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
                } catch (e) {
                    response = request.respondWith(e, {status: 500});
                }
                next(response);
            }
        });
    }

    setRoutes(routes) {
        this.routes = this.convertRoutes(routes);
    }

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

    stringToRegex(str) {
        return new RegExp('^' + str.replace(/{[^}]*}/g, '(.+)') + '$');
    }

    getParams(route, path) {
        if (!route.test) {
            route = this.stringToRegex(route);
        }
        var matches = path.match(route);
        return matches.slice(1);
    }
};

module.exports = VueResourceMocker;
