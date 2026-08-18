import React, { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function formatTime(value) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function Admin() {
  const [password, setPassword] = useState(sessionStorage.getItem('32baarAdminPassword') || '')
  const [draft, setDraft] = useState('')
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('pending')
  const [state, setState] = useState('login')
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('oldest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  async function load(currentPassword = password, currentStatus = status) {
    setState('loading')
    try {
      const response = await fetch(`${API_URL}/admin/requests?status=${currentStatus}`, { headers: { 'x-admin-password': currentPassword } })
      if (!response.ok) throw new Error(response.status === 401 ? 'Incorrect password.' : 'Could not load requests.')
      setRequests(await response.json())
      setState('ready')
    } catch (error) { setState('login'); setMessage(error.message) }
  }

  useEffect(() => { if (password) load() }, [])

  function signIn(event) {
    event.preventDefault()
    sessionStorage.setItem('32baarAdminPassword', draft)
    setPassword(draft)
    setMessage('')
    load(draft)
  }

  async function complete(id) {
    setState('loading')
    try {
      const response = await fetch(`${API_URL}/admin/requests/${id}/done`, { method: 'PATCH', headers: { 'x-admin-password': password } })
      if (!response.ok) throw new Error('Could not update this request.')
      await load()
    } catch (error) { setState('ready'); setMessage(error.message) }
  }

  async function undone(id) {
    setState('loading')
    try {
      const response = await fetch(`${API_URL}/admin/requests/${id}/undone`, { method: 'PATCH', headers: { 'x-admin-password': password } })
      if (!response.ok) throw new Error('Could not update this request.')
      await load()
    } catch (error) { setState('ready'); setMessage(error.message) }
  }

  function switchStatus(next) { setStatus(next); load(password, next) }
  function signOut() { sessionStorage.removeItem('32baarAdminPassword'); setPassword(''); setDraft(''); setRequests([]); setState('login') }
  function clearFilters() { setSearchQuery(''); setDateFrom(''); setDateTo(''); setSortOrder('newest') }

  const filteredRequests = requests
    .filter((r) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.phone || '').includes(q) ||
        (r.concern || '').toLowerCase().includes(q)

      const entryDate = new Date(r.createdAt)
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null
      const to = dateTo ? new Date(dateTo + 'T23:59:59') : null
      const matchesDate = (!from || entryDate >= from) && (!to || entryDate <= to)

      return matchesSearch && matchesDate
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortOrder === 'name') return (a.name || '').localeCompare(b.name || '')
      return 0
    })

  const hasActiveFilters = searchQuery || dateFrom || dateTo || sortOrder !== 'oldest'

  if (!password || state === 'login') return <main className="admin-page"><section className="admin-login">
    <a className="back" href="/">← Back to Zoom queue form</a>
    <div className="brand"><span className="brand-mark">32</span><span className="brand-word">BAAR</span></div>
    <p className="eyebrow">ANUSHKA JI · ZOOM QUEUE</p>
    <h1>Coordinator login</h1>
    <p>View and manage the sequential Zoom queue.</p>
    <form onSubmit={signIn}>
      <label>Access password<input type="password" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Enter your password" required autoFocus /></label>
      {message && <p className="form-error">{message}</p>}
      <button>Open dashboard <span>→</span></button>
    </form>
  </section></main>

  return <main className="admin-page"><section className="dashboard">
    <header className="dashboard-header">
      <div>
        <div className="brand"><span className="brand-mark">32</span><span className="brand-word">BAAR</span></div>
        <p className="eyebrow">ANUSHKA JI · ZOOM QUEUE</p>
        <h1>Zoom queue entries</h1>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button className="refresh-btn" onClick={() => load()} title="Refresh">↻ Refresh</button>
        <button className="sign-out" onClick={signOut}>Sign out</button>
      </div>
    </header>

    <div className="dashboard-controls">
      {/* Tabs + count */}
      <div className="controls-row">
        <div className="tabs">
          <button className={status === 'pending' ? 'active' : ''} onClick={() => switchStatus('pending')}>Pending</button>
          <button className={status === 'done' ? 'active' : ''} onClick={() => switchStatus('done')}>Completed</button>
        </div>
        <span className="entry-count">
          {state === 'loading' ? 'Refreshing…' : `${filteredRequests.length} / ${requests.length} ${status}`}
        </span>
      </div>

      {/* Search */}
      <div className="search-container">
        <input
          className="search-input"
          type="text"
          placeholder="🔍  Search by name, phone, or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sort + Date range */}
      <div className="filter-row">
        <div className="filter-group">
          <label className="filter-label">Sort by</label>
          <select className="filter-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">⬇ Newest first</option>
            <option value="oldest">⬆ Oldest first</option>
            <option value="name">🔤 Name A–Z</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">📅 From</label>
          <input className="filter-select" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>

        <div className="filter-group">
          <label className="filter-label">📅 To</label>
          <input className="filter-select" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>✕ Clear</button>
        )}
      </div>
    </div>

    {message && <p className="form-error">{message}</p>}

    <div className="request-list">
      {state === 'loading' && !requests.length
        ? <p className="empty">Loading queue…</p>
        : filteredRequests.length
          ? filteredRequests.map((request) => (
            <article className="request" key={request._id}>
              <div className="request-main">
                <p className="request-name">{request.name}</p>
                <p className="request-concern">"{request.concern}"</p>
                <div className="request-phone">📱 {request.phone}</div>
                <p className="request-time">📅 {formatTime(request.createdAt)}</p>
              </div>
              <div className="request-actions">
                {status === 'pending'
                  ? <button onClick={() => complete(request._id)}>✓ Done</button>
                  : <button className="undone-btn" onClick={() => undone(request._id)}>↺ Undone</button>
                }
              </div>
            </article>
          ))
          : (
            <div className="empty">
              <div>✦</div>
              <h2>{hasActiveFilters ? 'No results found.' : status === 'pending' ? 'All caught up.' : 'No completed entries yet.'}</h2>
              <p>{hasActiveFilters ? 'Try adjusting your search or date filters.' : status === 'pending' ? 'There are no queue entries waiting right now.' : 'Completed entries will appear here.'}</p>
              {hasActiveFilters && <button className="secondary" onClick={clearFilters} style={{ marginTop: '12px' }}>Clear filters</button>}
            </div>
          )
      }
    </div>
  </section></main>
}
