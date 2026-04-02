"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoController = void 0;
const todoService_1 = require("../services/todoService");
class TodoController {
    // Lấy tất cả công việc
    static getAllTodos(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const todos = yield todoService_1.TodoService.getAllTodos();
                res.json(todos);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    // Lấy công việc theo ID
    static getTodoById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const todo = yield todoService_1.TodoService.getTodoById(req.params.id);
                if (!todo) {
                    res.status(404).json({ message: 'Không tìm thấy công việc' });
                    return;
                }
                res.json(todo);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    // Tạo công việc mới
    static createTodo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, description, deadline, category, priority, progressText, progressPercent } = req.body;
                if (!title) {
                    res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
                    return;
                }
                const newTodo = yield todoService_1.TodoService.createTodo(title, description, deadline ? new Date(deadline) : undefined, category, priority, progressText, progressPercent);
                res.status(201).json(newTodo);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    // Cập nhật công việc
    static updateTodo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, description, completed, deadline, category, progressText, progressPercent } = req.body;
                const updateData = {};
                if (title !== undefined)
                    updateData.title = title;
                if (description !== undefined)
                    updateData.description = description;
                if (completed !== undefined)
                    updateData.completed = completed;
                if (deadline !== undefined)
                    updateData.deadline = deadline ? new Date(deadline) : null;
                if (category !== undefined)
                    updateData.category = category;
                if (progressText !== undefined)
                    updateData.progressText = progressText;
                if (progressPercent !== undefined)
                    updateData.progressPercent = progressPercent;
                const updatedTodo = yield todoService_1.TodoService.updateTodo(req.params.id, updateData);
                if (!updatedTodo) {
                    res.status(404).json({ message: 'Không tìm thấy công việc' });
                    return;
                }
                res.json(updatedTodo);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    // Xóa công việc
    static deleteTodo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield todoService_1.TodoService.deleteTodo(req.params.id);
                res.json({ message: 'Đã xóa công việc' });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
}
exports.TodoController = TodoController;
