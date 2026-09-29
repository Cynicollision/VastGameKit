const webpackConfig = require('./webpack.config');
const env = (process.env.NODE_ENV || 'development');

module.exports = function (config) {
    config.set({
        basePath: '',
        files: [
            'test/**/*.spec.ts'
        ],
        frameworks: ['jasmine'],
        exclude: [
            'node_modules',
        ],
        preprocessors: {
            'test/**/*.ts': ['webpack']
        },
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['ChromeHeadlessAudio'],
        customLaunchers: {
            // lets audio tests start audio without a user gesture.
            ChromeHeadlessAudio: {
                base: 'ChromeHeadless',
                flags: ['--autoplay-policy=no-user-gesture-required'],
            },
        },
        singleRun: env !== 'development',
        concurrency: Infinity,
        webpack: {
            mode: 'development',
            module: webpackConfig.module,
            resolve: webpackConfig.resolve
        },
    });
};