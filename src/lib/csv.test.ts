import { describe, expect, it } from 'vitest'
import { exportCsv, parseCsv } from './csv'

describe('parseCsv', () => {
  it('parses quoted values, trims headers, and ignores blank lines', () => {
    const csv = '\ufeff Full Name ,Email,Notes\nAda Lovelace,ada@example.com,"Math, machines"\n\n'

    const result = parseCsv(csv)

    expect(result.fields).toEqual(['Full Name', 'Email', 'Notes'])
    expect(result.rows).toEqual([
      { 'Full Name': 'Ada Lovelace', Email: 'ada@example.com', Notes: 'Math, machines' },
    ])
    expect(result.errors).toEqual([])
  })

  it('rejects files with duplicate or missing headers', () => {
    expect(parseCsv('name,name\nAda,Lovelace').errors[0]).toMatch(/duplicate/i)
    expect(parseCsv('name,\nAda,Lovelace').errors[0]).toMatch(/header/i)
  })
})

describe('exportCsv', () => {
  it('creates a downloadable CSV with stable columns and safe escaping', () => {
    const csv = exportCsv(
      [
        { name: 'Ada Lovelace', note: 'Math, machines' },
        { name: 'Grace "Amazing Grace" Hopper', note: 'Compiler\nCOBOL' },
      ],
      ['name', 'note'],
    )

    expect(csv).toBe(
      'name,note\r\nAda Lovelace,"Math, machines"\r\n"Grace ""Amazing Grace"" Hopper","Compiler\nCOBOL"',
    )
  })
})
