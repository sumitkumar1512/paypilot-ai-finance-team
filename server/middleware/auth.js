import jwt from 'jsonwebtoken';
export const signToken = user => jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'paypilot-demo-secret', { expiresIn: '7d' });
export function requireAuth(req, res, next) { const token = req.headers.authorization?.replace('Bearer ', ''); if (!token) return res.status(401).json({ message: 'Sign in required' }); try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'paypilot-demo-secret'); next(); } catch { res.status(401).json({ message: 'Session expired' }); } }
