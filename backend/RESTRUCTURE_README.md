# 📋 Todo App - Backend & Frontend Restructure

## Backend Restructure (MVC Architecture)

### 📁 Folder Structure
```
backend/src/
├── index.ts                 # Entry point, server configuration
├── models/
│   └── Todo.ts             # MongoDB schema & interface
├── services/
│   └── todoService.ts      # Business logic layer
├── controllers/
│   └── todoController.ts   # Request handling layer
├── routes/
│   └── todoRoutes.ts       # API endpoint definitions
└── ...
```

### 🏗️ Architecture Layers

#### 1. **Models** (Data Layer)
- `TodoSchema`: Defines MongoDB document structure
- `ITodo`: TypeScript interface for type safety
- **New Fields:**
  - `description`: Task description
  - `deadline`: Task deadline (Date)
  - `createdAt`: Automatic timestamp
  - `updatedAt`: Automatic timestamp

#### 2. **Services** (Business Logic)
- `todoService.ts` contains all business logic
- Methods:
  - `getAllTodos()` - Get all tasks
  - `getTodoById(id)` - Get specific task
  - `createTodo(title, description, deadline)` - Create new task
  - `updateTodo(id, updateData)` - Update task
  - `deleteTodo(id)` - Delete task
  - `getTodosByDate(date)` - Filter by specific day
  - `getTodosByMonth(year, month)` - Filter by month
  - `getTodosByStatus(completed)` - Filter by status
  - `getUpcomingTodos(days)` - Get tasks due in X days
  - `getOverdueTodos()` - Get overdue tasks

#### 3. **Controllers** (Request Handling)
- `todoController.ts` handles HTTP requests/responses
- Validates input data
- Calls appropriate service methods
- Returns formatted responses

#### 4. **Routes** (API Endpoints)
- `todoRoutes.ts` defines all API routes
- **Available Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/todos` | Create new task |
| GET | `/api/todos` | Get all tasks |
| GET | `/api/todos/:id` | Get specific task |
| PUT | `/api/todos/:id` | Update task |
| DELETE | `/api/todos/:id` | Delete task |
| GET | `/api/todos/filter/date?date=YYYY-MM-DD` | Filter by date |
| GET | `/api/todos/filter/month?year=2024&month=12` | Filter by month |
| GET | `/api/todos/filter/status?completed=true/false` | Filter by status |
| GET | `/api/todos/upcoming?days=7` | Get upcoming tasks |
| GET | `/api/todos/overdue` | Get overdue tasks |

## Frontend Updates

### 🎨 New Components

#### 1. **TaskManager.vue** (Management Page)
- Main task management interface
- Features:
  - Filter tasks by:
    - All tasks
    - Specific date
    - Specific month
    - Overdue tasks
    - Upcoming tasks (7 days)
  - Search by title or description
  - Filter by status (all, pending, completed)
  - Edit tasks inline
  - Sort by deadline
  - Visual indicators for:
    - Completed tasks (green)
    - Overdue tasks (red)

#### 2. **EditTaskModal.vue** (Edit Window)
- Modal for editing task details
- Editable fields:
  - Title (required)
  - Description
  - Deadline
  - Completion status
- Features:
  - Click outside to close
  - Save/Cancel buttons
  - Datetime picker for deadline

#### 3. **App.vue** (Updated)
- Navigation tabs between views:
  - ✨ Todo Nhanh (Quick todo list)
  - 📋 Quản Lí Chi Tiết (Task manager)
- Added fields to quick add:
  - Title (required)
  - Description
  - Deadline
- Shows task summary in list view

## API Request Examples

### Create Task
```javascript
POST /api/todos
{
  "title": "Complete project",
  "description": "Finish the Todo app",
  "deadline": "2024-12-31T17:00:00Z"
}
```

### Update Task
```javascript
PUT /api/todos/123456
{
  "title": "Updated title",
  "description": "Updated description",
  "completed": true,
  "deadline": "2024-12-31T17:00:00Z"
}
```

### Filter by Date
```javascript
GET /api/todos/filter/date?date=2024-12-25
```

### Filter by Month
```javascript
GET /api/todos/filter/month?year=2024&month=12
```

## Setup Instructions

### Backend
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with MongoDB connection:
   ```
   MONGODB_URI=your_mongodb_uri
   PORT=3000
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

### Frontend
1. Install dependencies:
   ```bash
   npm install
   ```

2. Backend should be running on `http://localhost:3000`

3. Run development server:
   ```bash
   npm run dev
   ```

## Features Summary

✅ **Task Management:**
- Create, read, update, delete tasks
- Add descriptions and deadlines
- Mark as complete/incomplete

✅ **Filtering & Search:**
- Filter by date range
- Filter by month
- Filter by status (completed/pending)
- Search by title or description
- Show overdue tasks
- Show upcoming tasks (7 days)

✅ **User Interface:**
- Two views: Quick add + Detailed management
- Responsive design for mobile & desktop
- Visual status indicators
- Modal editing interface
- Sorting by deadline

✅ **Architecture:**
- Separation of concerns (MVC)
- Reusable services
- Type-safe with TypeScript
- REST API design

## Next Steps (Optional Enhancements)

- [ ] Add task categories/tags
- [ ] Add task priority levels
- [ ] Add task reminders/notifications
- [ ] Add user authentication
- [ ] Add recurring tasks
- [ ] Add task attachments
- [ ] Add task comments/notes
- [ ] Add task history/audit log
- [ ] Add dark mode
- [ ] Add export to PDF/CSV
