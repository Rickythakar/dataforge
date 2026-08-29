import type { DataRow, ValidationRule } from '../lib/dataforge'

export const sampleRows: DataRow[] = [
  { full_name: '  Ada Lovelace ', email: 'ADA@EXAMPLE.COM ', seats: '12', start_date: '2026-01-12' },
  { full_name: 'Grace Hopper', email: 'not-an-email', seats: '', start_date: '2026-02-30' },
  { full_name: '', email: 'ada@example.com', seats: 'eight', start_date: '2026-03-04' },
]

export const sampleRules: ValidationRule[] = [
  { field: 'full_name', kind: 'required' },
  { field: 'email', kind: 'email' },
  { field: 'email', kind: 'unique' },
  { field: 'seats', kind: 'number' },
  { field: 'start_date', kind: 'date' },
]

