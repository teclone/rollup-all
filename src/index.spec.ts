import { createConfig } from '.';
import { Config } from './@types';

describe('config', function () {
  it(`returns the given options`, function () {
    const options = {};
    expect(createConfig(options as Config)).toEqual(options);
  });
});
