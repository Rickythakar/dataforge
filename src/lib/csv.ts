import Papa from 'papaparse'
import type { DataRow } from './dataforge'

export interface CsvParseResult {
  fields: string[]
  rows: DataRow[]
  errors: string[]
}

function normalizeHeader(value: string): string {
  return value.replace(/^\ufeff/, '').trim()
}

export function parseCsv(source: string): CsvParseResult {
  const parsed = Papa.parse<string[]>(source, {
    skipEmptyLines: 'greedy',
  })

  const rawRows = parsed.data
  const fields = (rawRows[0] ?? []).map(normalizeHeader)
  const errors = parsed.errors.map((error) => `Row ${error.row + 1}: ${error.message}`)

  if (fields.length === 0) errors.push('The file must include a header row.')
  if (fields.some((field) => field === '')) errors.push('Every column needs a header.')

  const duplicates = fields.filter((field, index) => fields.indexOf(field) !== index)
  if (duplicates.length > 0) {
    errors.push(`Duplicate headers are not allowed: ${Array.from(new Set(duplicates)).join(', ')}`)
  }

  if (errors.length > 0) return { fields, rows: [], errors }

  const rows = rawRows.slice(1).map((values) =>
    Object.fromEntries(fields.map((field, index) => [field, values[index] ?? ''])),
  )

  return { fields, rows, errors: [] }
}

function escapeCsvValue(value: string): string {
  if (!/[",\r\n]/.test(value)) return value
  return `"${value.replaceAll('"', '""')}"`
}

export function exportCsv(rows: DataRow[], fields: string[]): string {
  return [
    fields.map(escapeCsvValue).join(','),
    ...rows.map((row) => fields.map((field) => escapeCsvValue(row[field] ?? '')).join(',')),
  ].join('\r\n')
}
