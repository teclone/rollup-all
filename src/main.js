import Bundler from './modules/Bundler';

export default {
    /**
     *@param {Object} [uglifierPlugin=null] - uglifier plugin to use
     *@param {Array} [otherPlugins=[]] - array of other plugins to use. defaults to empty array
     *@param {string} [configPath='.buildrc.json'] - config file location relative url
     *@returns {Array}
    */
    getExports: function (uglifierPlugin, otherPlugins, configPath) {
        const bundler = new Bundler(uglifierPlugin, otherPlugins, configPath);
        return bundler.process();
    }
};