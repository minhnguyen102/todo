<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  deadline?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  progressPercent?: number;
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
const sortBy = ref('newest'); 
const showAddForm = ref(false);
const currentPage = ref('todos');

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api/todos`;

// Edit modal
const showEditModal = ref(false);
const editingTodo = ref<Todo | null>(null);
const editTitle = ref('');
const editDescription = ref('');
const editDeadline = ref('');
const editCategory = ref('');
const editPriority = ref<'low' | 'medium' | 'high'>('medium');
const editProgress = ref(0); // Progress percent in edit modal

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
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }
  if (filterCategory.value !== 'all') {
    result = result.filter(t => t.category === filterCategory.value);
  }
  if (filterStatus.value === 'active') result = result.filter(t => !t.completed);
  if (filterStatus.value === 'completed') result = result.filter(t => t.completed);

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

const clearSearch = () => {
  searchQuery.value = '';
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
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Lỗi khi thêm công việc';
    showToast(msg, 'error');
  }
};

const toggleComplete = async (todo: Todo) => {
  if (todo.completed) return;
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

const openEditModal = (todo: Todo) => {
  editingTodo.value = todo;
  editTitle.value = todo.title;
  editDescription.value = todo.description || '';
  editDeadline.value = todo.deadline ? new Date(todo.deadline).toISOString().slice(0, 16) : '';
  editCategory.value = todo.category || 'Công việc';
  editPriority.value = todo.priority || 'medium';
  editProgress.value = todo.progressPercent || 0;
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
      progressPercent: editProgress.value,
    });
    const index = todos.value.findIndex(t => t._id === editingTodo.value!._id);
    if (index !== -1) todos.value[index] = response.data;
    showEditModal.value = false;
    showToast('✏️ Đã cập nhật công việc!');
  } catch {
    showToast('Lỗi khi cập nhật', 'error');
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy}, ${hh}:${min}`;
};

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

onMounted(() => {
  // Clear any stale auth headers from previous sessions
  if (axios.defaults.headers.common['Authorization']) {
    delete axios.defaults.headers.common['Authorization'];
  }
  fetchTodos();
  window.addEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar glass">
      <div class="brand-section">
        <div class="logo">
          <span>🎯</span>
        </div>
        <h2 class="gradient-text">TodoHub</h2>
        <p class="subtitle">Quản lý hiệu quả</p>
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
        <div class="stat-item progress-row">
          <div class="stat-number">{{ stats.progress }}%</div>
          <div class="stat-label">Tổng<br />tiến độ</div>
        </div>
      </div>

      <!-- Categories -->
      <div class="categories-section" v-if="currentPage === 'todos'">
        <h3>Danh mục</h3>
        <button
          class="category-item"
          :class="{ 'cat-active': filterCategory === 'all' }"
          @click="filterCategory = 'all'"
        >
          <span class="cat-dot" style="background: #64748b;"></span>
          <span class="cat-name">Tất cả</span>
          <span class="cat-count">{{ countByCategory['all'] }}</span>
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ 'cat-active': filterCategory === cat.name }"
          @click="filterCategory = cat.name"
        >
          <span class="cat-dot" :style="{ background: cat.color }"></span>
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-count">{{ countByCategory[cat.name] || 0 }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="header glass">
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
        </nav>
      </header>

      <div class="content">
        <!-- TRANG CHỦ -->
        <div v-if="currentPage === 'home'" class="page-content">
          <div class="content-header">
            <h1>🏠 Chào mừng bạn quay lại</h1>
            <p>Hôm nay bạn có {{ stats.todo }} việc cần hoàn thành.</p>
          </div>
          
          <div class="home-grid">
            <div class="home-card">
              <div class="card-icon">🚀</div>
              <h3>Đang thực hiện</h3>
              <p class="card-stat">{{ stats.todo }} việc</p>
            </div>
            <div class="home-card">
              <div class="card-icon">✨</div>
              <h3>Đã hoàn thành</h3>
              <p class="card-stat">{{ stats.completed }} việc</p>
            </div>
            <div class="home-card">
              <div class="card-icon">📊</div>
              <h3>Tổng cộng</h3>
              <p class="card-stat">{{ stats.total }} việc</p>
            </div>
          </div>

          <div class="home-section">
            <h2>Việc cần làm ngay</h2>
            <div v-if="filteredTodos.length > 0" class="mini-task-list">
              <div v-for="todo in filteredTodos.slice(0, 5)" :key="todo._id" class="mini-task-item">
                <span class="dot" :style="{ background: todo.completed ? '#cbd5e1' : '#22c55e' }"></span>
                <span class="title" :class="{ completed: todo.completed }">{{ todo.title }}</span>
                <span v-if="todo.deadline" class="deadline">{{ formatDate(todo.deadline) }}</span>
              </div>
            </div>
            <div v-else class="empty-message">
              <p>🎉 Tuyệt vời! Bạn không còn việc nào.</p>
            </div>
          </div>
        </div>

        <!-- VIỆC LÀM -->
        <div v-if="currentPage === 'todos'" class="page-content">
          <div class="content-header">
            <div class="title-section">
              <h1>📋 Công việc</h1>
              <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input v-model="searchQuery" placeholder="Tìm kiếm công việc..." type="text" />
                <button v-if="searchQuery" @click="clearSearch" class="clear-btn">&times;</button>
              </div>
            </div>

            <div class="filter-row">
              <div class="filter-tabs-container">
                <div class="filter-tabs">
                  <button
                    v-for="tab in ['all', 'active', 'completed']"
                    :key="tab"
                    :class="{ active: filterStatus === tab }"
                    @click="filterStatus = tab"
                    class="filter-tab"
                  >
                    {{ tab === 'all' ? 'TẤT CẢ' : tab === 'active' ? 'CHƯA LÀM' : 'ĐÃ XONG' }}
                  </button>
                </div>
              </div>
              <div class="sort-wrapper">
                <span class="sort-icon">⇅</span>
                <select v-model="sortBy" class="sort-select">
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="deadline">Hạn chót</option>
                  <option value="priority">Độ ưu tiên</option>
                </select>
              </div>
            </div>
          </div>

          <div class="task-list">
            <div
              v-for="todo in filteredTodos"
              :key="todo._id"
              class="task-card"
              :class="{ completed: todo.completed }"
            >
              <div class="task-status">
                <div 
                  class="check-circle" 
                  :class="{ checked: todo.completed }"
                  @click="toggleComplete(todo)"
                >
                  <span v-if="todo.completed">✓</span>
                </div>
              </div>

              <div class="task-info">
                <div class="task-main">
                  <h3 class="task-title">{{ todo.title }}</h3>
                  <div class="task-meta">
                    <span class="category-tag">
                      {{ todo.category }}
                    </span>
                    <span v-if="todo.deadline" class="deadline-tag">
                      📅 {{ formatDate(todo.deadline) }}
                    </span>
                  </div>
                </div>
                
                
                <div v-if="todo.progressPercent && !todo.completed" class="task-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: todo.progressPercent + '%' }"></div>
                  </div>
                  <span class="progress-label">{{ todo.progressPercent }}%</span>
                </div>
              </div>

              <div class="task-actions">
                <button @click="openEditModal(todo)" class="action-btn" title="Chỉnh sửa & Tiến độ">✏️</button>
                <button @click="deleteTodo(todo._id)" class="action-btn delete" title="Xóa">🗑️</button>
              </div>
            </div>

            <div v-if="filteredTodos.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <p>Không tìm thấy công việc nào</p>
            </div>
          </div>

          <button v-if="!showAddForm" @click="showAddForm = true" class="btn-fab">+</button>
        </div>
      </div>
    </main>

    <!-- Modal Form (Add) -->
    <Transition name="fade">
      <div v-if="showAddForm" class="modal-overlay" @click.self="showAddForm = false">
        <Transition name="zoom">
          <div v-if="showAddForm" class="form-card glass">
            <div class="modal-header">
              <h3>📝 Thêm công việc mới</h3>
              <button @click="showAddForm = false" class="close-btn">&times;</button>
            </div>
            <form @submit.prevent="addTodo" class="form-body">
              <div class="form-group">
                <label>Tên công việc *</label>
                <input v-model="newTaskTitle" type="text" placeholder="Hôm nay bạn cần làm gì?" required />
              </div>
              <div class="form-group">
                <label>Mô tả chi tiết</label>
                <textarea v-model="newTaskDescription" placeholder="Thêm ghi chú cho công việc này..." rows="3"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Danh mục</label>
                  <select v-model="newTaskCategory">
                    <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.icon }} {{ cat.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Độ ưu tiên</label>
                  <select v-model="newTaskPriority">
                    <option value="low">🟢 Thấp</option>
                    <option value="medium">🟡 Trung bình</option>
                    <option value="high">🔴 Cao</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Hạn chót</label>
                <input v-model="newTaskDeadline" type="datetime-local" />
              </div>
              <div class="form-footer">
                <button type="button" @click="showAddForm = false" class="btn-text">Hủy bỏ</button>
                <button type="submit" class="btn-primary">Tạo công việc</button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Modal Edit & Progress -->
    <Transition name="fade">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <Transition name="zoom">
          <div v-if="showEditModal" class="form-card glass">
            <div class="modal-header">
              <h3>✏️ Chỉnh sửa công việc</h3>
              <button @click="showEditModal = false" class="close-btn">&times;</button>
            </div>
            <div class="form-body">
              <div class="form-group">
                <label>Tên công việc</label>
                <input v-model="editTitle" type="text" />
              </div>
              <div class="form-group">
                <label>Mô tả chi tiết</label>
                <textarea v-model="editDescription" rows="3"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Danh mục</label>
                  <select v-model="editCategory">
                    <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.icon }} {{ cat.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Độ ưu tiên</label>
                  <select v-model="editPriority">
                    <option value="low">🟢 Thấp</option>
                    <option value="medium">🟡 Trung bình</option>
                    <option value="high">🔴 Cao</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Hạn chót</label>
                <input v-model="editDeadline" type="datetime-local" />
              </div>
              <div class="form-group progress-section">
                <label>Tiến độ công việc: <strong>{{ editProgress }}%</strong></label>
                <div class="slider-wrapper">
                  <input v-model.number="editProgress" type="range" min="0" max="100" class="range-input" />
                </div>
              </div>
            </div>
            <div class="form-footer">
              <button @click="showEditModal = false" class="btn-text">Đóng</button>
              <button @click="saveEdit" class="btn-primary">Cập nhật thay đổi</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Toast UI -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  font-family: var(--font-main);
  min-height: 100vh;
  background-image: 
    radial-gradient(at 0% 0%, rgba(34, 197, 94, 0.05) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.05) 0px, transparent 50%);
  padding: var(--spacing-lg);
  gap: var(--spacing-lg);
}

button, input, select, textarea {
  font-family: inherit;
}

.sidebar {
  width: 280px;
  border-radius: var(--radius-lg);
  padding: 40px var(--spacing-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 40px;
  height: calc(100vh - 48px);
  position: sticky;
  top: var(--spacing-lg);
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-md);
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.2);
}

.brand-section { text-align: center; }
.brand-section h2 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
.subtitle { color: var(--text-muted); font-size: 14px; }

.stats-section { display: flex; flex-direction: column; gap: 20px; }
.stat-item { display: flex; align-items: center; gap: var(--spacing-md); }
.stat-number { font-size: 32px; font-weight: 700; color: var(--text-main); }
.stat-label { font-size: 13px; color: var(--text-muted); line-height: 1.4; }
.progress-row { border-top: 1px solid var(--border-light); padding-top: 20px; }

.categories-section h3 { 
  font-size: 11px; text-transform: uppercase; color: var(--text-muted); 
  margin-bottom: var(--spacing-md); font-weight: 700; letter-spacing: 1.5px; 
}

.category-item { 
  display: flex; align-items: center; gap: 12px; padding: var(--spacing-sm) 12px; 
  border-radius: var(--radius-md); border: none; background: transparent; 
  cursor: pointer; width: 100%; 
}

.category-item:hover { background: var(--primary-light); }
.category-item.cat-active { background: white; box-shadow: var(--shadow-sm); }
.cat-dot { width: 8px; height: 8px; border-radius: 50%; }
.cat-name { flex: 1; text-align: left; font-weight: 500; font-size: 14px; }
.cat-count { 
  font-size: 11px; font-weight: 700; color: var(--text-muted); 
  background: var(--border-light); padding: 2px 8px; border-radius: var(--radius-full); 
}

.main-content { flex: 1; display: flex; flex-direction: column; gap: var(--spacing-lg); }
.header { padding: var(--spacing-sm); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }

.nav { display: flex; gap: var(--spacing-xs); }
.nav-item { 
  padding: 10px 20px; border: none; background: transparent; 
  border-radius: 12px; font-weight: 600; cursor: pointer; color: var(--text-muted); font-size: 13px;
}

.nav-item:hover { color: var(--primary); background: var(--primary-light); }
.nav-item.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2); }

.page-content { animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.home-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: var(--spacing-lg); }
.home-card { 
  background: white; padding: var(--spacing-xl); border-radius: var(--radius-lg); 
  box-shadow: var(--shadow-sm); text-align: center; border: 1px solid var(--border-light); 
}

.home-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-md); }
.card-icon { font-size: 48px; margin-bottom: var(--spacing-md); display: block; }
.card-stat { font-size: 28px; font-weight: 700; color: var(--text-main); }

.home-section { 
  margin-top: 40px; background: white; padding: var(--spacing-xl); 
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); 
}

.mini-task-list { margin-top: var(--spacing-md); }
.mini-task-item { 
  display: flex; align-items: center; gap: var(--spacing-md); padding: 12px; 
  background: var(--bg-main); border-radius: 12px; margin-bottom: 12px; 
}

.mini-task-item .dot { width: 8px; height: 8px; border-radius: 50%; }
.mini-task-item .title { flex: 1; font-weight: 500; font-size: 14px; }
.mini-task-item .title.completed { text-decoration: line-through; color: var(--text-muted); }

.title-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }

.search-wrapper { 
  position: relative; width: 320px; display: flex; align-items: center; 
}

.search-icon { 
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%); 
  font-size: 14px; opacity: 0.5; pointer-events: none;
}

.search-wrapper input { 
  width: 100%; padding: 12px 40px 12px 40px; border-radius: 14px; 
  border: 1px solid var(--border-light); font-size: 14px; background: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.search-wrapper input:focus { 
  border-color: var(--primary); outline: none;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1), var(--shadow-md);
}

.clear-btn { 
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%); 
  width: 24px; height: 24px; border: none; background: var(--bg-main); 
  border-radius: 50%; font-size: 16px; color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center; opacity: 0.7; transition: all 0.2s;
}

.clear-btn:hover { opacity: 1; background: var(--border-light); }

.filter-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; gap: 20px; }

.filter-tabs-container { background: rgba(0, 0, 0, 0.03); padding: 4px; border-radius: 16px; }

.filter-tabs { display: flex; gap: 4px; position: relative; }

.filter-tab { 
  padding: 10px 24px; border: none; background: transparent; border-radius: 12px; 
  font-size: 12px; font-weight: 800; cursor: pointer; color: var(--text-muted); 
  text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.3s ease;
}

.filter-tab:hover { color: var(--text-main); }

.filter-tab.active { 
  background: white; color: var(--primary); 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05), var(--shadow-sm);
}

.sort-wrapper { position: relative; display: flex; align-items: center; }

.sort-icon { 
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%); 
  font-size: 16px; opacity: 0.6; pointer-events: none; color: var(--primary);
  z-index: 1;
}

.sort-select { 
  padding: 10px 32px 10px 40px; border-radius: 14px; border: 1px solid var(--border-light); 
  font-size: 13px; font-weight: 600; background: white; cursor: pointer; 
  appearance: none; transition: all 0.2s; box-shadow: var(--shadow-sm); 
}

.sort-select:hover { border-color: var(--primary); background: var(--primary-light); }
.sort-select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1); }

.task-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.task-card { 
  background: white; padding: 20px; border-radius: var(--radius-md); 
  border: 1px solid var(--border-light); display: flex; gap: var(--spacing-md); align-items: flex-start; 
}

.task-card:hover { border-color: var(--primary); }
.task-actions { display: flex; align-items: center; gap: 4px; }

.check-circle { 
  width: 24px; height: 24px; border: 2px solid #cbd5e1; border-radius: 8px; 
  cursor: pointer; display: flex; align-items: center; justify-content: center; 
}

.check-circle.checked { background: var(--primary); border-color: var(--primary); color: white; }
.task-info { flex: 1; }
.task-title { font-size: 16px; font-weight: 600; color: var(--text-main); }
.task-meta { display: flex; gap: 12px; margin-top: 4px; font-size: 12px; color: var(--text-muted); align-items: center; }
.category-tag { 
  background: var(--primary-light); color: var(--primary-dark);
  padding: 2px 8px; border-radius: 6px; font-weight: 700; text-transform: uppercase; font-size: 10px; 
}

.action-btn { 
  width: 36px; height: 36px; border: none; background: transparent; cursor: pointer; 
  border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;
}

.action-btn:hover { background: var(--bg-main); }
.action-btn.delete:hover { color: var(--danger); background: #fef2f2; }

.btn-fab { 
  position: fixed; bottom: 40px; right: 40px; width: 64px; height: 64px; border-radius: 20px; 
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white; border: none; font-size: 32px; cursor: pointer; 
  box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
  display: flex; align-items: center; justify-content: center;
}

.btn-fab:hover { transform: scale(1.05) translateY(-5px); }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.form-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: 100%;
  max-width: 480px;
  border-radius: 28px;
  padding: 32px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  position: relative;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.modal-header h3 {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.5px;
  margin-bottom: 12px;
}

.form-group {
  margin-bottom: 24px;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 28px;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover { color: var(--danger); }

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input, 
.form-group select, 
.form-group textarea {
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid var(--border-light);
  font-size: 15px;
  background: rgba(248, 250, 252, 0.8);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02) inset;
}

.form-group textarea { resize: vertical; }

.form-group input:focus, 
.form-group select:focus, 
.form-group textarea:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
  outline: none;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.progress-section { 
  background: var(--primary-light); border-radius: 12px; padding: 16px; margin-top: 20px; 
}

.slider-wrapper { position: relative; margin-top: 12px; }
.range-input { 
  width: 100%; height: 8px; border-radius: 4px; background: #cbd5e1; outline: none;
  -webkit-appearance: none; appearance: none; z-index: 2; position: relative;
}

.range-input::-webkit-slider-thumb { 
  -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; 
  background: var(--primary); cursor: pointer; border: 4px solid white; box-shadow: var(--shadow-sm);
}

.form-footer {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.btn-primary {
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.2);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 20px rgba(34, 197, 94, 0.3);
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
}

.btn-text {
  padding: 14px 24px;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 15px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 14px;
  transition: all 0.2s ease;
}

.btn-text:hover {
  background: var(--bg-main);
  color: var(--text-main);
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.zoom-enter-active, .zoom-leave-active {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
}
.zoom-enter-from, .zoom-leave-to {
  transform: scale(0.85) translateY(20px);
  opacity: 0;
}
</style>