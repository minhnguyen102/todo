import Todo, { ITodo } from '../models/Todo';

export class TodoService {
  // Lấy tất cả công việc (loại trừ đã xóa mềm)
  static async getAllTodos(): Promise<ITodo[]> {
    try {
      return await Todo.find({ deleted: { $ne: true } }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error('Lỗi khi lấy danh sách công việc');
    }
  }

  // Lấy công việc theo ID
  static async getTodoById(id: string): Promise<ITodo | null> {
    try {
      return await Todo.findOne({ _id: id, deleted: { $ne: true } });
    } catch (error) {
      throw new Error('Lỗi khi lấy công việc');
    }
  }

  // Tạo công việc mới
  static async createTodo(title: string, description?: string, deadline?: Date, category?: string, priority?: string, progressText?: string, progressPercent?: number): Promise<ITodo> {
    try {
      const newTodo = new Todo({
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
        updateQuery.$push = {
          progressHistory: {
            text: updateData.progressText || '',
            percent: updateData.progressPercent || 0,
            date: new Date(),
          }
        };
      }

      return await Todo.findOneAndUpdate({ _id: id }, updateQuery, { returnDocument: 'after' });
    } catch (error) {
      throw new Error('Lỗi khi cập nhật công việc');
    }
  }

  // Xóa mềm công việc
  static async deleteTodo(id: string): Promise<void> {
    try {
      await Todo.findOneAndUpdate({ _id: id }, { deleted: true });
    } catch (error) {
      throw new Error('Lỗi khi xóa công việc');
    }
  }

  // Các hàm lọc (nếu dùng)
  static async getTodosByStatus(completed: boolean): Promise<ITodo[]> {
    try {
      return await Todo.find({ completed, deleted: { $ne: true } }).sort({ deadline: 1 });
    } catch (error) {
      throw new Error('Lỗi khi lọc công việc theo trạng thái');
    }
  }
}
