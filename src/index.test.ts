import { describe, expect, test } from 'bun:test';
import { VERSION } from './index';

describe('VERSION', () => {
  test('is a non-empty semver-like string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
