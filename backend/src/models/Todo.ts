import mongoose, { Schema, Document } from 'mongoose';

// Định nghĩa kiểu dữ liệu cho TypeScript
export interface ITodo extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  completed: boolean;
  deadline?: Date;
  category?: string;
  deleted: boolean;
  priority: 'low' | 'medium' | 'high';
  progressText?: string;
  progressPercent: number;
  progressHistory: {
    text: string;
    percent: number;
    date: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Định nghĩa cấu trúc lưu trữ trong MongoDB
const TodoSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    deadline: { type: Date, default: null },
    category: { type: String, default: 'Công việc' },
    deleted: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    progressText: { type: String, default: '' },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    progressHistory: [
      {
        text: String,
        percent: Number,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Tạo và xuất Model
export default mongoose.model<ITodo>('Todo', TodoSchema);