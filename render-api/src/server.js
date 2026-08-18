import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'

const app = express()
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map((value) => value.trim())
app.use(helmet())
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); callback(new Error('Not allowed by CORS')) } }))
app.use(express.json({ limit: '20kb' }))

const requestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  phone: { type: String, required: true, trim: true, index: true },
  concern: { type: String, required: true, trim: true, maxlength: 300 },
  host: { type: String, enum: ['Anushka', 'Savikar Sir'], default: 'Anushka', index: true },
  status: { type: String, enum: ['pending', 'done'], default: 'pending', index: true },
  completedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false })
const SupportRequest = mongoose.model('SupportRequest', requestSchema)

function normalisePhone(value = '') { const digits = value.replace(/\D/g, ''); return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits }
function words(value) { return value.trim() ? value.trim().split(/\s+/) : [] }
function adminOnly(req, res, next) { if (!process.env.ADMIN_PASSWORD || req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) return res.status(401).json({ message: 'Unauthorised.' }); next() }

app.get('/health', (_req, res) => res.json({ ok: true }))
app.post('/api/requests', rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false }), async (req, res, next) => {
  try {
    const { name = '', phone = '', concern = '', website = '', host = 'Anushka' } = req.body
    if (website) return res.status(400).json({ message: 'Unable to submit this request.' })
    const cleanName = name.trim().replace(/\s+/g, ' ')
    const cleanPhone = normalisePhone(phone)
    const cleanConcern = concern.trim().replace(/\s+/g, ' ')
    const cleanHost = ['Anushka', 'Savikar Sir'].includes(host) ? host : 'Anushka'
    if (cleanName.length < 2) return res.status(400).json({ message: 'Please enter your name.' })
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) return res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' })
    if (!cleanConcern || words(cleanConcern).length > 15) return res.status(400).json({ message: 'Please keep your discussion topic to 15 words or fewer.' })
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recent = await SupportRequest.exists({ phone: cleanPhone, createdAt: { $gte: cutoff } })
    if (recent) return res.status(429).json({ message: 'You have already joined the Zoom queue recently. Please wait 7 days before joining again.' })
    await SupportRequest.create({ name: cleanName, phone: cleanPhone, concern: cleanConcern, host: cleanHost })
    res.status(201).json({ message: 'You have successfully joined the Zoom queue. Aapki baari aane par hum aapko alert karenge.' })
  } catch (error) { next(error) }
})

app.get('/api/admin/requests', adminOnly, async (req, res, next) => { try { const status = req.query.status === 'done' ? 'done' : 'pending'; const requests = await SupportRequest.find({ status }).sort({ createdAt: 1 }).lean(); res.json(requests) } catch (error) { next(error) } })
app.patch('/api/admin/requests/:id/done', adminOnly, async (req, res, next) => { try { const request = await SupportRequest.findByIdAndUpdate(req.params.id, { status: 'done', completedAt: new Date() }, { new: true }); if (!request) return res.status(404).json({ message: 'Request not found.' }); res.json(request) } catch (error) { next(error) } })
app.patch('/api/admin/requests/:id/undone', adminOnly, async (req, res, next) => { try { const request = await SupportRequest.findByIdAndUpdate(req.params.id, { status: 'pending', completedAt: null }, { new: true }); if (!request) return res.status(404).json({ message: 'Request not found.' }); res.json(request) } catch (error) { next(error) } })
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ message: 'Something went wrong. Please try again later.' }) })

mongoose.connect(process.env.MONGODB_URI).then(() => app.listen(process.env.PORT || 4000, () => console.log('API is running'))).catch((error) => { console.error('Database connection failed:', error); process.exit(1) })
