var gulp = require('gulp');

var elixir = require('./elixir.js');


elixir.ready(function () {
  elixir.webpack.mergeConfig({
    output: {
      libraryTarget: 'commonjs',
    },
  });
});

elixir(function (mix) {
    mix.webpack('vue-resource-mocker.js', './dist', './src');
});

