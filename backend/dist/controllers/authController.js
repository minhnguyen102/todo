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
exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator");
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Tạo token
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { username, password, first_name, last_name } = req.body;
        const userExists = yield User_1.default.findOne({ username });
        if (userExists) {
            res.status(400).json({ message: 'Email này đã được đăng ký' });
            return;
        }
        // Hash mật khẩu
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const user = yield User_1.default.create({
            first_name,
            last_name,
            username,
            password: hashedPassword,
        });
        if (user) {
            const fullName = (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : user.username;
            res.status(201).json({
                _id: user._id,
                username: user.username,
                fullName,
                token: generateToken(user._id.toString()),
            });
        }
        else {
            res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const user = yield User_1.default.findOne({ username });
        if (user && (yield bcryptjs_1.default.compare(password, user.password))) {
            const fullName = (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : user.username;
            res.json({
                _id: user._id,
                username: user.username,
                fullName,
                token: generateToken(user._id.toString()),
            });
        }
        else {
            res.status(401).json({ message: 'Username hoặc mật khẩu không đúng' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});
exports.login = login;
