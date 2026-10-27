import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pool } from './config/database.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import blogRoutes from './routes/blog.js';
import catalogRoutes from './routes/catalog.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { requireAdmin } from './middleware/auth.js';
import { uploadDir } from './middleware/upload.js';

const app = express();
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return next(error);
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/uploads', requireAdmin, uploadRoutes);
app.use('/api', catalogRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A record with that name or slug already exists' });
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'The selected parent record does not exist' });

  const status = Number(error.status) || 500;
  if (status >= 500) console.error('API request failed:', error);
  return res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`Vaishnavi Marble API listening on port ${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
