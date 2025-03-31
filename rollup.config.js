const { createConfig } = require('./temp');
module.exports = createConfig({
  formats: ['es', 'cjs', 'iife'],
  iife: {
    src: 'src/ex',
    prodBuildSuffix: false,
  },
});
