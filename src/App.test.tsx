import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('DataForge workflow', () => {
  it('starts with a clear private, local-first import experience', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /turn messy csv files into clean/i })).toBeInTheDocument()
    expect(screen.getByText(/your data stays in this browser/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load sample data/i })).toBeInTheDocument()
  })

  it('profiles sample data and surfaces actionable quality issues', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /load sample data/i }))

    expect(screen.getByRole('heading', { name: /workspace overview/i })).toBeInTheDocument()
    expect(screen.getByText('3 rows')).toBeInTheDocument()
    expect(screen.getByText('4 columns')).toBeInTheDocument()
    expect(screen.getByText('6 issues')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /full name/i })).toBeInTheDocument()
    expect(screen.getByText('not-an-email')).toBeInTheDocument()
  })

  it('applies suggested repairs and updates the issue count', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /load sample data/i }))
    await user.click(screen.getByRole('button', { name: /apply 3 suggested fixes/i }))

    expect(screen.getByText('5 issues')).toBeInTheDocument()
    expect(screen.getByText(/3 safe fixes applied/i)).toBeInTheDocument()
  })

  it('maps source columns to system-ready target names', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /load sample data/i }))
    await user.click(screen.getByRole('button', { name: /map columns/i }))
    await user.clear(screen.getByRole('textbox', { name: /target name for full name/i }))
    await user.type(screen.getByRole('textbox', { name: /target name for full name/i }), 'contact_name')
    await user.click(screen.getByRole('button', { name: /apply mapping/i }))

    expect(screen.getByRole('columnheader', { name: /contact name/i })).toBeInTheDocument()
    expect(screen.getByText(/column mapping applied/i)).toBeInTheDocument()
  })
})
