import { describe, expect, it } from 'vitest'
import routerOptions from '~/router.options'
import { routes } from '~/routes'

describe('router.options', () => {
  it('memakai daftar rute manual dari routes.ts', () => {
    expect(routerOptions.routes()).toBe(routes)
  })
})
