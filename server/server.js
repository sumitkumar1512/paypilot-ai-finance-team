import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
import express from 'express'; import cors from 'cors'; import mongoose from 'mongoose'; import routes from './routes/index.js'; import { seedMongo } from './services/seedMongo.js';
import helmet from 'helmet'; import rateLimit from 'express-rate-limit';
const app = express(); app.use(helmet({contentSecurityPolicy:false})); app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' })); app.use(express.json({limit:'1mb', verify:(req,res,buffer)=>{req.rawBody=buffer}})); app.use('/api',rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false})); app.get('/api/health', (_,res)=>res.json({ status:'ok', mode:process.env.MONGO_URI?'mongo':'demo' })); app.use('/api',routes);
if (process.env.MONGO_URI) mongoose.connect(process.env.MONGO_URI).then(async()=>{console.log('MongoDB connected');await seedMongo();}).catch(e=>console.warn('MongoDB unavailable; using demo data:',e.message));
const port = process.env.PORT || 5056; app.listen(port,()=>console.log(`PayPilot API running on http://localhost:${port}`));
