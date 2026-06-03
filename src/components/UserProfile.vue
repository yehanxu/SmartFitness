<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar">
          <svg v-if="userInfo.gender === 'male'" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
            <path d="M16 11.79A5 5 0 1 1 12.21 7"/>
          </svg>
          <svg v-else-if="userInfo.gender === 'female'" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
            <path d="M18 14.79A5 5 0 1 1 12.21 10"/>
            <path d="M12 14.79V17"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="user-info">
          <h2>{{ userInfo.real_name || userInfo.username }}</h2>
          <p class="username">@{{ userInfo.username }}</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="profile-form">
        <div class="form-section">
          <h3>基本信息</h3>
          
          <div class="form-row">
            <div class="form-item">
              <label>昵称</label>
              <input 
                v-model="form.real_name" 
                type="text" 
                placeholder="请输入昵称"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-item">
              <label>性别</label>
              <div class="gender-selector">
                <label 
                  class="gender-option" 
                  :class="{ active: form.gender === 'male' }"
                >
                  <input type="radio" v-model="form.gender" value="male" />
                  <span class="gender-icon">👨</span>
                  <span>男</span>
                </label>
                <label 
                  class="gender-option" 
                  :class="{ active: form.gender === 'female' }"
                >
                  <input type="radio" v-model="form.gender" value="female" />
                  <span class="gender-icon">👩</span>
                  <span>女</span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-item">
              <label>邮箱</label>
              <input 
                v-model="userInfo.email" 
                type="email" 
                disabled
                placeholder="邮箱"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>运动偏好</h3>
          
          <div class="form-row">
            <div class="form-item">
              <label>喜爱的运动</label>
              <div class="sports-chips">
                <button 
                  v-for="sport in sportsOptions" 
                  :key="sport.value"
                  type="button"
                  class="sport-chip"
                  :class="{ active: selectedSports.includes(sport.value) }"
                  @click="toggleSport(sport.value)"
                >
                  {{ sport.icon }} {{ sport.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>自我介绍</h3>
          
          <div class="form-row">
            <div class="form-item">
              <label>个人简介</label>
              <textarea 
                v-model="form.bio" 
                placeholder="介绍一下你自己..."
                rows="4"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="resetForm">取消</button>
          <button type="submit" class="btn-save" :disabled="loading">
            <span v-if="loading" class="loader"></span>
            <span v-else>保存修改</span>
          </button>
        </div>
      </form>

      <div v-if="message" class="message" :class="{ success: messageType === 'success' }">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['profile-updated'])

const API_BASE = 'http://localhost:3001/api'

const userInfo = ref({ ...props.user })
const loading = ref(false)
const message = ref('')
const messageType = ref('success')

const sportsOptions = [
  { value: 'running', label: '跑步', icon: '🏃' },
  { value: 'swimming', label: '游泳', icon: '🏊' },
  { value: 'gym', label: '健身', icon: '💪' },
  { value: 'yoga', label: '瑜伽', icon: '🧘' },
  { value: 'cycling', label: '骑行', icon: '🚴' },
  { value: 'basketball', label: '篮球', icon: '🏀' },
  { value: 'football', label: '足球', icon: '⚽' },
  { value: 'tennis', label: '网球', icon: '🎾' },
  { value: 'badminton', label: '羽毛球', icon: '🏸' },
  { value: 'dance', label: '跳舞', icon: '💃' }
]

const form = reactive({
  gender: '',
  real_name: '',
  favorite_sports: '',
  bio: ''
})

const selectedSports = ref([])

const initForm = () => {
  form.gender = userInfo.value.gender || ''
  form.real_name = userInfo.value.real_name || ''
  form.bio = userInfo.value.bio || ''
  
  if (userInfo.value.favorite_sports) {
    selectedSports.value = userInfo.value.favorite_sports.split(',')
  } else {
    selectedSports.value = []
  }
}

const toggleSport = (sport) => {
  const index = selectedSports.value.indexOf(sport)
  if (index > -1) {
    selectedSports.value.splice(index, 1)
  } else {
    selectedSports.value.push(sport)
  }
}

const resetForm = () => {
  initForm()
  message.value = ''
}

const handleSubmit = async () => {
  loading.value = true
  message.value = ''

  try {
    const res = await fetch(`${API_BASE}/user/${userInfo.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gender: form.gender,
        real_name: form.real_name,
        favorite_sports: selectedSports.value.join(','),
        bio: form.bio
      })
    })

    const data = await res.json()

    if (!res.ok) {
      message.value = data.error || '更新失败'
      messageType.value = 'error'
      return
    }

    message.value = '信息更新成功'
    messageType.value = 'success'
    
    userInfo.value.gender = form.gender
    userInfo.value.real_name = form.real_name
    userInfo.value.favorite_sports = selectedSports.value.join(',')
    userInfo.value.bio = form.bio

    localStorage.setItem('currentUser', JSON.stringify(userInfo.value))
    
    emit('profile-updated', { ...userInfo.value })
  } catch (err) {
    message.value = '网络错误'
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initForm()
})

watch(() => props.user, () => {
  userInfo.value = { ...props.user }
  initForm()
}, { deep: true })
</script>

<style scoped>
.profile-container {
  min-height: calc(100vh - 80px);
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.avatar {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.user-info h2 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
}

.user-info .username {
  margin: 0;
  opacity: 0.8;
  font-size: 14px;
}

.profile-form {
  padding: 32px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.form-row {
  margin-bottom: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 14px;
  font-weight: 500;
  color: #444;
}

.form-item input,
.form-item textarea {
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  transition: all 0.3s;
  background: #fafafa;
}

.form-item input:focus,
.form-item textarea:focus {
  border-color: #667eea;
  background: #fff;
}

.form-item input:disabled {
  background: #f0f0f0;
  color: #999;
}

.form-item textarea {
  resize: vertical;
  min-height: 100px;
}

.gender-selector {
  display: flex;
  gap: 16px;
}

.gender-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 15px;
}

.gender-option:hover {
  border-color: #667eea;
}

.gender-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.gender-option input {
  display: none;
}

.gender-icon {
  font-size: 20px;
}

.sports-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.sport-chip {
  padding: 10px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.sport-chip:hover {
  border-color: #667eea;
}

.sport-chip.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
}

.btn-cancel,
.btn-save {
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loader {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message {
  position: fixed;
  top: 100px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 14px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.message.success {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
}

.message.error {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
}
</style>