import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import todoRoutes from './routes/todoRoutes';

// Nạp các biến môi trường từ file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(cors({
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // Cho phép gọi API từ tên miền khác (như Vue ở cổng 5173)
app.use(express.json()); // Giúp Express đọc được dữ liệu JSON gửi lên

// ========== DATABASE CONNECTION ==========
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('✅ Đã kết nối thành công với MongoDB Atlas'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// ========== ROUTES ==========
app.use('/api/todos', todoRoutes);

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ========== ERROR HANDLING ==========
app.use((req, res) => {
  res.status(404).json({ message: 'Route không tìm thấy' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 Máy chủ đang chạy tại http://localhost:${PORT}`);
});