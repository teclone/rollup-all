import Bundler from './modules/Bundler';
export default {
    /**
     * returns array of rollup build objects
     *
     * @param uglifierPlugin the uglifier plugin if uglify is enabled or null if not
     * @param otherPlugins array of other registered plugins
     * @param config string pointing to your project config file or config object. defaults to .buildrc.js
     */
    getExports(uglifierPlugin, otherPlugins, config = '.buildrc.js') {
        const bundler = new Bundler(uglifierPlugin, otherPlugins, config);
        return bundler.process();
    }
};
