# vue-resource-mocker
Provide mock responses from calls to vue-resource.

# Installation

Add the beta path to your package.json
```json
"devDependencies": {
    "vue-resource-mocker": "thatsus/vue-resource-mocker#beta"
}
```

Install
```bash
npm install
```

# Usage

Import VueResourceMocker and instantiate a mocker for Vue.
```js
import Vue from 'vue';
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
            return request.respondWith(user, {status: 200});
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

Each function receives the request and should return a response built by calling `request.respondWith()`.

```js
{
    GET: {
        '/api/users', function (request) {
            return request.respondWith([
                {
                    id: 1,
                    name: 'Huck Finn'
                },
                {
                    id: 2,
                    name: 'Tom Sawyer'
                }
            ], {status: 200});
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
            return request.respondWith([
                {
                    id: 1,
                    name: 'Huck Finn'
                },
                {
                    id: 2,
                    name: 'Tom Sawyer'
                }
            ], {status: 200});
        }
    ]
}
```

`route` is either a path string or a RegExp object. 

`use` is a function. 

Whenever an HTTP request is made the request path is used to match against the routes.

The `use` function receives the request and should return a response built by calling `request.respondWith()`.

If `route` is a RegExp with parenthesized parts or a string with curly-braced wildcards, the matching portions of the request path are sent as additional parameters to the function after being decoded from URL form.

If the request path includes a query string it is ignored while matching.

If more than one route matches, the first one is used.

# Errors

If the response has a 4xx, 5xx, or 0 status, the Promise returned by Vue.http will be rejected, causing the next catch closure to run.

If no route matches, the Promise is rejected with a 404 File Not Found response.

If a closure throws an error, the Promise is rejected with a 500 response and the thrown value is in the `data` key.

# Troubleshooting

If the response does not have a status given, the status will be 0. This will be an error state.
