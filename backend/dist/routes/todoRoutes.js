"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const todoController_1 = require("../controllers/todoController");
const router = express_1.default.Router();
router.post('/', todoController_1.TodoController.createTodo);
router.get('/', todoController_1.TodoController.getAllTodos);
router.get('/:id', todoController_1.TodoController.getTodoById);
router.put('/:id', todoController_1.TodoController.updateTodo);
router.delete('/:id', todoController_1.TodoController.deleteTodo);
exports.default = router;
