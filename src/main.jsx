import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import Admin from './Admin.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const TRANSLATIONS = {
  hindlish: {
    eyebrow: "ZOOM MEET QUEUE",
    titleLine1: "Zoom Par Baat Karein.",
    titleLine2: "Apni baari ka intezaar karein.",
    intro: "Anushka aur Savikar sir se baat karne ke liye queue join karein. Jab aapki baari aayegi, hum aapko Add karenge.",
    sequentialQueue: "Sequential queue",
    weeklyLimit: "Har 7 din me ek baar request",
    cardTitle: "Zoom Queue Join Karein",
    labelName: "Aapka naam",
    placeholderName: "Apna pura naam likhein",
    labelPhone: "WhatsApp number",
    placeholderPhone: "10-digit mobile number",
    labelDiscuss: "Aap kis baare me baat karna chahte hain?",
    noteKeepShort: "Chhota likhein",
    placeholderDiscuss: "Example: Weight loss consistency par baat karni hai",
    btnSubmit: "Zoom Queue Join Karein",
    btnSending: "Queue me shaamil ho rahe hain...",
    privacy: "Submit karke, aap agree karte hain ki hum aapko Zoom par Add karein jab aapki baari ho.",
    successLabel: "QUEUE ME ADD HO GAYE",
    successTitle: "Aap queue me hain!",
    successText: "Aapki baari aane par hum aapko add karenge.",
    successReset: "Dobara queue join karein"
  },
  english: {
    eyebrow: "ZOOM MEET QUEUE",
    titleLine1: "Talk on Zoom.",
    titleLine2: "Connect in sequence.",
    intro: "Join the sequence queue to speak with Anushka or Savikar sir. We will add you when your turn is.",
    sequentialQueue: "Sequential queue",
    weeklyLimit: "One request every 7 days",
    cardTitle: "Join Zoom Queue",
    labelName: "Your name",
    placeholderName: "Enter your full name",
    labelPhone: "WhatsApp number",
    placeholderPhone: "10-digit mobile number",
    labelDiscuss: "What would you like to discuss?",
    noteKeepShort: "Keep it short",
    placeholderDiscuss: "Example: Discussing weight loss consistency",
    btnSubmit: "Join Zoom Queue",
    btnSending: "Joining queue...",
    privacy: "By submitting, you agree to join the queue. We will add you when it is your turn.",
    successLabel: "QUEUED SUCCESSFULLY",
    successTitle: "You're in the queue!",
    successText: "We will add you when your turn is near.",
    successReset: "Join queue again"
  }
}

function wordCount(value) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

function App() {
  const [lang, setLang] = useState('hindlish')
  const [form, setForm] = useState({ name: '', phone: '', concern: '', website: '' })
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')
  const words = wordCount(form.concern)
  const t = TRANSLATIONS[lang]

  function updateField(event) {
    const { name, value } = event.target
    if (name === 'concern' && wordCount(value) > 15) return
    if (name === 'phone') {
      setForm((current) => ({ ...current, phone: value.replace(/[^\d+\s-]/g, '') }))
      return
    }
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setState('sending')
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.')
      setState('success')
      setMessage(data.message)
      setForm({ name: '', phone: '', concern: '', website: '' })
    } catch (error) {
      setState('error')
      setMessage(error.message)
    }
  }

  return <main className="page-shell">
    <div className="lang-toggle-container">
      <button className={`lang-btn ${lang === 'hindlish' ? 'active' : ''}`} onClick={() => setLang('hindlish')}>Hindlish</button>
      <button className={`lang-btn ${lang === 'english' ? 'active' : ''}`} onClick={() => setLang('english')}>English</button>
    </div>
    <div className="texture texture-left" /><div className="texture texture-right" />
    <section className="hero">
      <div className="brand"><span className="brand-mark">32</span><span className="brand-word">BAAR</span></div>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1>{t.titleLine1}<br /><em>{t.titleLine2}</em></h1>
      <p className="intro">{t.intro}</p>
      <div className="trust-row"><span>✦ {t.sequentialQueue}</span><span>✦ {t.weeklyLimit}</span></div>
    </section>

    <section className="form-card" aria-labelledby="form-title">
      {state === 'success' ? <Success message={message} reset={() => setState('idle')} t={t} /> : <>
        <div className="card-heading"><span className="leaf">❋</span><div><p className="tiny-label">BBC FAMILY</p><h2 id="form-title">{t.cardTitle}</h2></div></div>
        <form onSubmit={submit}>
          <label>{t.labelName}<input name="name" value={form.name} onChange={updateField} maxLength="60" placeholder={t.placeholderName} required autoComplete="name" /></label>
          <label>{t.labelPhone}<input name="phone" value={form.phone} onChange={updateField} inputMode="tel" placeholder={t.placeholderPhone} required autoComplete="tel" /></label>
          <label>{t.labelDiscuss}<span className="field-note">{t.noteKeepShort} — {words}/15 words</span>
            <textarea name="concern" value={form.concern} onChange={updateField} placeholder={t.placeholderDiscuss} required rows="3" />
          </label>
          <input className="honeypot" name="website" value={form.website} onChange={updateField} tabIndex="-1" autoComplete="off" aria-hidden="true" />
          {state === 'error' && <p className="form-error" role="alert">{message}</p>}
          <button disabled={state === 'sending'}>{state === 'sending' ? t.btnSending : t.btnSubmit} <span>→</span></button>
        </form>
        <p className="privacy">{t.privacy}</p>
      </>}
    </section>
    <footer>Jai 32 Baar <span>•</span> One small step, every day.</footer>
  </main>
}

function Success({ message, reset, t }) {
  return <div className="success">
    <div className="success-icon">✓</div><p className="tiny-label">{t.successLabel}</p><h2>{t.successTitle}</h2>
    <p>{message || t.successText}</p><p className="jai">Jai 32 Baar!</p>
    <button className="secondary" onClick={reset}>{t.successReset}</button>
  </div>
}

createRoot(document.getElementById('root')).render(window.location.pathname === '/admin' ? <Admin /> : <App />)
