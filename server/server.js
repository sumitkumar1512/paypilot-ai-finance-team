import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
import express from 'express'; import cors from 'cors'; import mongoose from 'mongoose'; import routes from './routes/index.js'; import { seedMongo } from './services/seedMongo.js';
import helmet from 'helmet'; import rateLimit from 'express-rate-limit';
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const app = express();
app.use(helmet({contentSecurityPolicy:false}));
app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header are health checks, curl, or server-to-server calls.
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isVercelPreview = /^https:\/\/[-a-z0-9]+\.vercel\.app$/i.test(normalizedOrigin);
    if (allowedOrigins.includes(normalizedOrigin) || isVercelPreview) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${normalizedOrigin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({limit:'1mb', verify:(req,res,buffer)=>{req.rawBody=buffer}})); app.use('/api',rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false})); app.get('/api/health', (_,res)=>res.json({ status:'ok', mode:mongoose.connection.readyState===1?'mongo':'demo' })); app.use('/api',routes);
app.use((error, req, res, next) => { console.error('API request failed:', error); if (res.headersSent) return next(error); const status = error.code === 'LIMIT_FILE_SIZE' ? 400 : (error.status || 500); res.status(status).json({ message: status === 400 ? 'File is too large. Maximum upload size is 5 MB.' : 'The request could not be completed. Please try again.' }); });
if (process.env.MONGO_URI) mongoose.connect(process.env.MONGO_URI).then(async()=>{console.log('MongoDB connected');await seedMongo();}).catch(e=>console.warn('MongoDB unavailable; using demo data:',e.message));
const port = process.env.PORT || 5056; app.listen(port,()=>console.log(`PayPilot API running on http://localhost:${port}`));
