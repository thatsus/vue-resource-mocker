
import VueResourceMocker from '../src/vue-resource-mocker';
import assert from 'assert';
import Vue from 'vue';

describe('VueResourceMocker', function () {

    it('should exist', function () {
        assert(VueResourceMocker);
    });

    it('should instantiate', function () {
        assert(new VueResourceMocker());
    });

    it('should install', function () {
        let fakeVue = {
            http: {
                interceptors: [],
            },
        };
        new VueResourceMocker().install(fakeVue);
        assert.equal(1, fakeVue.http.interceptors.length);
    });

    it('should setRoutes', function () {
        let routes = {};
        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        assert.equal(routes, mocker.routes);
    });

    it('should instantiate with no routes', function () {
        let mocker = new VueResourceMocker();
        assert(mocker.routes, 'Has no routes object');
        assert.equal(0, Object.keys(mocker.routes).length);
    });

    it('should findRoute with exact match', function () {
        let findMe = function(){};
        let routes = {
            GET: {
                '/endpoint': findMe,
            },
        };

        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        let route = mocker.findRoute({
            method: 'GET',
            getUrl() { return '/endpoint'; }
        });
        assert.equal(findMe, route);
    });

    it('should not findRoute if method does not exist', function () {
        let routes = {};

        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        let route = mocker.findRoute({
            method: 'GET',
            getUrl() { return '/endpoint'; }
        });
        assert.equal(null, route);
    });

    it('should not findRoute if route does not exist', function () {
        let routes = {
            GET: {}
        };

        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        let route = mocker.findRoute({
            method: 'GET',
            getUrl() { return '/endpoint'; }
        });
        assert.equal(null, route);
    });

    it('should findRoute with regex match', function () {
        let findMe = function(){};
        let routes = {
            GET: [
                {
                    route: /^\/endpoint$/,
                    use: findMe,
                }
            ],
        };

        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        let route = mocker.findRoute({
            method: 'GET',
            getUrl() { return '/endpoint'; }
        });
        assert.equal(findMe, route);
    });

    it('should not findRoute with regex match', function () {
        let routes = {
            GET: [],
        };

        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        let route = mocker.findRoute({
            method: 'GET',
            getUrl() { return '/nothing'; }
        });
        assert.equal(null, route);
    });

    it('should findRoute with array-style exact string match', function () {
        let findMe = function(){};
        let routes = {
            GET: [
                {
                    route: '/endpoint',
                    use: findMe,
                }
            ],
        };

        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        let route = mocker.findRoute({
            method: 'GET',
            getUrl() { return '/endpoint'; }
        });
        assert.equal(findMe, route);
    });

    it('should stringToRegex', function () {
        let mocker = new VueResourceMocker();
        let regex;

        regex = mocker.stringToRegex('/endpoint/{id}/go');
        assert(regex.test('/endpoint/1/go'));
        assert(!regex.test('X/endpoint/1/goY'));

        regex = mocker.stringToRegex('/endpoint/{id/go');
        assert(!regex.test('/endpoint/1/go'));
    });

    it('should findRoute with Laravel-style string match (array)', function () {
        let findMe = function(){};
        let routes = {
            GET: [
                {
                    route: '/endpoint/{id}/go',
                    use: findMe,
                }
            ],
        };

        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        let route = mocker.findRoute({
            method: 'GET',
            getUrl() { return '/endpoint/1/go'; }
        });
        assert.equal(findMe, route);
    });

    it('should findRoute with Laravel-style string match (object)', function () {
        let findMe = function(){};
        let routes = {
            GET: {
                '/endpoint/{id}/go': findMe,
            },
        };

        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        let route = mocker.findRoute({
            method: 'GET',
            getUrl() { return '/endpoint/1/go'; }
        });
        assert.equal(findMe, route);
    });

    it('should findRoute and ignore query params', function () {
        let findMe = function(){};
        let routes = {
            GET: {
                '/endpoint/{id}/go': findMe,
            },
        };

        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        let route = mocker.findRoute({
            method: 'GET',
            getUrl() { return '/endpoint/1/go?x=1'; }
        });
        assert.equal(findMe, route);
    });

    it('should execute route', function (done) {
        let capturedRequest = null;
        let ran = 0;
        let mocker = new VueResourceMocker();
        Vue.use(mocker);
        mocker.setRoutes({
            GET: {
                '/endpoint/{id}/go': function (request) {
                    ran++;
                    capturedRequest = request;
                    return request.respondWith({ok: true}, {status: 200});
                },
            },
        });

        Vue.http.get('/endpoint/1/go?super-duper=1')
            .then(response => {
                assert(response, 'Response is false: ' + response);
                assert.equal(1, ran, 'Did not run route');
                assert.equal('/endpoint/1/go?super-duper=1', capturedRequest.getUrl(), 'Request has odd URL: ' + capturedRequest.getUrl());
                assert.equal(true, response.data.ok, 'Data is not what was returned.');
            })
            .then(done, done);
    });

    it('should 404', function (done) {
        let mocker = new VueResourceMocker();
        Vue.use(mocker);
        mocker.setRoutes({});

        Vue.http.get('/endpoint/1/go?super-duper=1')
            .catch(response => {
                assert(response, 'Response is false: ' + response);
                assert.equal('File Not Found', response.data, 'Wrong response data: ' + response.data);
                assert.equal(404, response.status);
            })
            .then(done, done);
    });

    it.only('should 500 or something on thrown error', function (done) {
        let mocker = new VueResourceMocker();
        Vue.use(mocker);
        mocker.setRoutes({
            GET: {
                '/endpoint/{id}/go': function (request) {
                    throw "Oh no";
                },
            },
        });

        Vue.http.get('/endpoint/1/go?super-duper=1')
            .catch(response => {
                assert(response, 'Response is false: ' + response);
                assert.equal(500, response.status, 'Status is wrong: ' + response.status);
                assert.equal("Oh no", response.data);
            })
            .then(done, done);
    });

    it('should send URL portions as params to closure');
});
