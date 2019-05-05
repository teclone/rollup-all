import RollupAll from '../src';

describe('Index', function() {

    describe(`.getExports(uglifierPlugin: object, otherPlugins: object[] = [],
        config: string | UserConfig = '.buildrc.js')`, function() {
        it(`should return array of rollup build objects for the given config options`, function() {
            const builds = RollupAll.getExports(null, []);
            expect(builds).toBeInstanceOf(Array);
        });
    });
});