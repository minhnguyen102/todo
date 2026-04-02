<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const token = ref(localStorage.getItem('token') || '');

// Cấu hình Axios gửi Token tự động
axios.interceptors.request.use(config => {
  if (token.value) {
    config.headers.Authorization = `Bearer ${token.value}`;
  }
  return config;
});

interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  deadline?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  progressText?: string;
  progressPercent?: number;
  progressHistory?: {
    text: string;
    percent: number;
    date: string;
  }[];
  createdAt?: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ===== STATE =====
const todos = ref<Todo[]>([]);
const newTaskTitle = ref('');
const newTaskDescription = ref('');
const newTaskDeadline = ref('');
const newTaskCategory = ref('Công việc');
const newTaskPriority = ref<'low' | 'medium' | 'high'>('medium');
const filterStatus = ref('all');
const filterCategory = ref('all');
const searchQuery = ref('');
const sortBy = ref('newest'); // newest | oldest | deadline | priority
const showAddForm = ref(false);
const currentPage = ref('todos');
const API_URL = 'http://localhost:3000/api/todos';

// Edit modal
const showEditModal = ref(false);
const editingTodo = ref<Todo | null>(null);
const editTitle = ref('');
const editDescription = ref('');
const editDeadline = ref('');
const editCategory = ref('');
const editPriority = ref<'low' | 'medium' | 'high'>('medium');

// Toast
const toasts = ref<Toast[]>([]);
let toastId = 0;

// ===== CONSTANTS =====
const categories = [
  { id: 'work', name: 'Công việc', color: '#22c55e', icon: '📋' },
  { id: 'personal', name: 'Cá nhân', color: '#10b981', icon: '👤' },
  { id: 'study', name: 'Học tập', color: '#f59e0b', icon: '📚' }
];


// ===== COMPUTED =====
const stats = computed(() => ({
  todo: todos.value.filter(t => !t.completed).length,
  completed: todos.value.filter(t => t.completed).length,
  total: todos.value.length,
  progress: todos.value.length > 0
    ? Math.round((todos.value.filter(t => t.completed).length / todos.value.length) * 100)
    : 0,
}));

const countByCategory = computed(() => {
  const counts: Record<string, number> = { all: todos.value.length };
  categories.forEach(cat => {
    counts[cat.name] = todos.value.filter(t => t.category === cat.name).length;
  });
  return counts;
});

const filteredTodos = computed(() => {
  let result = [...todos.value];

  // Tìm kiếm
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }

  // Lọc category
  if (filterCategory.value !== 'all') {
    result = result.filter(t => t.category === filterCategory.value);
  }

  // Lọc trạng thái
  if (filterStatus.value === 'active') result = result.filter(t => !t.completed);
  if (filterStatus.value === 'completed') result = result.filter(t => t.completed);

  // Sắp xếp
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  result.sort((a, b) => {
    if (sortBy.value === 'oldest') return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
    if (sortBy.value === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy.value === 'priority') {
      return (priorityOrder[a.priority || 'medium']) - (priorityOrder[b.priority || 'medium']);
    }
    // newest (default)
    return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
  });

  return result;
});


// ===== TOAST =====
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const id = ++toastId;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
};

// ===== API =====
const fetchTodos = async () => {
  try {
    const response = await axios.get(API_URL);
    todos.value = response.data;
  } catch {
    showToast('Lỗi khi tải danh sách công việc', 'error');
  }
};

const addTodo = async () => {
  if (!newTaskTitle.value.trim()) return;
  try {
    const response = await axios.post(API_URL, {
      title: newTaskTitle.value,
      description: newTaskDescription.value,
      deadline: newTaskDeadline.value ? new Date(newTaskDeadline.value).toISOString() : undefined,
      category: newTaskCategory.value,
      priority: newTaskPriority.value,
    });
    todos.value.unshift(response.data);
    newTaskTitle.value = '';
    newTaskDescription.value = '';
    newTaskDeadline.value = '';
    newTaskCategory.value = 'Công việc';
    newTaskPriority.value = 'medium';
    showAddForm.value = false;
    showToast('✅ Đã thêm công việc mới!');
  } catch {
    showToast('Lỗi khi thêm công việc', 'error');
  }
};

const toggleComplete = async (todo: Todo) => {
  if (todo.completed) return; // Prevent uncompleting
  try {
    const response = await axios.put(`${API_URL}/${todo._id}`, { completed: true });
    const index = todos.value.findIndex(t => t._id === todo._id);
    if (index !== -1) todos.value[index] = response.data;
    showToast('✅ Đã hoàn thành!', 'info');
  } catch {
    showToast('Lỗi khi cập nhật', 'error');
  }
};

const deleteTodo = async (id: string) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    todos.value = todos.value.filter(t => t._id !== id);
    showToast('🗑️ Đã xóa công việc', 'info');
  } catch {
    showToast('Lỗi khi xóa', 'error');
  }
};

// Edit
const openEditModal = (todo: Todo) => {
  editingTodo.value = todo;
  editTitle.value = todo.title;
  editDescription.value = todo.description || '';
  editDeadline.value = todo.deadline ? new Date(todo.deadline).toISOString().slice(0, 16) : '';
  editCategory.value = todo.category || 'Công việc';
  editPriority.value = todo.priority || 'medium';
  showEditModal.value = true;
};

const saveEdit = async () => {
  if (!editingTodo.value || !editTitle.value.trim()) return;
  try {
    const response = await axios.put(`${API_URL}/${editingTodo.value._id}`, {
      title: editTitle.value,
      description: editDescription.value,
      deadline: editDeadline.value ? new Date(editDeadline.value).toISOString() : null,
      category: editCategory.value,
      priority: editPriority.value,
    });
    const index = todos.value.findIndex(t => t._id === editingTodo.value!._id);
    if (index !== -1) todos.value[index] = response.data;
    showEditModal.value = false;
    showToast('✏️ Đã cập nhật công việc!');
  } catch {
    showToast('Lỗi khi cập nhật', 'error');
  }
};

// Progress Modal
const showProgressModal = ref(false);
const progressTodo = ref<Todo | null>(null);
const progressText = ref('');
const progressPercent = ref(0);

const openProgressModal = (todo: Todo) => {
  progressTodo.value = todo;
  progressText.value = todo.progressText || '';
  progressPercent.value = todo.progressPercent || 0;
  showProgressModal.value = true;
};

const saveProgress = async () => {
  if (!progressTodo.value) return;
  try {
    const response = await axios.put(`${API_URL}/${progressTodo.value._id}`, {
      progressText: progressText.value,
      progressPercent: progressPercent.value
    });
    const index = todos.value.findIndex(t => t._id === progressTodo.value!._id);
    if (index !== -1) todos.value[index] = response.data;
    showProgressModal.value = false;
    showToast('📈 Đã cập nhật tiến độ!');
  } catch {
    showToast('Lỗi khi cập nhật tiến độ', 'error');
  }
};


// Helpers
const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy}, ${hh}:${min}:${ss}`;
};

const formatCreatedDate = (todo: Todo) => formatDate(todo.createdAt);

// Keyboard: Enter to add
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && showAddForm.value) {
    e.preventDefault();
    addTodo();
  }
  if (e.key === 'Escape') {
    showAddForm.value = false;
    showEditModal.value = false;
  }
};

// ===== LOGIN LOGIC =====
const isLoggedIn = ref(!!token.value);
const isLoginMode = ref(true);
const loginUsername = ref('');
const loginPassword = ref('');
const loginFirstName = ref('');
const loginLastName = ref('');
const formErrors = ref<Record<string, string>>({}); // Biến hứng lỗi
// Lấy fullName từ localStorage, fallback về 'N/A'
const currentFullName = ref(localStorage.getItem('fullName') || 'N/A');
const currentUsername = ref(localStorage.getItem('username') || 'N/A');
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const AUTH_URL = `${API_BASE_URL}/api/auth`;

const handleAuth = async () => {
  try {
    formErrors.value = {}; // Reset lỗi
    const endpoint = isLoginMode.value ? '/login' : '/register';
    
    // Frontend Validation
    if (!loginUsername.value.trim() || !loginPassword.value.trim()) {
      showToast('Vui lòng điền tài khoản và mật khẩu!', 'error');
      return;
    }

    if (!isLoginMode.value) {
      if (!loginFirstName.value.trim() || !loginLastName.value.trim()) {
        showToast('Vui lòng điền đầy đủ Tên và Họ!', 'error');
        return;
      }
      if (loginUsername.value.trim().length < 4) {
        showToast('Tên đăng nhập (Username) phải dài ít nhất 4 ký tự!', 'error');
        return;
      }
      if (loginPassword.value.trim().length < 6) {
        showToast('Mật khẩu phải dài ít nhất 6 ký tự!', 'error');
        return;
      }
    }

    const payload: any = {
      username: loginUsername.value.trim(),
      password: loginPassword.value.trim()
    };
    if (!isLoginMode.value) {
      payload.first_name = loginFirstName.value.trim();
      payload.last_name = loginLastName.value.trim();
    }

    const response = await axios.post(`${AUTH_URL}${endpoint}`, payload);
    
    token.value = response.data.token;
    localStorage.setItem('token', token.value);
    
    // Save fullName locally (nếu api cũ chưa có fullName thì dùng username fallback)
    const returnedName = response.data.fullName || response.data.username;
    currentFullName.value = returnedName;
    localStorage.setItem('fullName', returnedName);
    
    // Save username để hiển thị dưới tên (@username)
    currentUsername.value = response.data.username;
    localStorage.setItem('username', response.data.username);
    
    isLoggedIn.value = true;
    showToast(isLoginMode.value ? '✅ Đăng nhập thành công!' : '🎉 Đăng ký thành công!');
    await fetchTodos();
  } catch (error: any) {
    // Xử lý lỗi mảng từ express-validator
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      error.response.data.errors.forEach((err: any) => {
        if (err.path) {
          formErrors.value[err.path] = err.msg;
        }
      });
      showToast('Vui lòng kiểm tra lại thông tin nhập liệu!', 'error');
    } else {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  }
};

const handleLogout = () => {
  isLoggedIn.value = false;
  token.value = '';
  localStorage.removeItem('token');
  currentFullName.value = 'N/A';
  localStorage.removeItem('fullName');
  localStorage.removeItem('username');
  loginUsername.value = '';
  loginPassword.value = '';
  loginFirstName.value = '';
  loginLastName.value = '';
  formErrors.value = {};
  todos.value = []; // Xóa danh sách khi đăng xuất
  showToast('ℹ️ Đã đăng xuất', 'info');
};

onMounted(() => {
  if (isLoggedIn.value) fetchTodos();
  window.addEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div v-if="!isLoggedIn" class="login-container">
    <div class="login-box">
      <h2>{{ isLoginMode ? 'Đăng Nhập TodoHub' : 'Tạo Tài Khoản Mới' }}</h2>
      <form @submit.prevent="handleAuth" class="login-form">
        
        <!-- Hiển thị Input nhập tên họ nếu đang ở chế độ Đăng Ký -->
        <template v-if="!isLoginMode">
          <div class="form-group">
            <label>Tên (First Name)</label>
            <input v-model="loginFirstName" type="text" class="form-input" placeholder="Tên" />
            <span class="error-text" v-if="formErrors['first_name']">{{ formErrors['first_name'] }}</span>
          </div>
          <div class="form-group" style="margin-top: 15px;">
            <label>Họ (Last Name)</label>
            <input v-model="loginLastName" type="text" class="form-input" placeholder="Họ" />
            <span class="error-text" v-if="formErrors['last_name']">{{ formErrors['last_name'] }}</span>
          </div>
        </template>

        <div class="form-group" :style="{ 'margin-top': !isLoginMode ? '15px' : '0' }">
          <label>Tên đăng nhập</label>
          <input v-model="loginUsername" type="text" class="form-input" placeholder="Nhập username (ít nhất 4 ký tự)" />
          <span class="error-text" v-if="formErrors['username']">{{ formErrors['username'] }}</span>
        </div>
        <div class="form-group" style="margin-top: 15px;">
          <label>Mật khẩu</label>
          <input v-model="loginPassword" type="password" class="form-input" placeholder="Nhập password (ít nhất 6 ký tự)" />
          <span class="error-text" v-if="formErrors['password']">{{ formErrors['password'] }}</span>
        </div>
        <button type="submit" class="btn-new-task" style="margin-top: 25px; width: 100%;">
          {{ isLoginMode ? 'Đăng Nhập' : 'Đăng Ký' }}
        </button>
      </form>
      <div style="margin-top: 15px; font-size: 13px; color: #6b7280; text-align: center;">
        <span style="cursor: pointer; color: #22c55e;" @click="isLoginMode = !isLoginMode">
          {{ isLoginMode ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập' }}
        </span>
      </div>
    </div>
  </div>

  <div v-else class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- Profile -->
      <div class="profile-section">
        <div class="avatar">
          <span>👤</span>
        </div>
        <h2>{{ currentFullName }}</h2>
        <p class="email">@{{ currentUsername }}</p>
        <button @click="handleLogout" class="btn-logout">Đăng xuất</button>
      </div>

      <!-- Stats -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-number">{{ stats.todo }}</div>
          <div class="stat-label">Việc chưa<br />làm</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.completed }}</div>
          <div class="stat-label">Hoàn<br />thành</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">Tổng<br />công việc</div>
        </div>
      </div>

      <!-- Categories -->
      <div class="categories-section" v-if="currentPage === 'todos'">
        <h3>Danh mục</h3>

        <!-- Tất cả -->
        <button
          class="category-item"
          :class="{ 'cat-active': filterCategory === 'all' }"
          @click="filterCategory = 'all'"
        >
          <span class="cat-dot" style="background: #6b7280;"></span>
          <span class="cat-name">Tất cả</span>
          <span class="cat-count">{{ countByCategory['all'] }}</span>
        </button>

        <!-- Từng danh mục -->
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ 'cat-active': filterCategory === cat.name }"
          @click="filterCategory = cat.name"
        >
          <span class="cat-dot" :style="{ background: cat.color }"></span>
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-count">{{ countByCategory[cat.name] ?? 0 }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header Navigation -->
      <header class="header">
        <nav class="nav">
          <button 
            :class="{ active: currentPage === 'home' }"
            @click="currentPage = 'home'"
            class="nav-item"
          >
            🏠 TRANG CHỦ
          </button>
          <button 
            :class="{ active: currentPage === 'todos' }"
            @click="currentPage = 'todos'"
            class="nav-item"
          >
            ✓ VIỆC LÀM
          </button>
          <button 
            :class="{ active: currentPage === 'settings' }"
            @click="currentPage = 'settings'"
            class="nav-item"
          >
            ⚙️ CÀI ĐẶT
          </button>
          <button 
            :class="{ active: currentPage === 'support' }"
            @click="currentPage = 'support'"
            class="nav-item"
          >
            ❓ HỖ TRỢ
          </button>
        </nav>
      </header>

      <!-- Content Area -->
      <div class="content">
        <!-- TRANG CHỦ -->
        <div v-if="currentPage === 'home'" class="page-content">
          <div class="content-header">
            <h1>🏠 Trang Chủ</h1>
          </div>
          <div class="home-grid">
            <div class="home-card">
              <div class="card-icon">📊</div>
              <h3>Thống kê</h3>
              <p class="card-stat">{{ stats.total }} công việc</p>
            </div>
            <div class="home-card">
              <div class="card-icon">✓</div>
              <h3>Hoàn thành</h3>
              <p class="card-stat">{{ stats.completed }} việc</p>
            </div>
            <div class="home-card">
              <div class="card-icon">⏳</div>
              <h3>Chờ xử lý</h3>
              <p class="card-stat">{{ stats.todo }} việc</p>
            </div>
          </div>
          <div class="home-section">
            <h2>Công việc sắp tới</h2>
            <div v-if="filteredTodos.length > 0" class="upcoming-tasks">
              <div v-for="todo in filteredTodos.slice(0, 3)" :key="todo._id" class="upcoming-item">
                <span :class="{ completed: todo.completed }">{{ todo.title }}</span>
                <span v-if="todo.deadline" class="date">{{ formatDate(todo.deadline) }}</span>
              </div>
            </div>
            <div v-else class="empty-message">
              <p>✨ Không có công việc sắp tới</p>
            </div>
          </div>
        </div>

        <!-- VIỆC LÀM -->
        <div v-if="currentPage === 'todos'" class="page-content">
          <div class="content-header">
            <div class="title-section">
              <h1>📋 Công Việc</h1>
              <div class="title-actions">
                <button class="action-btn" title="Giảm">−</button>
                <button class="action-btn" title="Thêm">+</button>
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
                {{ tab === 'all' ? 'TẤT CẢ' : tab === 'active' ? 'CHƯA LÀM' : 'HOÀN THÀNH' }}
              </button>
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
              <div class="task-icons-group">
                <!-- Icon Drag (lưới 4 ô) -->
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1" stroke="#c8c8c8" stroke-width="1.4" fill="none"/>
                  <rect x="9" y="1" width="5" height="5" rx="1" stroke="#c8c8c8" stroke-width="1.4" stroke-dasharray="1.8 1.2" fill="none"/>
                  <rect x="1" y="9" width="5" height="5" rx="1" stroke="#c8c8c8" stroke-width="1.4" stroke-dasharray="1.8 1.2" fill="none"/>
                  <rect x="9" y="9" width="5" height="5" rx="1" stroke="#c8c8c8" stroke-width="1.4" stroke-dasharray="1.8 1.2" fill="none"/>
                </svg>

                <!-- Icon List trong hình tròn -->
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8.5" stroke="#c8c8c8" stroke-width="1.4"/>
                  <path d="M6 7.5h8M6 10h8M6 12.5h8" stroke="#c8c8c8" stroke-width="1.4" stroke-linecap="round"/>
                </svg>

                <!-- Icon Check tròn (click để toggle) -->
                <svg @click="toggleComplete(todo)" width="20" height="20" viewBox="0 0 20 20" fill="none"
                  :class="{ 'check-done': todo.completed }" class="check-svg">
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <div class="task-content">
                <div class="task-title-line">
                  <div class="task-title">{{ todo.title }}</div>
                  <!-- Nút chỉnh sửa chỉ hiện khi chưa hoàn thành -->
                  <button v-if="!todo.completed" @click="openEditModal(todo)" class="task-edit" title="Chỉnh sửa">✏️</button>
                  <button v-if="!todo.completed" @click="openProgressModal(todo)" class="task-progress-btn" title="Cập nhật tiến độ">📈</button>
                  <button @click="deleteTodo(todo._id)" class="task-delete" title="Xóa">×</button>
                </div>
                <div class="task-date-line">
                  <span v-if="todo.deadline" class="task-datetime">{{ formatDate(todo.deadline) }}</span>
                  <span v-else class="task-datetime">{{ formatCreatedDate(todo) }}</span>
                </div>
                <!-- Progress display -->
                <div v-if="todo.progressPercent !== undefined && todo.progressPercent > 0 && !todo.completed" class="task-progress-display">
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill" :style="{ width: todo.progressPercent + '%' }"></div>
                  </div>
                  <div class="progress-text-display">
                    <span class="pct">{{ todo.progressPercent }}%</span>
                    <span class="txt" v-if="todo.progressText">- {{ todo.progressText }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="filteredTodos.length === 0" class="empty-state">
              <p>📭 Không có công việc nào</p>
            </div>
          </div>

          <!-- Add New Task Button -->
          <div class="add-task-section">
            <h3 v-if="!showAddForm" class="add-title">Thêm Công Việc Mới</h3>
            <button
              v-if="!showAddForm"
              @click="showAddForm = true"
              class="btn-new-task"
            >
              + Thêm Công Việc
            </button>

            <form v-if="showAddForm" @submit.prevent="addTodo" class="add-task-form">
              <h3 class="form-title">📝 Thêm Công Việc Mới</h3>
              
              <div class="form-group">
                <label for="title">Tên công việc *</label>
                <input
                  id="title"
                  v-model="newTaskTitle"
                  type="text"
                  placeholder="Nhập tên công việc..."
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="category">Danh mục</label>
                <select 
                  id="category"
                  v-model="newTaskCategory"
                  class="form-input form-select"
                >
                  <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                    {{ cat.icon }} {{ cat.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="description">Mô tả</label>
                <input
                  id="description"
                  v-model="newTaskDescription"
                  type="text"
                  placeholder="Mô tả công việc (tuỳ chọn)..."
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="deadline">Hạn chót</label>
                <input
                  id="deadline"
                  v-model="newTaskDeadline"
                  type="datetime-local"
                  class="form-input"
                />
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-save">💾 Lưu</button>
                <button
                  type="button"
                  @click="showAddForm = false"
                  class="btn-cancel"
                >
                  ✕ Hủy
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- CÀI ĐẶT -->
        <div v-if="currentPage === 'settings'" class="page-content">
          <div class="content-header">
            <h1>⚙️ Cài Đặt</h1>
          </div>
          <div class="settings-container">
            <div class="settings-section">
              <h2>Tài Khoản</h2>
              <div class="setting-item">
                <label>Tên hiển thị</label>
                <input type="text" :value="currentFullName" class="setting-input" readonly />
              </div>
              <div class="setting-item">
                <label>Username / Email liên kết</label>
                <input type="text" :value="currentUsername" class="setting-input" readonly />
              </div>
            </div>

            <div class="settings-section">
              <h2>Giao Diện</h2>
              <div class="setting-item">
                <label>
                  <input type="checkbox" checked /> Chế độ tối
                </label>
              </div>
              <div class="setting-item">
                <label>
                  <input type="checkbox" checked /> Nhận thông báo
                </label>
              </div>
            </div>

            <div class="settings-section">
              <h2>Bảo Mật</h2>
              <button class="btn-settings">🔑 Đổi Mật Khẩu</button>
              <button class="btn-settings">🗑️ Xóa Tất Cả Công Việc</button>
            </div>

            <div class="settings-actions">
              <button class="btn-save-settings">💾 Lưu Thay Đổi</button>
            </div>
          </div>
        </div>

        <!-- HỖ TRỢ -->
        <div v-if="currentPage === 'support'" class="page-content">
          <div class="content-header">
            <h1>❓ Hỗ Trợ</h1>
          </div>
          <div class="support-container">
            <div class="faq-section">
              <h2>Câu Hỏi Thường Gặp</h2>
              
              <div class="faq-item">
                <h3>❓ Làm cách nào để tạo một công việc mới?</h3>
                <p>Nhấp vào nút "+ Thêm Công Việc" ở phía dưới, điền tên công việc, mô tả và deadline, sau đó nhấp "Lưu".</p>
              </div>

              <div class="faq-item">
                <h3>❓ Làm cách nào để đánh dấu công việc hoàn thành?</h3>
                <p>Nhấp vào hộp kiểm ở bên trái công việc hoặc nhấp vào công việc để đánh dấu hoàn thành.</p>
              </div>

              <div class="faq-item">
                <h3>❓ Làm cách nào để xóa một công việc?</h3>
                <p>Nhấp vào nút "×" ở bên phải công việc, sau đó xác nhận xóa trong hộp thoại.</p>
              </div>

              <div class="faq-item">
                <h3>❓ Có thể lọc công việc theo trạng thái không?</h3>
                <p>Có, sử dụng các nút lọc ở phía trên: "TẤT CẢ", "CHƯA LÀM", "HOÀN THÀNH".</p>
              </div>

              <div class="faq-item">
                <h3>❓ Làm cách nào để liên hệ hỗ trợ?</h3>
                <p>Bạn có thể gửi email đến: <strong>support@todohub.com</strong></p>
              </div>
            </div>

            <div class="contact-section">
              <h2>Liên Hệ Hỗ Trợ</h2>
              <form class="contact-form">
                <input 
                  type="text" 
                  placeholder="Tên của bạn" 
                  class="form-input"
                />
                <input 
                  type="email" 
                  placeholder="Email của bạn" 
                  class="form-input"
                />
                <textarea 
                  placeholder="Mô tả vấn đề của bạn..." 
                  class="form-textarea"
                  rows="5"
                ></textarea>
                <button type="submit" class="btn-send">📧 Gửi Tin Nhắn</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Edit -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <h3 class="form-title">✏️ Chỉnh Sửa Công Việc</h3>
        
        <div class="form-group" style="margin-top: 15px;">
          <label>Tên công việc</label>
          <input v-model="editTitle" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label>Mô tả</label>
          <input v-model="editDescription" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label>Hạn chót</label>
          <input v-model="editDeadline" type="datetime-local" class="form-input" />
        </div>

        <div class="form-group">
          <label>Danh mục</label>
          <select v-model="editCategory" class="form-input form-select">
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="form-actions" style="margin-top: 20px;">
          <button @click="saveEdit" class="btn-save">💾 Cập nhật</button>
          <button @click="showEditModal = false" class="btn-cancel">✕ Hủy</button>
        </div>
      </div>
    </div>
    <!-- Modal Progress -->
    <div v-if="showProgressModal" class="modal-overlay" @click.self="showProgressModal = false">
      <div class="modal-content relative-modal">
        <h3 class="form-title">📈 Cập Nhật Tiến Độ</h3>

        <!-- History Display -->
        <div class="progress-history-section" v-if="progressTodo && progressTodo.progressHistory && progressTodo.progressHistory.length > 0">
          <h4 style="font-size: 14px; margin-bottom: 10px; color: #4b5563;">Lịch sử cập nhật:</h4>
          <div class="history-list">
            <div class="history-item" v-for="(h, idx) in progressTodo.progressHistory" :key="idx">
              <div class="history-date">{{ formatDate(h.date) }}</div>
              <div class="history-meta"><span class="pct">{{ h.percent }}%</span> - {{ h.text }}</div>
            </div>
          </div>
        </div>
        
        <div class="form-group" style="margin-top: 15px;">
          <label>Phần trăm hoàn thành: {{ progressPercent }}%</label>
          <input v-model.number="progressPercent" type="range" min="0" max="100" class="form-range" />
        </div>

        <div class="form-group">
          <label>Nội dung đạt được</label>
          <textarea v-model="progressText" class="form-input form-textarea" rows="3" placeholder="Hôm nay bạn đã làm được gì?"></textarea>
        </div>

        <div class="form-actions" style="margin-top: 20px;">
          <button @click="saveProgress" class="btn-save">💾 Lưu Tiến Độ</button>
          <button @click="showProgressModal = false" class="btn-cancel">✕ Hủy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin-top: 5px;
  display: block;
}

.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
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
  height: calc(100vh - 40px);
  position: sticky;
  top: 20px;
  overflow-y: auto;
}

.profile-section {
  text-align: center;
}

.avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  background: linear-gradient(135deg, #16a34a 0%, #14532d 100%);
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
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 2px;
}

.category-item.cat-active {
  background: #f0fdf4;
  color: #16a34a;
}

.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name {
  flex: 1;
  font-weight: 500;
}

.cat-count {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 1px 7px;
  border-radius: 10px;
}

.category-item.cat-active .cat-count {
  background: #dcfce7;
  color: #16a34a;
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
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.nav {
  display: flex;
  gap: 30px;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.nav-item {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 16px;
  position: relative;
  border-radius: 6px;
}

.nav-item:hover {
  color: #1f2937;
  background: #f3f4f6;
}

.nav-item.active {
  color: #22c55e;
  background: #f0fdf4;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
  height: 3px;
  background: #22c55e;
  border-radius: 2px;
}

/* Content */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.page-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  font-size: 28px;
  color: #1f2937;
  font-weight: 700;
  line-height: 1.4;
  padding-top: 5px;
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
  border-color: #22c55e;
  color: #22c55e;
  background: #f0fdf4;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  border-color: #22c55e;
  color: #22c55e;
}

.filter-tab.active {
  background: #22c55e;
  border-color: #22c55e;
  color: white;
}

/* Task List */
.task-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 30px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.task-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.task-card:last-child {
  border-bottom: none;
}

.task-card.completed {
  opacity: 0.6;
}

.task-card.completed .task-title {
  text-decoration: line-through;
  color: #9ca3af;
}

.task-icons-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.check-svg {
  cursor: pointer;
  color: #c8c8c8;
}

.check-svg.check-done {
  color: #10b981;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.task-title-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  color: #2d2d2d;
  flex: 1;
  letter-spacing: 0.01em;
  text-align: left;
}

.task-date-line {
  margin-top: 4px;
  text-align: left;
}

.task-datetime {
  font-size: 13px;
  color: #a0a0a0;
  font-weight: 400;
  text-align: left;
}

.task-edit {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.task-edit:hover {
  background: #f3f4f6;
  color: #22c55e;
}

.task-delete {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #d1d5db;
  font-size: 18px;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.task-delete:hover {
  color: #ef4444;
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

.add-title {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 15px;
  font-weight: 600;
}

.btn-new-task {
  width: 100%;
  max-width: 300px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
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
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.add-task-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 20px;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 10px;
  text-align: left;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.form-input {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
  background-color: white;
  cursor: pointer;
}

.form-input:focus {
  outline: none;
  border-color: #22c55e;
  background: white;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
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
  background: #22c55e;
  color: white;
}

.btn-save:hover {
  background: #16a34a;
}

.btn-cancel {
  background: #e5e7eb;
  color: #1f2937;
}

.btn-cancel:hover {
  background: #d1d5db;
}

/* HOME PAGE */
.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.home-card {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  padding: 25px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
  transition: transform 0.2s;
}

.home-card:hover {
  transform: translateY(-4px);
}

.card-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.home-card h3 {
  font-size: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.card-stat {
  font-size: 24px;
  font-weight: 700;
}

.home-section {
  background: #f9fafb;
  padding: 25px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.home-section h2 {
  font-size: 18px;
  color: #1f2937;
  margin-bottom: 20px;
  font-weight: 600;
}

.upcoming-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upcoming-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.upcoming-item span {
  font-size: 14px;
  color: #1f2937;
}

.upcoming-item span.completed {
  text-decoration: line-through;
  color: #9ca3af;
}

.upcoming-item .date {
  font-size: 12px;
  color: #22c55e;
  font-weight: 500;
}

.empty-message {
  text-align: center;
  padding: 30px;
  color: #9ca3af;
}

/* SETTINGS PAGE */
.settings-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

.settings-section {
  background: #f9fafb;
  padding: 25px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
}

.settings-section h2 {
  font-size: 18px;
  color: #1f2937;
  margin-bottom: 20px;
  font-weight: 600;
  padding-bottom: 15px;
  border-bottom: 2px solid #e5e7eb;
}

.setting-item {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.setting-input {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.setting-input:focus {
  outline: none;
  border-color: #22c55e;
  background: white;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.btn-settings {
  display: block;
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #1f2937;
  transition: all 0.2s;
}

.btn-settings:hover {
  border-color: #22c55e;
  color: #22c55e;
  background: #f0fdf4;
}

.settings-actions {
  text-align: center;
  margin-top: 20px;
}

.btn-save-settings {
  padding: 12px 30px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-save-settings:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

/* SUPPORT PAGE */
.support-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.faq-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-section h2 {
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.faq-item {
  background: #f9fafb;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.faq-item:hover {
  border-color: #22c55e;
  background: #f0fdf4;
}

.faq-item h3 {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 10px;
  font-weight: 600;
}

.faq-item p {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

.contact-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-section h2 {
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f9fafb;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.form-textarea {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #22c55e;
  background: white;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.btn-send {
  padding: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  margin-top: 10px;
}

.btn-send:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Responsive */
@media (max-width: 1024px) {
  .app-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    position: relative;
    top: 0;
  }

  .main-content {
    max-height: none;
  }

  .support-container {
    grid-template-columns: 1fr;
  }

  .nav {
    gap: 15px;
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
    gap: 8px;
  }

  .nav-item {
    font-size: 11px;
    padding: 6px 12px;
  }

  .home-grid {
    grid-template-columns: 1fr;
  }

  .title-section h1 {
    font-size: 22px;
  }
}

/* Modal Edit */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  animation: fadeIn 0.2s ease-out;
}

/* Login Styles */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.login-box h2 {
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 25px;
}

.login-form {
  text-align: left;
}

.btn-logout {
  margin-top: 15px;
  padding: 6px 12px;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #fca5a5;
}

.content-header h1 {
  line-height: 1.4;
  padding-top: 5px;
}

/* Progress UI */
.task-progress-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.2s;
  padding: 4px;
}
.task-progress-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.task-progress-display {
  margin-top: 10px;
}
.progress-bar-container {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #10b981);
  transition: width 0.3s ease;
}
.progress-text-display {
  font-size: 12px;
  color: #6b7280;
}
.progress-text-display .pct {
  font-weight: 600;
  color: #22c55e;
  margin-right: 4px;
}
.form-range {
  width: 100%;
  margin-top: 8px;
}

/* History Progress UI */
.relative-modal {
  max-height: 90vh;
  overflow-y: auto;
}
.progress-history-section {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  max-height: 150px;
  overflow-y: auto;
}
.history-item {
  border-left: 3px solid #22c55e;
  padding-left: 8px;
  margin-bottom: 8px;
  max-width: 100%;
  word-wrap: break-word;
}
.history-item:last-child {
  margin-bottom: 0;
}
.history-date {
  font-size: 11px;
  color: #9ca3af;
}
.history-meta {
  font-size: 13px;
  color: #374151;
}
.history-meta .pct {
  font-weight: bold;
  color: #10b981;
}

</style>