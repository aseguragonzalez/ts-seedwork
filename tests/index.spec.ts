import { SEEDWORK_VERSION } from '../src/index.js';

describe('seedwork', () => {
  it('exports SEEDWORK_VERSION', () => {
    expect(SEEDWORK_VERSION).toBeDefined();
    expect(typeof SEEDWORK_VERSION).toBe('string');
  });
});
