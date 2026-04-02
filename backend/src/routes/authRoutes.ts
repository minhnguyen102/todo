import { Router } from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/authController';

const router = Router();

router.post('/register', [
  body('first_name').notEmpty().withMessage('Vui lòng nhập Tên (First Name)'),
  body('last_name').notEmpty().withMessage('Vui lòng nhập Họ (Last Name)'),
  body('username').isLength({ min: 4 }).withMessage('Tên đăng nhập (Username) phải có tối thiểu 4 ký tự'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự')
], register);
router.post('/login', login);

export default router;
