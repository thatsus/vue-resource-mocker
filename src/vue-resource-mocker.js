
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
                try {
                    response = route(request);
                } catch (e) {
                    response = request.respondWith(e, {status: 500});
                }
                next(response);
            }
        });
    }

    setRoutes(routes) {
        this.routes = routes;
    }

    findRoute(request) {
        let byMethod = this.routes[request.method];
        if (!byMethod) {
            return null;
        }
        let pathname = url.parse(request.getUrl(), true, true).pathname;
        if (byMethod instanceof Array) {
            return this.findRouteInArray(pathname, byMethod);
        } else {
            return this.findRouteInObject(pathname, byMethod);
        }
    }

    findRouteInArray(pathname, array) {
        let match = array.filter((route) => {
            if (route.route && route.route.test && route.route.test(pathname)) {
                return true;
            } else if (route.route && this.stringToRegex(route.route).test(pathname)) {
                return true;
            }
            return false;
        })[0];
        if (match) {
            return match.use;
        }
        return null;
    }

    findRouteInObject(pathname, object) {
        let matchKey = Object.keys(object).filter((route) => {
            return this.stringToRegex(route).test(pathname);
        })[0];
        return object[matchKey] || null;
    }

    stringToRegex(str) {
        return new RegExp('^' + str.replace(/{[^}]*}/, '.+') + '$');
    }
};

module.exports = VueResourceMocker;
