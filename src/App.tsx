import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { exportCsv, parseCsv } from './lib/csv'
import {
  applyRepairs,
  mapColumns,
  profileDataset,
  validateDataset,
  type DataRow,
  type RepairRule,
  type ValidationRule,
} from './lib/dataforge'
import { sampleRows, sampleRules } from './data/sample'
import './styles.css'

const defaultRuleFor = (field: string): ValidationRule[] => {
  const lower = field.toLocaleLowerCase()
  if (lower.includes('email')) return [{ field, kind: 'email' }]
  if (lower.includes('date')) return [{ field, kind: 'date', allowEmpty: true }]
  return []
}

const labelFor = (field: string) =>
  field.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toLocaleUpperCase())

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 34 34" role="img">
        <path d="M7 8.5 17 3l10 5.5v11L17 25 7 19.5v-11Z" />
        <path d="m7 8.5 10 5.6 10-5.6M17 14.1V25" />
      </svg>
    </span>
  )
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<DataRow[]>([])
  const [fields, setFields] = useState<string[]>([])
  const [rules, setRules] = useState<ValidationRule[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [dragging, setDragging] = useState(false)
  const [mappingOpen, setMappingOpen] = useState(false)
  const [mappingDraft, setMappingDraft] = useState<Record<string, string>>({})
  const [mappingError, setMappingError] = useState('')

  const profile = useMemo(() => profileDataset(rows), [rows])
  const issues = useMemo(() => validateDataset(rows, rules), [rows, rules])
  const suggestedRepairs = useMemo<RepairRule[]>(() =>
    profile.reduce<RepairRule[]>((repairs, field) => {
      if (field.type === 'email') repairs.push({ field: field.name, action: 'normalizeEmail' })
      if (field.type === 'number' && field.empty > 0) {
        repairs.push({ field: field.name, action: 'fillEmpty', value: '0' })
      }
      if (field.type === 'text') repairs.push({ field: field.name, action: 'trim' })
      return repairs
    }, []),
  [profile])
  const completeness = profile.length
    ? Math.round((profile.reduce((sum, field) => sum + field.completeness, 0) / profile.length) * 100)
    : 0

  useEffect(() => {
    if (rows.length > 0) {
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
  }, [rows.length])

  const loadRows = (nextRows: DataRow[], nextFields: string[], name: string, nextRules?: ValidationRule[]) => {
    setRows(nextRows)
    setFields(nextFields)
    setFileName(name)
    setRules(nextRules ?? nextFields.flatMap(defaultRuleFor))
    setMappingDraft(Object.fromEntries(nextFields.map((field) => [field, field])))
    setError('')
    setNotice('')
  }

  const loadSample = () => loadRows(sampleRows, Object.keys(sampleRows[0]), 'customer-import.csv', sampleRules)

  const readFile = (file?: File) => {
    if (!file) return
    if (!file.name.toLocaleLowerCase().endsWith('.csv')) {
      setError('Choose a CSV file to continue.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = parseCsv(String(reader.result ?? ''))
      if (result.errors.length) {
        setError(result.errors[0])
        return
      }
      loadRows(result.rows, result.fields, file.name)
    }
    reader.onerror = () => setError('We could not read that file. Please try again.')
    reader.readAsText(file)
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => readFile(event.target.files?.[0])

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    readFile(event.dataTransfer.files[0])
  }

  const applySuggestedFixes = () => {
    const nextRows = applyRepairs(rows, suggestedRepairs)
    setRows(nextRows)
    setNotice(`${suggestedRepairs.length} safe fixes applied. Review the remaining flagged values before export.`)
  }

  const applyMapping = () => {
    const targets = fields.map((field) => mappingDraft[field]?.trim() ?? '')
    if (targets.some((field) => !field)) {
      setMappingError('Every source column needs a target name.')
      return
    }
    if (new Set(targets).size !== targets.length) {
      setMappingError('Target column names must be unique.')
      return
    }

    const mapping = Object.fromEntries(fields.map((field, index) => [field, targets[index]]))
    setRows(mapColumns(rows, mapping))
    setFields(targets)
    setRules(rules.map((rule) => ({ ...rule, field: mapping[rule.field] || rule.field })))
    setMappingDraft(Object.fromEntries(targets.map((field) => [field, field])))
    setMappingOpen(false)
    setMappingError('')
    setNotice('Column mapping applied. Validation rules and preview were updated.')
  }

  const downloadCsv = () => {
    const blob = new Blob([exportCsv(rows, fields)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName.replace(/\.csv$/i, '') + '-clean.csv'
    link.click()
    URL.revokeObjectURL(url)
    setNotice('Clean CSV exported successfully.')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="DataForge home">
          <LogoMark />
          <span>DataForge</span>
          <span className="version">BETA</span>
        </a>
        <div className="header-actions">
          <span className="privacy-pill"><span /> Local processing</span>
          {rows.length > 0 && (
            <button className="button button-ghost" onClick={() => inputRef.current?.click()}>
              Import another file
            </button>
          )}
        </div>
      </header>

      <input ref={inputRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={handleFile} />

      {rows.length === 0 ? (
        <main id="top" className="landing">
          <section className="hero">
            <div className="eyebrow"><span>01</span> Data preparation, without the guesswork</div>
            <h1>Turn messy CSV files into <em>clean, system-ready data.</em></h1>
            <p className="hero-copy">
              Profile, validate, repair, and export operational data in one focused workspace. No scripts. No uploads. No surprises.
            </p>

            <div
              className={`drop-zone ${dragging ? 'is-dragging' : ''}`}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon" aria-hidden="true">↥</div>
              <div>
                <strong>Drop your CSV here</strong>
                <span>or choose a file from your computer</span>
              </div>
              <button className="button button-primary" onClick={() => inputRef.current?.click()}>Choose CSV</button>
            </div>

            {error && <p className="error-banner" role="alert">{error}</p>}

            <div className="hero-actions">
              <button className="text-button" onClick={loadSample}>Load sample data <span>→</span></button>
              <span className="local-note">Your data stays in this browser</span>
            </div>
          </section>

          <section className="feature-strip" aria-label="DataForge capabilities">
            <article><span>01</span><h2>Profile</h2><p>See completeness, field types, and uniqueness instantly.</p></article>
            <article><span>02</span><h2>Validate</h2><p>Catch missing, malformed, and duplicate values.</p></article>
            <article><span>03</span><h2>Repair</h2><p>Apply safe fixes with a clear before-and-after preview.</p></article>
            <article><span>04</span><h2>Export</h2><p>Download a clean file ready for your destination system.</p></article>
          </section>
        </main>
      ) : (
        <main className="workspace">
          <aside className="workspace-nav">
            <p className="nav-label">Workspace</p>
            {['Overview', 'Field profile', 'Quality issues', 'Data preview'].map((item, index) => (
              <a key={item} className={index === 0 ? 'active' : ''} href={`#${item.toLocaleLowerCase().replace(' ', '-')}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>{item}
              </a>
            ))}
            <div className="file-card">
              <span className="file-icon">CSV</span>
              <div><strong>{fileName}</strong><small>{rows.length} records · {fields.length} fields</small></div>
            </div>
          </aside>

          <section className="workspace-main">
            <div className="workspace-heading" id="overview">
              <div>
                <div className="eyebrow"><span>ACTIVE</span> Analysis complete</div>
                <h1>Workspace overview</h1>
                <p>Review data quality, resolve flagged values, and export with confidence.</p>
              </div>
              <button className="button button-primary" onClick={downloadCsv}>Export clean CSV <span>↗</span></button>
            </div>

            {notice && <p className="success-banner" role="status">✓ {notice}</p>}

            <div className="metric-grid">
              <article><span>Rows</span><strong>{rows.length} rows</strong><small>Ready to review</small></article>
              <article><span>Columns</span><strong>{fields.length} columns</strong><small>Structure detected</small></article>
              <article><span>Completeness</span><strong>{completeness}%</strong><small>{profile.reduce((sum, field) => sum + field.empty, 0)} empty cells</small></article>
              <article className="metric-warning"><span>Quality</span><strong>{issues.length} issues</strong><small>Needs attention</small></article>
            </div>

            <div className="dashboard-grid">
              <section className="panel field-panel" id="field-profile">
                <div className="panel-heading"><div><span className="section-number">01</span><h2>Field profile</h2></div><button className="panel-action" onClick={() => setMappingOpen(true)}>Map columns</button></div>
                <div className="field-list">
                  {profile.map((field) => (
                    <div className="field-row" key={field.name}>
                      <div><strong>{labelFor(field.name)}</strong><small>{field.type}</small></div>
                      <div className="completion"><span><i style={{ width: `${field.completeness * 100}%` }} /></span><small>{Math.round(field.completeness * 100)}%</small></div>
                      <small>{field.unique} unique</small>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel issue-panel" id="quality-issues">
                <div className="panel-heading"><div><span className="section-number">02</span><h2>Quality issues</h2></div><span className="issue-count">{issues.length}</span></div>
                <div className="issue-list">
                  {issues.slice(0, 4).map((issue, index) => (
                    <div className="issue-row" key={`${issue.row}-${issue.field}-${issue.code}-${index}`}>
                      <span className={`severity ${issue.code === 'duplicate' ? 'amber' : ''}`}>!</span>
                      <div><strong>{issue.message}</strong><small>Row {issue.row} · {labelFor(issue.field)} · “{issue.value || 'empty'}”</small></div>
                    </div>
                  ))}
                </div>
                <button className="button button-fix" onClick={applySuggestedFixes}>Apply {suggestedRepairs.length} suggested fixes <span>→</span></button>
              </section>
            </div>

            <section className="panel data-panel" id="data-preview">
              <div className="panel-heading"><div><span className="section-number">03</span><h2>Data preview</h2></div><small>Showing all {rows.length} records</small></div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>#</th>{fields.map((field) => <th key={field}>{labelFor(field)}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td>{String(rowIndex + 1).padStart(2, '0')}</td>
                        {fields.map((field) => {
                          const flagged = issues.some((issue) => issue.row === rowIndex + 1 && issue.field === field)
                          return <td key={field} className={flagged ? 'flagged' : ''}>{row[field] || <span className="empty-value">Empty</span>}</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </main>
      )}

      {mappingOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setMappingOpen(false)}>
          <section className="mapping-modal" role="dialog" aria-modal="true" aria-labelledby="mapping-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div><span className="eyebrow"><span>MAP</span> Destination schema</span><h2 id="mapping-title">Map source columns</h2></div>
              <button className="close-button" aria-label="Close mapping" onClick={() => setMappingOpen(false)}>×</button>
            </div>
            <p>Rename columns to match the system receiving this file. DataForge will update the preview and validation rules automatically.</p>
            <div className="mapping-list">
              {fields.map((field) => (
                <label key={field}>
                  <span><small>Source</small><strong>{labelFor(field)}</strong></span>
                  <i aria-hidden="true">→</i>
                  <span className="target-field"><small>Target</small><input aria-label={`Target name for ${labelFor(field)}`} value={mappingDraft[field] ?? field} onChange={(event) => setMappingDraft({ ...mappingDraft, [field]: event.target.value })} /></span>
                </label>
              ))}
            </div>
            {mappingError && <p className="modal-error" role="alert">{mappingError}</p>}
            <div className="modal-actions"><button className="button button-ghost" onClick={() => setMappingOpen(false)}>Cancel</button><button className="button button-primary" onClick={applyMapping}>Apply mapping</button></div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
