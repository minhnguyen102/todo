import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Tạo token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, password, first_name, last_name } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      res.status(400).json({ message: 'Username đã tồn tại' });
      return;
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      first_name,
      last_name,
      username,
      password: hashedPassword,
    });

    if (user) {
      const fullName = (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : user.username;
      res.status(201).json({
        _id: user._id,
        username: user.username,
        fullName,
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password as string))) {
      const fullName = (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : user.username;
      res.json({
        _id: user._id,
        username: user.username,
        fullName,
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(401).json({ message: 'Username hoặc mật khẩu không đúng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};
