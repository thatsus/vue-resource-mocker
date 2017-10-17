
import VueResourceMocker from '../src/vue-resource-mocker';
import assert from 'assert';
import Vue from 'vue';
import VueResource from 'vue-resource';

Vue.use(VueResource);

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

    it('should not install without vue-resource in place', function () {
        let fakeVue = {
            // no http here
        };
        let caught;
        try {
            new VueResourceMocker().install(fakeVue);
        } catch (e) {
            caught = e;
        }
        assert(caught, "No exception was thrown");
    });

    it('should setRoutes', function () {
        let routes = {GET:[]};
        let mocker = new VueResourceMocker();
        mocker.setRoutes(routes);
        assert.equal(routes.GET, mocker.routes.GET);
    });

    it('should instantiate with no routes', function () {
        let mocker = new VueResourceMocker();
        assert(mocker.routes, 'Has no routes object');
        assert.equal(0, Object.keys(mocker.routes).length);
    });

    it('should convertRoutes to array-style', function () {
        let mocker = new VueResourceMocker();
        let findMe = function(){};
        let routes = mocker.convertRoutes({
            GET: {
                'x': findMe,
            },
        });
        assert(routes.GET instanceof Array, 'not an array: ' + routes.GET);
        assert(routes.GET[0] instanceof Object, 'not an object');
        assert.equal('x', routes.GET[0].route);
        assert.equal(findMe, routes.GET[0].use);
    });

    it('should convertRoutes on setRoutes', function () {
        let mocker = new VueResourceMocker();
        let findMe = function(){};
        mocker.setRoutes({
            GET: {
                'x': findMe,
            },
        });
        assert(mocker.routes.GET instanceof Array);
        // the rest is presumably the same
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
        assert.equal('/endpoint', route.route);
        assert(route instanceof Object);
        assert.equal(findMe, route.use);
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
        assert(route instanceof Object)
        assert.equal(findMe, route.use);
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
        assert(route instanceof Object);
        assert.equal(findMe, route.use);
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
        assert(route instanceof Object);
        assert.equal(findMe, route.use);
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
        assert(route instanceof Object);
        assert.equal(findMe, route.use);
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
        assert(route instanceof Object);
        assert.equal(findMe, route.use);
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

    it('should 500 or something on thrown error', function (done) {
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

    it('should getParams', function () {
        let mocker = new VueResourceMocker();
        let params = mocker.getParams('/endpoint/{id}/{action}/sub/{sub}', '/endpoint/1337/defrag/sub/tree');
        assert(params, 'params is not even a thing');
        assert.equal('1337', params[0]);
        assert.equal('defrag', params[1]);
        assert.equal('tree', params[2]);
    });

    it('should send URL portions as params to closure', function (done) {
        let mocker = new VueResourceMocker();
        let capturedValues = null;
        Vue.use(mocker);
        mocker.setRoutes({
            GET: {
                '/it/{id1}/the/{id2}/of/{id3}': function (request, id1, id2, id3) {
                    capturedValues = [id1, id2, id3];
                    return request.respondWith(`${id1} ${id2} ${id3}`, {status: 200});
                },
            },
        });

        Vue.http.get('/it/was/the/best/of/times?super-duper=1')
            .then(response => {
                assert(response, 'Response is false: ' + response);
                assert.equal('was best times', response.data, 'data is wrong: ' + response.data);
                assert(capturedValues, 'No captured values');
                assert.equal(3, capturedValues.length);
                assert.equal('was', capturedValues[0]);
                assert.equal('best', capturedValues[1]);
                assert.equal('times', capturedValues[2]);
            })
            .then(done, done);
    });

    it('should decode URL params', function (done) {
        let mocker = new VueResourceMocker();
        Vue.use(mocker);
        mocker.setRoutes({
            GET: {
                '/endpoint/{keyword}': function (request, keyword) {
                    return request.respondWith(`${keyword}`, {status: 200});
                },
            },
        });

        Vue.http.get('/endpoint/hat%20trick')
            .then(response => {
                assert(response, 'Response is false: ' + response);
                assert.equal('hat trick', response.data, 'data is wrong: ' + response.data);
            })
            .then(done, done);
    });

    /**
     * This is to test that the response is truly asyncronous by testing that
     * the lines following the request run before the request.
     * As it happens, vue-resource is already doing this.
     * This test remains because if anything ever changes, we'll need to make
     * adjustments
     */
    it('should take time', function (done) {
        let mocker = new VueResourceMocker();
        Vue.use(mocker);
        mocker.setRoutes({
            GET: {
                '/endpoint': function (request) {
                    return request.respondWith('ok', {status: 200});
                },
            },
        });

        // We expect the code flow below to be 1, 2, 3, 4.
        // If it is 1, 2, 4, 3, then it means the `then` closure ran too soon.
        // That's a problem, because in real situations, we expect the code
        // after the `then` chain to run before the `then` ever gets called.
        
        let onThen = function () { // 1. assign onThen to a BAD closure
            assert(false, 'ran too early');
        };

        Vue.http.get('/endpoint')  // 2. call /endpoint
            .then(response => {    // 4. get response and call onThen
                onThen();
            })
            .then(done, done);
                              
        onThen = function () {     // 3. reassign onThen to a do-nothing closure
            // no problem
        };
    });

    it('should get the Response constructor', function (done) {
        let mocker = new VueResourceMocker();
        Vue.use(mocker);
        let getARequest = Promise.resolve().then(() => {
            let request;
            mocker.setRoutes({
                GET: {
                    '/': function (r) {
                        request = r;
                    },
                },
            });

            return Vue.http.get('/')
                .then(() => {
                    return request;
                });
        });
        getARequest
            .then((request) => {
                let response = request.respondWith(null);
                let Response = response.constructor;
                assert.equal(Response, mocker.getResponseClass());
            })
            .then(done, done);
    });

    it('should convert non-response objects to responses', function (done) {
        let mocker = new VueResourceMocker();
        Vue.use(mocker);
        mocker.setRoutes({
            GET: {
                '/endpoint': function (request) {
                    return 'ok';
                },
            },
        });

        Vue.http.get('/endpoint')
            .then((response) => {
                assert(response.ok);
                assert.equal('ok', response.data, 'response does not have ok as data');
            })
            .then(done, done);
    });
});
