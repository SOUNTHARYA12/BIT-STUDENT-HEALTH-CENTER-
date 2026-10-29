import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bit_health_center_super_secret_jwt_key_2026';

export interface AuthUser {
  id: string;
  email: string;
  register_number: string | null;
  role: 'student' | 'doctor' | 'pharmacy' | 'admin';
  name: string;
  phone: string | null;
  avatar_url: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      register_number: user.register_number,
      role: user.role,
      name: user.name,
      phone: user.phone,
      avatar_url: user.avatar_url,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.bit_auth_token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Verify user still exists and is active in DB
    const dbUser = db.prepare('SELECT id, email, register_number, role, name, phone, avatar_url, status FROM users WHERE id = ?').get(decoded.id) as any;
    if (!dbUser || dbUser.status !== 'active') {
      return res.status(401).json({ error: 'User account is inactive or not found.' });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      register_number: dbUser.register_number,
      role: dbUser.role,
      name: dbUser.name,
      phone: dbUser.phone,
      avatar_url: dbUser.avatar_url,
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires one of [${roles.join(', ')}] role.` });
    }
    next();
  };
}
