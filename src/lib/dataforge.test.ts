import { describe, expect, it } from 'vitest'
import {
  applyRepairs,
  mapColumns,
  profileDataset,
  validateDataset,
  type DataRow,
  type ValidationRule,
} from './dataforge'

const contacts: DataRow[] = [
  { full_name: '  Ada Lovelace ', email: 'ADA@EXAMPLE.COM ', seats: '12', start_date: '2026-01-12' },
  { full_name: 'Grace Hopper', email: 'not-an-email', seats: '', start_date: '2026-02-30' },
  { full_name: '', email: 'ada@example.com', seats: 'eight', start_date: '2026-03-04' },
]

describe('profileDataset', () => {
  it('summarizes completeness, uniqueness, and inferred field types', () => {
    const profile = profileDataset(contacts)

    expect(profile).toEqual([
      expect.objectContaining({ name: 'full_name', type: 'text', filled: 2, unique: 2 }),
      expect.objectContaining({ name: 'email', type: 'email', filled: 3, unique: 3 }),
      expect.objectContaining({ name: 'seats', type: 'number', filled: 2, unique: 2 }),
      expect.objectContaining({ name: 'start_date', type: 'date', filled: 3, unique: 3 }),
    ])
  })
})

describe('validateDataset', () => {
  it('reports actionable issues with row and field locations', () => {
    const rules: ValidationRule[] = [
      { field: 'full_name', kind: 'required' },
      { field: 'email', kind: 'email' },
      { field: 'email', kind: 'unique' },
      { field: 'seats', kind: 'number', allowEmpty: true },
      { field: 'start_date', kind: 'date' },
    ]

    const issues = validateDataset(contacts, rules)

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ row: 2, field: 'email', code: 'invalid_email' }),
        expect.objectContaining({ row: 3, field: 'full_name', code: 'required' }),
        expect.objectContaining({ row: 3, field: 'email', code: 'duplicate' }),
        expect.objectContaining({ row: 3, field: 'seats', code: 'invalid_number' }),
        expect.objectContaining({ row: 2, field: 'start_date', code: 'invalid_date' }),
      ]),
    )
  })
})

describe('applyRepairs', () => {
  it('trims values, normalizes email casing, and fills defaults without mutating input', () => {
    const repaired = applyRepairs(contacts, [
      { field: 'full_name', action: 'trim' },
      { field: 'email', action: 'normalizeEmail' },
      { field: 'seats', action: 'fillEmpty', value: '0' },
    ])

    expect(repaired[0]).toMatchObject({ full_name: 'Ada Lovelace', email: 'ada@example.com', seats: '12' })
    expect(repaired[1].seats).toBe('0')
    expect(contacts[0].full_name).toBe('  Ada Lovelace ')
  })
})

describe('mapColumns', () => {
  it('renames selected columns and preserves unmapped data', () => {
    const mapped = mapColumns(contacts, {
      full_name: 'contact_name',
      start_date: 'onboarding_date',
    })

    expect(mapped[0]).toMatchObject({
      contact_name: '  Ada Lovelace ',
      onboarding_date: '2026-01-12',
      email: 'ADA@EXAMPLE.COM ',
    })
    expect(mapped[0]).not.toHaveProperty('full_name')
  })
})
