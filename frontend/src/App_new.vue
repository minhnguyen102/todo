<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  deadline?: string;
}

const todos = ref<Todo[]>([]);
const newTaskTitle = ref('');
const newTaskDescription = ref('');
const newTaskDeadline = ref('');
const filterStatus = ref('all');
const showAddForm = ref(false);
const API_URL = 'http://localhost:3000/api/todos';

const stats = computed(() => ({
  todo: todos.value.filter(t => !t.completed).length,
  completed: todos.value.filter(t => t.completed).length,
  total: todos.value.length
}));

const filteredTodos = computed(() => {
  if (filterStatus.value === 'all') return todos.value;
  if (filterStatus.value === 'active') return todos.value.filter(t => !t.completed);
  if (filterStatus.value === 'completed') return todos.value.filter(t => t.completed);
  return todos.value;
});

const fetchTodos = async () => {
  try {
    const response = await axios.get(API_URL);
    todos.value = response.data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
  }
};

const addTodo = async () => {
  if (!newTaskTitle.value.trim()) return;
  
  try {
    const response = await axios.post(API_URL, {
      title: newTaskTitle.value,
      description: newTaskDescription.value,
      deadline: newTaskDeadline.value ? new Date(newTaskDeadline.value).toISOString() : undefined
    });
    todos.value.push(response.data);
    newTaskTitle.value = '';
    newTaskDescription.value = '';
    newTaskDeadline.value = '';
    showAddForm.value = false;
  } catch (error) {
    console.error('Lỗi khi thêm công việc:', error);
  }
};

const toggleComplete = async (todo: Todo) => {
  try {
    const response = await axios.put(`${API_URL}/${todo._id}`, {
      completed: !todo.completed
    });
    const index = todos.value.findIndex(t => t._id === todo._id);
    if (index !== -1) {
      todos.value[index] = response.data;
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật:', error);
  }
};

const deleteTodo = async (id: string) => {
  if (confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
    try {
      await axios.delete(`${API_URL}/${id}`);
      todos.value = todos.value.filter(todo => todo._id !== id);
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
    }
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  fetchTodos();
});
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- Profile -->
      <div class="profile-section">
        <div class="avatar">
          <span>👤</span>
        </div>
        <h2>admin</h2>
        <p class="email">user@todohub.com</p>
      </div>

      <!-- Stats -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-number">{{ stats.todo }}</div>
          <div class="stat-label">To do<br />tasks</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.completed }}</div>
          <div class="stat-label">Completed<br />tasks</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">Total<br />tasks</div>
        </div>
      </div>

      <!-- Categories -->
      <div class="categories-section">
        <h3>Categories</h3>
        <div class="category-item">
          <span class="category-color"></span>
          <span>Work</span>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header Navigation -->
      <header class="header">
        <nav class="nav">
          <button class="nav-item">HOME</button>
          <button class="nav-item active">TODOS</button>
          <button class="nav-item">SETTINGS</button>
          <button class="nav-item">SUPPORT</button>
          <button class="nav-item">LOGOUT</button>
        </nav>
      </header>

      <!-- Content Area -->
      <div class="content">
        <!-- Title and Filters -->
        <div class="content-header">
          <div class="title-section">
            <h1>📋 Work</h1>
            <div class="title-actions">
              <button class="action-btn">−</button>
              <button class="action-btn">+</button>
              <button class="action-btn">−</button>
            </div>
          </div>

          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button
              v-for="tab in ['all', 'active', 'completed']"
              :key="tab"
              :class="{ active: filterStatus === tab }"
              @click="filterStatus = tab"
              class="filter-tab"
            >
              {{ tab === 'all' ? 'ALL' : tab === 'active' ? 'ACTIVE' : 'COMPLETED' }}
            </button>
            <button class="filter-tab">PRIMARY</button>
          </div>
        </div>

        <!-- Task List -->
        <div class="task-list">
          <div
            v-for="todo in filteredTodos"
            :key="todo._id"
            class="task-card"
            :class="{ completed: todo.completed }"
          >
            <div class="task-checkbox" @click="toggleComplete(todo)">
              <input type="checkbox" :checked="todo.completed" readonly />
            </div>

            <div class="task-icons">
              <span class="icon">📋</span>
              <span class="icon">≡</span>
              <span class="icon">✓</span>
            </div>

            <div class="task-info">
              <div class="task-title">{{ todo.title }}</div>
              <div v-if="todo.deadline" class="task-date">{{ formatDate(todo.deadline) }}</div>
              <div v-if="todo.description" class="task-description">{{ todo.description }}</div>
            </div>

            <button @click="deleteTodo(todo._id)" class="task-delete">×</button>
          </div>

          <div v-if="filteredTodos.length === 0" class="empty-state">
            <p>📭 Không có công việc</p>
          </div>
        </div>

        <!-- Add New Task Button -->
        <div class="add-task-section">
          <button
            v-if="!showAddForm"
            @click="showAddForm = true"
            class="btn-new-task"
          >
            + New Task
          </button>

          <form v-if="showAddForm" @submit.prevent="addTodo" class="add-task-form">
            <input
              v-model="newTaskTitle"
              type="text"
              placeholder="Task title..."
              class="form-input"
              required
            />
            <input
              v-model="newTaskDescription"
              type="text"
              placeholder="Description (optional)..."
              class="form-input"
            />
            <input
              v-model="newTaskDeadline"
              type="datetime-local"
              class="form-input"
            />
            <div class="form-actions">
              <button type="submit" class="btn-save">Save</button>
              <button
                type="button"
                @click="showAddForm = false"
                class="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.app-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #4488ff 0%, #5566dd 100%);
  padding: 20px;
  gap: 20px;
}

/* ===== SIDEBAR ===== */
.sidebar {
  width: 280px;
  background: white;
  border-radius: 24px;
  padding: 30px 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.profile-section {
  text-align: center;
}

.avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.profile-section h2 {
  font-size: 20px;
  color: #1f2937;
  margin-bottom: 5px;
}

.email {
  font-size: 13px;
  color: #9ca3af;
}

/* Stats */
.stats-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  min-width: 40px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

/* Categories */
.categories-section {
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.categories-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  text-transform: capitalize;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.category-item:hover {
  background: #f3f4f6;
}

.category-color {
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border-radius: 2px;
}

/* ===== MAIN CONTENT ===== */
.main-content {
  flex: 1;
  background: white;
  border-radius: 24px;
  padding: 30px 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

/* Header Navigation */
.header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.nav {
  display: flex;
  gap: 40px;
  justify-content: center;
}

.nav-item {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  padding: 5px 10px;
  position: relative;
}

.nav-item:hover {
  color: #1f2937;
}

.nav-item.active {
  color: #3b82f6;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
  height: 3px;
  background: #3b82f6;
  border-radius: 2px;
}

/* Content */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-header {
  margin-bottom: 30px;
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.title-section h1 {
  font-size: 24px;
  color: #1f2937;
}

.title-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 12px;
}

.filter-tab {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.filter-tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* Task List */
.task-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.task-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s;
  position: relative;
  group: 'task';
}

.task-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.task-card.completed {
  opacity: 0.6;
}

.task-card.completed .task-title {
  text-decoration: line-through;
  color: #9ca3af;
}

.task-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.task-checkbox input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.task-icons {
  display: flex;
  gap: 8px;
  color: #d1d5db;
  font-size: 16px;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: color 0.2s;
}

.icon:hover {
  color: #3b82f6;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.task-date {
  font-size: 12px;
  color: #9ca3af;
}

.task-description {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.task-delete {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #d1d5db;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  display: none;
}

.task-card:hover .task-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  background: #fee2e2;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 16px;
}

/* Add Task Section */
.add-task-section {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.btn-new-task {
  width: 100%;
  max-width: 300px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0 auto;
  display: block;
}

.btn-new-task:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Add Task Form */
.add-task-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.form-input {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover {
  background: #2563eb;
}

.btn-cancel {
  background: #e5e7eb;
  color: #1f2937;
}

.btn-cancel:hover {
  background: #d1d5db;
}

/* Responsive */
@media (max-width: 1024px) {
  .app-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }

  .main-content {
    max-height: none;
  }

  .nav {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .app-layout {
    padding: 10px;
    gap: 10px;
  }

  .sidebar {
    width: 100%;
    padding: 20px;
  }

  .main-content {
    padding: 20px;
  }

  .title-section {
    flex-direction: column;
    gap: 15px;
  }

  .filter-tabs {
    flex-wrap: wrap;
  }

  .nav {
    flex-wrap: wrap;
  }
}
</style>
