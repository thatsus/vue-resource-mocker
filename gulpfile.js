var gulp = require('gulp');

var elixir = require('./elixir.js');


elixir.ready(function () {
  elixir.webpack.mergeConfig({
    output: {
      libraryTarget: 'commonjs2',
    },
    externals: {
        'url': 'url',
        'vue': 'vue',
        'vue-resource': 'vue-resource'
    }
  });
});

elixir(function (mix) {
    mix.webpack('vue-resource-mocker.js', './dist', './src');
});

