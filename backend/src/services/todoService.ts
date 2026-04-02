import Todo, { ITodo } from '../models/Todo';

export class TodoService {
  // Lấy tất cả công việc của user (loại trừ đã xóa mềm)
  static async getAllTodos(userId: string): Promise<ITodo[]> {
    try {
      return await Todo.find({ userId, deleted: { $ne: true } }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error('Lỗi khi lấy danh sách công việc');
    }
  }

  // Lấy công việc theo ID
  static async getTodoById(userId: string, id: string): Promise<ITodo | null> {
    try {
      return await Todo.findOne({ _id: id, userId, deleted: { $ne: true } });
    } catch (error) {
      throw new Error('Lỗi khi lấy công việc');
    }
  }

  // Tạo công việc mới
  static async createTodo(userId: string, title: string, description?: string, deadline?: Date, category?: string, priority?: string, progressText?: string, progressPercent?: number): Promise<ITodo> {
    try {
      const newTodo = new Todo({
        userId,
        title,
        description,
        deadline,
        category: category || 'Công việc',
        priority: priority || 'medium',
        completed: false,
        progressText: progressText || '',
        progressPercent: progressPercent || 0,
        progressHistory: progressPercent !== undefined ? [{
          text: progressText || '',
          percent: progressPercent,
          date: new Date()
        }] : [],
      });
      return await newTodo.save();
    } catch (error) {
      throw new Error('Lỗi khi tạo công việc');
    }
  }

  // Cập nhật công việc
  static async updateTodo(
    userId: string,
    id: string,
    updateData: {
      title?: string;
      description?: string;
      completed?: boolean;
      deadline?: Date;
      category?: string;
      progressText?: string;
      progressPercent?: number;
    }
  ): Promise<ITodo | null> {
    try {
      // Auto complete logic
      if (updateData.progressPercent === 100) {
        updateData.completed = true;
      }

      const updateQuery: any = { $set: updateData };

      if (updateData.progressPercent !== undefined || updateData.progressText !== undefined) {
        // Fetch current todo to get values if one is missing, but $push doesn't allow easy fallback in one query.
        // It's better to just push what we received, or let the controller provide both.
        // Actually we can just push directly since the controller sets them together typically.
        updateQuery.$push = {
          progressHistory: {
            text: updateData.progressText || '',
            percent: updateData.progressPercent || 0,
            date: new Date(),
          }
        };
      }

      return await Todo.findOneAndUpdate({ _id: id, userId }, updateQuery, { returnDocument: 'after' });
    } catch (error) {
      throw new Error('Lỗi khi cập nhật công việc');
    }
  }

  // Xóa mềm công việc
  static async deleteTodo(userId: string, id: string): Promise<void> {
    try {
      await Todo.findOneAndUpdate({ _id: id, userId }, { deleted: true });
    } catch (error) {
      throw new Error('Lỗi khi xóa công việc');
    }
  }

  // Các hàm lọc (nếu dùng) -> Tạm ẩn hoặc cập nhật luôn
  static async getTodosByStatus(userId: string, completed: boolean): Promise<ITodo[]> {
    try {
      return await Todo.find({ userId, completed, deleted: { $ne: true } }).sort({ deadline: 1 });
    } catch (error) {
      throw new Error('Lỗi khi lọc công việc theo trạng thái');
    }
  }

  // Các hàm lọc khác...
}
