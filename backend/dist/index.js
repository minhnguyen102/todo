"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const todoRoutes_1 = __importDefault(require("./routes/todoRoutes"));
// Nạp các biến môi trường từ file .env
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ========== MIDDLEWARE ==========
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
})); // Cho phép gọi API từ tên miền khác (như Vue ở cổng 5173)
app.use(express_1.default.json()); // Giúp Express đọc được dữ liệu JSON gửi lên
// ========== DATABASE CONNECTION ==========
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Đã kết nối thành công với MongoDB Atlas'))
    .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));
// ========== ROUTES ==========
app.use('/api/todos', todoRoutes_1.default);
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
