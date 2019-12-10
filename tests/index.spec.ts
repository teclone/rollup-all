import { config } from '../src';

describe('config', function() {
  it(`returns the given options`, function() {
    const options = {};
    expect(config(options)).toEqual(options);
  });
});
