# vue-resource-mocker
Provide mock responses from calls to vue-resource.

# Installation

```bash
npm install vue-resource-mocker --save-dev
```

# Usage

Import VueResourceMocker and VueResource, and instantiate a mocker for Vue.
```js
import Vue from 'vue';
import VueResource from 'vue-resource';
import VueResourceMocker from 'vue-resource-mocker';

Vue.httpMocker = new VueResourceMocker();
Vue.use(Vue.httpMocker);
```

For each test, set the routes that you need.
```js
Vue.httpMocker.setRoutes({
    GET: {
        '/api/users/{id}': function (request) {
            var user = {
                id: 1,
                name: 'Hiro Protagonist',
            };
            return user;
        }
    }
});

Vue.http.get('/api/users/1')
    .then(response => {
        console.log(response.data.name); // => Hiro Protagonist
    });
```

# Routes

The `setRoutes` method accepts an object.

The object should have keys equal to the capitalized form of any verbs your test will need via Vue.http.

Example:
```js
Vue.httpMocker.setRoutes({
    GET: ...,
    POST: ...,
    PATCH: ...
});
```

The values of these verb keys are either arrays or objects.

## Object form

In the object form the keys are URL paths and the values are functions.

Whenever an HTTP request is made the request path is used to match against the URL paths in the routes.

Each function receives the request and may return data to respond to the request. Any value can be returned. For advanced options, return a Response object.

```js
{
    GET: {
        '/api/users', function (request) {
            return [
                {
                    id: 1,
                    name: 'Huck Finn'
                },
                {
                    id: 2,
                    name: 'Tom Sawyer'
                }
            ]);
        }
    }
}
```

If the route path string contains curly-braced portions then those portions are wildcards.

The matching portions of the request path are sent as additional parameters to the function after being decoded from URL form.

If the request path includes a query string it is ignored while matching.

If more than one route matches, the first one is used.

## Array form

In the array form, each element is an object with the keys `route` and `use`. 

Example:

```js
{
    GET: [
        route: '/api/users', 
        use: function (request) {
            return [
                {
                    id: 1,
                    name: 'Huck Finn'
                },
                {
                    id: 2,
                    name: 'Tom Sawyer'
                }
            ];
        }
    ]
}
```

`route` is either a path string or a RegExp object. 

`use` is a function. 

Whenever an HTTP request is made the request path is used to match against the routes.

The `use` function receives the request and may return data to respond to the request. Any value can be returned. For advanced options, return a Response object.

If `route` is a RegExp with parenthesized parts or a string with curly-braced wildcards, the matching portions of the request path are sent as additional parameters to the function after being decoded from URL form.

If the request path includes a query string it is ignored while matching.

If more than one route matches, the first one is used.

# Responses

The return value of a route closure can be any data type. The status will be 200 for regular responses.

For advanced responses, use `request.respondWith(body, options)`. The `body` can be any data type. The `options` parameter is an object with some of the following keys:

 * status - number, required
 * statusText - string
 * url - string
 * headers - object

The `headers` object can have any keys. Its values should be arrays.

# Errors

If the response has a 4xx, 5xx, or 0 status, the Promise returned by Vue.http will be rejected, causing the next catch closure to run.

If no route matches, the Promise is rejected with a 404 File Not Found response.

If a closure throws an error, the Promise is rejected with a 500 response and the thrown value is in the `data` key.

# Changelog

- v1.0.1 - Closures can now return simple data and it will be treated as 200.
