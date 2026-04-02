import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mở rộng interface Request của Express để chứa userId
export interface AuthRequest extends Request {
  userId?: string;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Không có quyền truy cập, token bị thiếu' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Tóken không hợp lệ hoặc đã hết hạn' });
  }
};
