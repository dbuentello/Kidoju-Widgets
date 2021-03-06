// Karma configuration
module.exports = config => {
    // Example set of browsers to run on Sauce Labs
    // Check out https://saucelabs.com/platforms for all browser/platform combos
    const customLaunchers = {
        sl_ie_9: {
            base: 'SauceLabs',
            platform: 'Windows 7',
            browserName: 'internet explorer',
            version: '9'
        },
        sl_ie_10: {
            base: 'SauceLabs',
            platform: 'Windows 8',
            browserName: 'internet explorer',
            version: '10'
        },
        sl_ie_11: {
            base: 'SauceLabs',
            platform: 'Windows 8.1',
            browserName: 'internet explorer',
            version: '11'
        },
        sl_chrome_34: {
            base: 'SauceLabs',
            platform: 'Windows 7',
            browserName: 'chrome',
            version: '34'
        },
        sl_firefox_27: {
            base: 'SauceLabs',
            platform: 'Linux',
            browserName: 'firefox',
            version: '27'
        },
        sl_firefox_28: {
            base: 'SauceLabs',
            platform: 'Linux',
            browserName: 'firefox',
            version: '28'
        },
        sl_ios_safari: {
            base: 'SauceLabs',
            platform: 'OS X 10.9',
            browserName: 'iphone',
            version: '7.1'
        },
        sl_android: {
            base: 'SauceLabs',
            platform: 'Linux',
            browserName: 'android',
            version: '4.3'
        }
    };

    config.set({
        // mocha configuration
        client: {
            mocha: {
                ui: 'bdd',
                timeout: 10000
            }
        },

        // saucelabs configuration
        sauceLabs: {
            startConnect: true,
            testName: 'Kidoju.Widgets',
            recordVideo: true,
            recordScreenshots: true
        },

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        // frameworks: ['mocha', 'requirejs', 'chai', 'sinon'],
        frameworks: ['mocha', 'sinon-chai'],

        // list of files / patterns to load in the browser
        // See: http://karma-runner.github.io/0.12/config/files.html
        files: [
            {
                pattern: 'src/styles/vendor/kendo/web/kendo.common.min.css',
                served: true,
                included: true
            },
            {
                pattern: 'src/styles/vendor/kendo/web/kendo.default.min.css',
                served: true,
                included: true
            },
            {
                pattern:
                    'src/styles/vendor/kendo/web/kendo.default.mobile.min.css',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/vendor/jquery/jquery-3.3.1.min.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/vendor/kendo/kendo.all.min.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/window.assert.js',
                served: true,
                included: true
            },
            { pattern: 'src/js/window.log.js', served: true, included: true },
            { pattern: 'src/js/kidoju.data.js', served: true, included: true },
            {
                pattern: 'src/js/kidoju.data.workerlibjs',
                served: true,
                included: false
            },
            { pattern: 'src/js/kidoju.tools.js', served: true, included: true },
            {
                pattern: 'src/js/kidoju.widgets.assetmanager.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.codeeditor.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.codeinput.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.explorer.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.mediaplayer.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.multiinput.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.navigation.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.playbar.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.propertygrid.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.quiz.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.rating.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.stage.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.styleeditor.js',
                served: true,
                included: true
            },
            {
                pattern: 'src/js/kidoju.widgets.toolbox.js',
                served: true,
                included: true
            },
            {
                pattern: 'test/vendor/chai-jquery.js',
                served: true,
                included: true
            },
            {
                pattern: 'test/vendor/jquery.simulate.js',
                served: true,
                included: true
            },
            { pattern: 'test/browsers/*.js', served: true, included: true },
            { pattern: 'src/**/*.*', served: true, included: false },
            { pattern: 'test/data/*.json', served: true, included: false }
        ],

        // list of files to exclude
        exclude: ['/**/Thumbs.db'],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'saucelabs'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        // browsers: ['Chrome', 'IE', 'Safari', 'Firefox', 'PhantomJS'],
        customLaunchers,
        browsers: Object.keys(customLaunchers),

        // Increase timeout in case connection in CI is slow
        captureTimeout: 120000,

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};
