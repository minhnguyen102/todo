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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoService = void 0;
const Todo_1 = __importDefault(require("../models/Todo"));
class TodoService {
    // Lấy tất cả công việc (loại trừ đã xóa mềm)
    static getAllTodos() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Todo_1.default.find({ deleted: { $ne: true } }).sort({ createdAt: -1 });
            }
            catch (error) {
                throw new Error('Lỗi khi lấy danh sách công việc');
            }
        });
    }
    // Lấy công việc theo ID
    static getTodoById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Todo_1.default.findOne({ _id: id, deleted: { $ne: true } });
            }
            catch (error) {
                throw new Error('Lỗi khi lấy công việc');
            }
        });
    }
    // Tạo công việc mới
    static createTodo(title, description, deadline, category, priority, progressText, progressPercent) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newTodo = new Todo_1.default({
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
                return yield newTodo.save();
            }
            catch (error) {
                throw new Error('Lỗi khi tạo công việc');
            }
        });
    }
    // Cập nhật công việc
    static updateTodo(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Auto complete logic
                if (updateData.progressPercent === 100) {
                    updateData.completed = true;
                }
                const updateQuery = { $set: updateData };
                if (updateData.progressPercent !== undefined || updateData.progressText !== undefined) {
                    updateQuery.$push = {
                        progressHistory: {
                            text: updateData.progressText || '',
                            percent: updateData.progressPercent || 0,
                            date: new Date(),
                        }
                    };
                }
                return yield Todo_1.default.findOneAndUpdate({ _id: id }, updateQuery, { returnDocument: 'after' });
            }
            catch (error) {
                throw new Error('Lỗi khi cập nhật công việc');
            }
        });
    }
    // Xóa mềm công việc
    static deleteTodo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Todo_1.default.findOneAndUpdate({ _id: id }, { deleted: true });
            }
            catch (error) {
                throw new Error('Lỗi khi xóa công việc');
            }
        });
    }
    // Các hàm lọc (nếu dùng)
    static getTodosByStatus(completed) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield Todo_1.default.find({ completed, deleted: { $ne: true } }).sort({ deadline: 1 });
            }
            catch (error) {
                throw new Error('Lỗi khi lọc công việc theo trạng thái');
            }
        });
    }
}
exports.TodoService = TodoService;
