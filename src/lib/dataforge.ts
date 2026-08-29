export type DataValue = string
export type DataRow = Record<string, DataValue>

export type FieldType = 'text' | 'email' | 'number' | 'date'

export interface FieldProfile {
  name: string
  type: FieldType
  filled: number
  empty: number
  unique: number
  completeness: number
}

export type ValidationRule =
  | { field: string; kind: 'required' }
  | { field: string; kind: 'email'; allowEmpty?: boolean }
  | { field: string; kind: 'unique'; allowEmpty?: boolean }
  | { field: string; kind: 'number'; allowEmpty?: boolean }
  | { field: string; kind: 'date'; allowEmpty?: boolean }

export interface ValidationIssue {
  row: number
  field: string
  code: 'required' | 'invalid_email' | 'duplicate' | 'invalid_number' | 'invalid_date'
  value: string
  message: string
}

export type RepairRule =
  | { field: string; action: 'trim' }
  | { field: string; action: 'normalizeEmail' }
  | { field: string; action: 'fillEmpty'; value: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const numberPattern = /^-?(?:\d+\.?\d*|\.\d+)$/
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/

function isValidDate(value: string): boolean {
  const match = value.match(datePattern)
  if (!match) return false

  const [, year, month, day] = match.map(Number)
  const candidate = new Date(Date.UTC(year, month - 1, day))
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  )
}

function inferFieldType(values: string[]): FieldType {
  const populated = values.map((value) => value.trim()).filter(Boolean)
  if (populated.length === 0) return 'text'

  const shareMatching = (predicate: (value: string) => boolean) =>
    populated.filter(predicate).length / populated.length

  if (shareMatching((value) => emailPattern.test(value)) >= 0.6) return 'email'
  if (shareMatching((value) => isValidDate(value)) >= 0.6) return 'date'
  if (shareMatching((value) => numberPattern.test(value)) >= 0.5) return 'number'
  return 'text'
}

export function profileDataset(rows: DataRow[]): FieldProfile[] {
  const fields = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))

  return fields.map((name) => {
    const values = rows.map((row) => row[name] ?? '')
    const populated = values.filter((value) => value.trim() !== '')

    return {
      name,
      type: inferFieldType(values),
      filled: populated.length,
      empty: rows.length - populated.length,
      unique: new Set(populated.map((value) => value.trim())).size,
      completeness: rows.length === 0 ? 0 : populated.length / rows.length,
    }
  })
}

export function validateDataset(rows: DataRow[], rules: ValidationRule[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const rule of rules) {
    const seen = new Set<string>()

    rows.forEach((row, index) => {
      const value = row[rule.field] ?? ''
      const normalized = value.trim()
      const rowNumber = index + 1

      if (rule.kind === 'required' && normalized === '') {
        issues.push({
          row: rowNumber,
          field: rule.field,
          code: 'required',
          value,
          message: `${rule.field} is required`,
        })
        return
      }

      if ('allowEmpty' in rule && rule.allowEmpty && normalized === '') return

      if (rule.kind === 'email' && !emailPattern.test(normalized)) {
        issues.push({
          row: rowNumber,
          field: rule.field,
          code: 'invalid_email',
          value,
          message: `Use a valid email address`,
        })
      }

      if (rule.kind === 'number' && !numberPattern.test(normalized)) {
        issues.push({
          row: rowNumber,
          field: rule.field,
          code: 'invalid_number',
          value,
          message: `Use a numeric value`,
        })
      }

      if (rule.kind === 'date' && !isValidDate(normalized)) {
        issues.push({
          row: rowNumber,
          field: rule.field,
          code: 'invalid_date',
          value,
          message: `Use a real date in YYYY-MM-DD format`,
        })
      }

      if (rule.kind === 'unique' && normalized !== '') {
        const key = normalized.toLocaleLowerCase()
        if (seen.has(key)) {
          issues.push({
            row: rowNumber,
            field: rule.field,
            code: 'duplicate',
            value,
            message: `${rule.field} must be unique`,
          })
        }
        seen.add(key)
      }
    })
  }

  return issues.sort((a, b) => a.row - b.row || a.field.localeCompare(b.field))
}

export function applyRepairs(rows: DataRow[], repairs: RepairRule[]): DataRow[] {
  return rows.map((source) => {
    const row = { ...source }

    for (const repair of repairs) {
      const value = row[repair.field] ?? ''

      if (repair.action === 'trim') row[repair.field] = value.trim()
      if (repair.action === 'normalizeEmail') row[repair.field] = value.trim().toLocaleLowerCase()
      if (repair.action === 'fillEmpty' && value.trim() === '') row[repair.field] = repair.value
    }

    return row
  })
}

export function mapColumns(rows: DataRow[], mapping: Record<string, string>): DataRow[] {
  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([field, value]) => [mapping[field] || field, value])),
  )
}
