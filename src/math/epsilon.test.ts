import { describe, expect, test } from 'bun:test';
import { almostEqual, EPSILON } from './epsilon';

describe('almostEqual', () => {
  test('treats identical values as equal', () => {
    expect(almostEqual(1, 1)).toBe(true);
  });

  test('treats values within the default tolerance as equal', () => {
    expect(almostEqual(1, 1 + EPSILON / 2)).toBe(true);
  });

  test('treats values outside the default tolerance as unequal', () => {
    expect(almostEqual(1, 1.001)).toBe(false);
  });

  test('respects a custom tolerance', () => {
    expect(almostEqual(1, 1.001, 0.01)).toBe(true);
  });
});
