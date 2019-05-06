import Bundler from '../../src/modules/Bundler';
import { uglify } from 'rollup-plugin-uglify';
import path from 'path';
import rimraf from 'rimraf';
import { UserConfig } from '../../src/@types';

describe('Bundler', function () {
    const rootDir = path.resolve(__dirname, '../../');
    let bundler: Bundler = null;

    beforeEach(function() {
        bundler = new Bundler(null, [], '.buildrc.js');
    });

    afterEach(function () {
        rimraf.sync(path.resolve(__dirname, '../../dist'));
        rimraf.sync(path.resolve(__dirname, '../../lib'));
    });

    describe(`#constructor(uglifierPlugin: object | null, otherPlugins: object[], configPath: string)`, function () {
        it(`should create a bundler instance when called`, function () {
            expect(bundler).toBeInstanceOf(Bundler);
        });

        it(`can take a rollup uglifier plugin object as first parameter`, function () {
            expect(new Bundler(uglify(), [], '')).toBeInstanceOf(Bundler);
        });

        it(`should resolve config object and set the uglify option to true if running in
            production mode`, function() {
            process.env.NODE_ENV = 'prod';
            const bundler = new Bundler(null, [], '');

            expect(bundler.getConfig().libConfig.uglify).toBeTruthy();
            expect(bundler.getConfig().distConfig.uglify).toBeTruthy();

            process.env.NODE_ENV = '';
        });

        it(`should resolve config object exclude and include parameters to regex objects`, function() {
            const userConfig: UserConfig = {
                libConfig: {
                    include: [
                        '*',
                        'src/*',
                        /src\/*/
                    ]
                }
            };
            const bundler = new Bundler(null, [], userConfig);
            expect(bundler.getConfig().libConfig.include[0]).toEqual(/.*/);
            expect(bundler.getConfig().libConfig.include[1]).toEqual(/src\/[^\/]+/i);
        });
    });

    describe('#process()', function () {
        it(`should return array of module build objects for the enabled builds`, function () {
            let builds = bundler.process();
            expect(builds.length).toEqual(4);

            expect(typeof builds[0].external()).toEqual('boolean');
            expect(builds).toBeInstanceOf(Array);

            const bundler2 = new Bundler(null, [], {
                distConfig: {
                    enabled: true,
                    uglify: true
                }
            });
            builds = bundler2.process();
            expect(builds.length).toEqual(8);
        });

        it(`should include return array of module build objects for the enabled builds`, function () {
            const builds = bundler.process();
            expect(typeof builds[0].external()).toEqual('boolean');
            expect(builds).toBeInstanceOf(Array);
        });

        it(`should return empty array if no build is enabled`, function () {
            const bundler = new Bundler(null, [], {
                libConfig: {
                    enabled: false
                },
                distConfig: {
                    enabled: false
                }
            });
            const builds = bundler.process();
            expect(builds.length).toEqual(0);
        });

        it(`should return empty array if the include option specifies no matching files or if
        the exclude option excludes all files`, function () {
            const bundler = new Bundler(null, [], {
                libConfig: {
                    include: []
                }
            });
            const builds = bundler.process();
            expect(builds.length).toEqual(0);

            const bundler2 = new Bundler(null, [], {
                libConfig: {
                    exclude: ['*']
                }
            });
            const builds2 = bundler2.process();
            expect(builds2.length).toEqual(0);
        });
    });
});