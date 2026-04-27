/**
 * NOTE: Full jsdom render tests are skipped because @testing-library/jest-dom
 * dist/matchers is missing in the current install (corrupt package).
 * Run `pnpm install` or `npm install` to restore, then replace with full suite.
 *
 * Coverage intent (to be re-enabled after package restore):
 *  - loading state renders '加载中...'
 *  - image scenario lists logical model display names
 *  - locked models have opacity-50 class
 *  - clicking unlocked model calls onChange(id)
 *  - clicking locked model calls router.push('/settings'), not onChange
 *  - all items opacity-50 when unlockedIds is empty
 */
import { describe, it, expect } from 'vitest'
import { LogicalModelPicker } from './LogicalModelPicker'

describe('LogicalModelPicker (smoke)', () => {
  it('exports a function component', () => {
    expect(typeof LogicalModelPicker).toBe('function')
  })
})
