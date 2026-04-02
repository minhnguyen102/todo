import { Request, Response } from 'express';
import { TodoService } from '../services/todoService';

export class TodoController {
  // Lấy tất cả công việc
  static async getAllTodos(req: Request, res: Response): Promise<void> {
    try {
      const todos = await TodoService.getAllTodos();
      res.json(todos);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  // Lấy công việc theo ID
  static async getTodoById(req: Request, res: Response): Promise<void> {
    try {
      const todo = await TodoService.getTodoById(req.params.id as string);
      if (!todo) {
        res.status(404).json({ message: 'Không tìm thấy công việc' });
        return;
      }
      res.json(todo);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  // Tạo công việc mới
  static async createTodo(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, deadline, category, priority, progressText, progressPercent } = req.body;

      if (!title) {
        res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
        return;
      }

      const newTodo = await TodoService.createTodo(
        title,
        description,
        deadline ? new Date(deadline) : undefined,
        category,
        priority,
        progressText,
        progressPercent
      );
      res.status(201).json(newTodo);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Cập nhật công việc
  static async updateTodo(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, completed, deadline, category, progressText, progressPercent } = req.body;
      const updateData: any = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (completed !== undefined) updateData.completed = completed;
      if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
      if (category !== undefined) updateData.category = category;
      if (progressText !== undefined) updateData.progressText = progressText;
      if (progressPercent !== undefined) updateData.progressPercent = progressPercent;

      const updatedTodo = await TodoService.updateTodo(req.params.id as string, updateData);

      if (!updatedTodo) {
        res.status(404).json({ message: 'Không tìm thấy công việc' });
        return;
      }

      res.json(updatedTodo);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Xóa công việc
  static async deleteTodo(req: Request, res: Response): Promise<void> {
    try {
      await TodoService.deleteTodo(req.params.id as string);
      res.json({ message: 'Đã xóa công việc' });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
