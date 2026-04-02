<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import EditTaskModal from './EditTaskModal.vue';

interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

const todos = ref<Todo[]>([]);
const filterType = ref('all'); // all, day, month, overdue, upcoming
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const selectedMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
const selectedStatus = ref('all'); // all, completed, pending
const searchQuery = ref('');
const showEditModal = ref(false);
const selectedTodo = ref<Todo | null>(null);

const API_URL = 'http://localhost:3000/api/todos';

// Tính toán danh sách công việc sau khi lọc
const filteredTodos = computed(() => {
  let result = [...todos.value];

  // Tìm kiếm
  if (searchQuery.value) {
    result = result.filter(todo =>
      todo.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (todo.description && todo.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
  }

  // Lọc theo trạng thái
  if (selectedStatus.value === 'completed') {
    result = result.filter(todo => todo.completed);
  } else if (selectedStatus.value === 'pending') {
    result = result.filter(todo => !todo.completed);
  }

  return result.sort((a, b) => {
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return 0;
  });
});

// Lấy danh sách công việc
const fetchTodos = async () => {
  try {
    const response = await axios.get(API_URL);
    todos.value = response.data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
  }
};

// Lấy công việc theo ngày
const fetchTodosByDate = async () => {
  try {
    const response = await axios.get(`${API_URL}/filter/date?date=${selectedDate.value}`);
    todos.value = response.data;
  } catch (error) {
    console.error('Lỗi khi lấy công việc theo ngày:', error);
  }
};

// Lấy công việc theo tháng
const fetchTodosByMonth = async () => {
  try {
    const [year, month] = selectedMonth.value.split('-');
    const response = await axios.get(`${API_URL}/filter/month?year=${year}&month=${month}`);
    todos.value = response.data;
  } catch (error) {
    console.error('Lỗi khi lấy công việc theo tháng:', error);
  }
};

// Lấy công việc quá hạn
const fetchOverdueTodos = async () => {
  try {
    const response = await axios.get(`${API_URL}/overdue`);
    todos.value = response.data;
  } catch (error) {
    console.error('Lỗi khi lấy công việc quá hạn:', error);
  }
};

// Lấy công việc sắp tới
const fetchUpcomingTodos = async () => {
  try {
    const response = await axios.get(`${API_URL}/upcoming`);
    todos.value = response.data;
  } catch (error) {
    console.error('Lỗi khi lấy công việc sắp tới:', error);
  }
};

// Xử lý thay đổi bộ lọc
const handleFilterChange = async () => {
  if (filterType.value === 'all') {
    await fetchTodos();
  } else if (filterType.value === 'day') {
    await fetchTodosByDate();
  } else if (filterType.value === 'month') {
    await fetchTodosByMonth();
  } else if (filterType.value === 'overdue') {
    await fetchOverdueTodos();
  } else if (filterType.value === 'upcoming') {
    await fetchUpcomingTodos();
  }
};

// Toggle trạng thái hoàn thành
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

// Xóa công việc
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

// Mở modal edit
const openEditModal = (todo: Todo) => {
  selectedTodo.value = { ...todo };
  showEditModal.value = true;
};

// Xử lý lưu sau khi chỉnh sửa
const handleSaveEdit = async (updatedTodo: Todo) => {
  try {
    const response = await axios.put(`${API_URL}/${updatedTodo._id}`, {
      title: updatedTodo.title,
      description: updatedTodo.description,
      deadline: updatedTodo.deadline,
      completed: updatedTodo.completed
    });
    const index = todos.value.findIndex(t => t._id === updatedTodo._id);
    if (index !== -1) {
      todos.value[index] = response.data;
    }
    showEditModal.value = false;
  } catch (error) {
    console.error('Lỗi khi cập nhật công việc:', error);
  }
};

// Format ngày giống giao diện mẫu
const formatCustomDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
};


// Kiểm tra ngày quá hạn
const isOverdue = (dateString?: string) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date() && new Date(dateString).toDateString() !== new Date().toDateString();
};

onMounted(() => {
  fetchTodos();
});
</script>

<template>
  <div class="task-manager">
    <div class="header">
      <h1>📋 Quản Lí Công Việc</h1>
    </div>

    <div class="controls">
      <div class="filter-section">
        <div class="filter-group">
          <label>Bộ lọc:</label>
          <select v-model="filterType" @change="handleFilterChange">
            <option value="all">Tất cả công việc</option>
            <option value="day">Theo ngày</option>
            <option value="month">Theo tháng</option>
            <option value="overdue">Công việc quá hạn</option>
            <option value="upcoming">Công việc sắp tới (7 ngày)</option>
          </select>
        </div>

        <!-- Nhập ngày nếu chọn lọc theo ngày -->
        <div v-if="filterType === 'day'" class="filter-group">
          <label>Chọn ngày:</label>
          <input 
            v-model="selectedDate" 
            type="date" 
            @change="handleFilterChange"
          />
        </div>

        <!-- Nhập tháng nếu chọn lọc theo tháng -->
        <div v-if="filterType === 'month'" class="filter-group">
          <label>Chọn tháng:</label>
          <input 
            v-model="selectedMonth" 
            type="month" 
            @change="handleFilterChange"
          />
        </div>

        <!-- Tìm kiếm -->
        <div class="filter-group">
          <label>Tìm kiếm:</label>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Tìm kiếm công việc..."
            class="search-input"
          />
        </div>

        <!-- Lọc theo trạng thái -->
        <div class="filter-group">
          <label>Trạng thái:</label>
          <select v-model="selectedStatus">
            <option value="all">Tất cả</option>
            <option value="pending">Chưa hoàn thành</option>
            <option value="completed">Đã hoàn thành</option>
          </select>
        </div>
      </div>
    </div>

    <div class="task-list">
      <div v-if="filteredTodos.length === 0" class="empty-state">
        <p>📭 Không có công việc nào</p>
      </div>

      <div 
        v-for="todo in filteredTodos" 
        :key="todo._id" 
        class="task-item"
        :class="{ 
          'completed': todo.completed,
          'overdue': isOverdue(todo.deadline)
        }"
      >
        <div class="task-icons">
          <!-- Icon Drag (dấu chấm lưới kéo thả) -->
          <svg class="icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="6" height="6" rx="1" fill="none" stroke="#c0c0c0" stroke-width="1.5" stroke-dasharray="2 1.5"/>
            <rect x="12" y="2" width="6" height="6" rx="1" fill="none" stroke="#c0c0c0" stroke-width="1.5" stroke-dasharray="2 1.5"/>
            <rect x="2" y="12" width="6" height="6" rx="1" fill="none" stroke="#c0c0c0" stroke-width="1.5" stroke-dasharray="2 1.5"/>
            <rect x="12" y="12" width="6" height="6" rx="1" fill="none" stroke="#c0c0c0" stroke-width="1.5" stroke-dasharray="2 1.5"/>
          </svg>

          <!-- Icon List (3 dòng ngang trong hình tròn) -->
          <svg class="icon" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="9.5" stroke="#c0c0c0" stroke-width="1.5"/>
            <path d="M7 8h8M7 11h8M7 14h8" stroke="#c0c0c0" stroke-width="1.5" stroke-linecap="round"/>
          </svg>

          <!-- Icon Check tròn -->
          <svg @click="toggleComplete(todo)" class="icon check-icon" :class="{ 'is-completed': todo.completed }" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="9.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7.5 11l2.5 2.5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="task-content">
          <div class="task-title">{{ todo.title }}</div>
          <div class="task-date">{{ formatCustomDate(todo.createdAt) }}</div>
        </div>

        <div class="task-actions">
          <button @click="openEditModal(todo)" class="edit-btn" title="Chỉnh sửa">✏️</button>
          <button @click="deleteTodo(todo._id)" class="delete-btn" title="Xóa">🗑️</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <EditTaskModal 
      v-if="showEditModal" 
      :todo="selectedTodo"
      @save="handleSaveEdit"
      @close="showEditModal = false"
    />
  </div>
</template>

<style scoped>
.task-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  font-size: 28px;
  margin: 0;
}

.controls {
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
}

.filter-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.filter-group select,
.filter-group input {
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #667eea;
}

.search-input {
  width: 100%;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 18px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background-color: white;
  border-bottom: 1px solid #f1f5f9;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.overdue {
  background-color: #fff8f8;
}

.task-icons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  flex-shrink: 0;
  stroke: #a0a0a0;
}

.check-icon {
  cursor: pointer;
  color: #c0c0c0;
}

.check-icon.is-completed {
  color: #10b981;
}

.task-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: #2d2d2d;
  margin-bottom: 3px;
  letter-spacing: 0.01em;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #9ca3af;
}

.task-date {
  font-size: 14px;
  color: #a0a0a0;
}

.task-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.edit-btn,
.delete-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
}

@media (max-width: 768px) {
  .filter-section {
    grid-template-columns: 1fr;
  }

  .task-item {
    flex-wrap: wrap;
  }

  .task-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 10px;
  }
}
</style>
