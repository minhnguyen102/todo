<script setup lang="ts">
import { ref } from 'vue';

interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

const props = defineProps<{
  todo: Todo | null;
}>();

const emit = defineEmits<{
  save: [todo: Todo];
  close: [];
}>();

const form = ref<Todo>(props.todo ? { ...props.todo } : {} as Todo);

// Format deadline untuk input datetime-local
const getFormattedDeadline = () => {
  if (!form.value.deadline) return '';
  
  const date = new Date(form.value.deadline);
  // Format: YYYY-MM-DDTHH:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const deadline = ref(getFormattedDeadline());

// Lưu thay đổi
const handleSave = () => {
  const updatedTodo = {
    ...form.value,
    deadline: deadline.value ? new Date(deadline.value).toISOString() : undefined
  };
  emit('save', updatedTodo);
};

// Đóng modal
const handleClose = () => {
  emit('close');
};

// Xử lý click ngoài modal
const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleClose();
  }
};
</script>

<template>
  <div class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal-content">
      <div class="modal-header">
        <h2>✏️ Chỉnh Sửa Công Việc</h2>
        <button @click="handleClose" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="title">Tiêu đề *</label>
          <input 
            id="title"
            v-model="form.title" 
            type="text" 
            placeholder="Nhập tiêu đề công việc"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="description">Mô tả</label>
          <textarea 
            id="description"
            v-model="form.description" 
            placeholder="Nhập mô tả chi tiết"
            class="form-textarea"
            rows="4"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="deadline">Deadline</label>
          <input 
            id="deadline"
            v-model="deadline" 
            type="datetime-local" 
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="completed">
            <input 
              id="completed"
              v-model="form.completed" 
              type="checkbox"
              class="form-checkbox"
            />
            <span>Đã hoàn thành</span>
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="handleClose" class="btn btn-cancel">Hủy</button>
        <button @click="handleSave" class="btn btn-save">Lưu</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #475569;
  font-size: 14px;
}

.form-group label input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.form-group label span {
  cursor: pointer;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  background-color: #f8fafc;
}

.form-textarea {
  resize: vertical;
}

.form-checkbox {
  cursor: pointer;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 2px solid #e2e8f0;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-cancel {
  background-color: #f1f5f9;
  color: #475569;
}

.btn-cancel:hover {
  background-color: #e2e8f0;
}

.btn-save {
  background-color: #667eea;
  color: white;
}

.btn-save:hover {
  background-color: #5a67d8;
}

@media (max-width: 480px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 15px;
  }
}
</style>
