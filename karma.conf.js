
var elixir = require('./elixir.js');

var webpackConfig;

elixir(function (mix) {
    webpackConfig = elixir.webpack.config;
});

module.exports = function (config) {
    config.set({
        browsers: ['PhantomJS'],
        frameworks: ['mocha'],
        files: [
            'tests/index.js', 
        ],
        preprocessors: {
            'tests/index.js': ['webpack'],
        },
        webpack: webpackConfig,
        webpackMiddleware: {
            noInfo: true,
        },
        singleRun: true,
    });
};
