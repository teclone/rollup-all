import { createConfig } from '../src';
import { Config } from '../src/@types';

describe('config', function () {
  it(`returns the given options`, function () {
    const options = {};
    expect(createConfig(options as Config)).toEqual(options);
  });
});
