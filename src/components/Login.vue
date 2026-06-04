<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-card">
        <div class="card-header">
          <div class="logo">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1>{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h1>
          <p>{{ mode === 'login' ? '登录以继续您的健身之旅' : '注册以开始记录您的健身数据' }}</p>
        </div>
        
        <div class="tabs">
          <button 
            :class="{ active: mode === 'login' }" 
            @click="mode = 'login'"
          >登录</button>
          <button 
            :class="{ active: mode === 'register' }" 
            @click="mode = 'register'"
          >注册</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-item" :class="{ 'has-error': errors.username }">
            <label>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </label>
            <input 
              v-model="form.username" 
              type="text" 
              placeholder="用户名"
            />
          </div>
          <span v-if="errors.username" class="error-msg">{{ errors.username }}</span>

          <div v-if="mode === 'register'" class="form-item" :class="{ 'has-error': errors.email }">
            <label>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </label>
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="邮箱"
            />
          </div>
          <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>

          <div class="form-item" :class="{ 'has-error': errors.password }">
            <label>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </label>
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="密码"
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <span v-if="errors.password" class="error-msg">{{ errors.password }}</span>

          <div v-if="mode === 'login'" class="form-options">
            <label class="checkbox-label">
              <input v-model="form.remember" type="checkbox" />
              <span class="checkmark"></span>
              <span>记住密码</span>
            </label>
          </div>

          <div v-if="errorMessage" class="server-error">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMessage }}
          </div>

          <div class="verify-section">
            <SlideVerify ref="verifyRef" @verified="handleVerify" />
          </div>

          <span v-if="!verificationPassed && submitted" class="error-msg" style="text-align: center;">请先完成滑块验证</span>

          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="loading" class="loader"></span>
            <span v-else>{{ mode === 'login' ? '登 录' : '注 册' }}</span>
          </button>
        </form>

        <div class="card-footer">
          <p>{{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
            <a @click="mode = mode === 'login' ? 'register' : 'login'">
              {{ mode === 'login' ? '立即注册' : '立即登录' }}
            </a>
          </p>
        </div>
      </div>

      <div class="decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import SlideVerify from './SlideVerify.vue'

const emit = defineEmits(['loginSuccess'])

const API_BASE = 'http://localhost:3001/api'
const mode = ref('login')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const verificationPassed = ref(false)
const verifyRef = ref(null)

const form = reactive({
  username: '',
  email: '',
  password: '',
  remember: false
})

const errors = reactive({
  username: '',
  email: '',
  password: ''
})

const submitted = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('rememberedUser')
  if (saved) {
    const { username, password } = JSON.parse(saved)
    form.username = username
    form.password = password
    form.remember = true
  }
})

watch(mode, () => {
  resetVerification()
})

const validate = () => {
  let valid = true
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errorMessage.value = ''
  submitted.value = true

  if (!form.username.trim()) {
    errors.username = '请输入用户名'
    valid = false
  } else if (form.username.length < 3) {
    errors.username = '用户名至少3位'
    valid = false
  }

  if (mode.value === 'register') {
    if (!form.email.trim()) {
      errors.email = '请输入邮箱'
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = '请输入有效的邮箱地址'
      valid = false
    }
  }

  if (!form.password) {
    errors.password = '请输入密码'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = '密码长度不能少于6位'
    valid = false
  }

  if (!verificationPassed.value) {
    valid = false
  }

  return valid
}

const handleVerify = (success) => {
  verificationPassed.value = success
}

const resetVerification = () => {
  verificationPassed.value = false
  nextTick(() => {
    if (verifyRef.value) {
      verifyRef.value.reset()
    }
  })
}

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  errorMessage.value = ''

  try {
    const endpoint = mode.value === 'login' ? '/login' : '/register'
    const body = mode.value === 'login' 
      ? { username: form.username, password: form.password }
      : { username: form.username, email: form.email, password: form.password }
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.error || '请求失败'
      resetVerification()
      return
    }

    if (mode.value === 'login') {
      if (form.remember) {
        localStorage.setItem('rememberedUser', JSON.stringify({
          username: form.username,
          password: form.password
        }))
      } else {
        localStorage.removeItem('rememberedUser')
      }
      const user = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        gender: data.user.gender,
        real_name: data.user.real_name,
        favorite_sports: data.user.favorite_sports,
        bio: data.user.bio,
        avatar: data.user.avatar || ''
      }
      localStorage.setItem('currentUser', JSON.stringify(user))
      emit('loginSuccess', user)
    } else {
      alert('注册成功！请登录')
      mode.value = 'login'
      form.password = ''
    }
  } catch (err) {
    errorMessage.value = '网络错误，请检查后端服务是否启动'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-wrapper {
  position: relative;
  width: 100%;
  max-width: 420px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #fff;
}

.card-header h1 {
  color: #1a1a2e;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
}

.card-header p {
  color: #666;
  font-size: 14px;
}

.tabs {
  display: flex;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 28px;
}

.tabs button {
  flex: 1;
  background: none;
  border: none;
  padding: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.tabs button.active {
  background: #fff;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 12px;
  transition: all 0.3s;
}

.form-item:focus-within {
  border-color: #667eea;
  background: #fff;
}

.form-item.has-error {
  border-color: #ff4d4f;
}

.form-item label {
  padding-left: 16px;
  color: #888;
  display: flex;
  align-items: center;
}

.form-item input {
  flex: 1;
  padding: 16px;
  padding-left: 12px;
  border: none;
  background: transparent;
  font-size: 15px;
  outline: none;
  color: #1a1a2e;
}

.form-item input::placeholder {
  color: #aaa;
}

.toggle-password {
  background: none;
  border: none;
  padding: 12px 16px;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.toggle-password:hover {
  color: #667eea;
}

.error-msg {
  color: #ff4d4f;
  font-size: 12px;
  padding-left: 4px;
  margin-top: -2px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.checkbox-label input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.checkbox-label input:checked + .checkmark {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.checkbox-label input:checked + .checkmark::after {
  content: '';
  width: 6px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translateY(-1px);
}

.verify-section {
  margin: 16px 0;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
}

.server-error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ff4d4f;
  font-size: 14px;
  padding: 12px 16px;
  background: #fff2f0;
  border-radius: 10px;
  margin-bottom: 8px;
}

.login-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 54px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card-footer {
  text-align: center;
  margin-top: 24px;
  color: #888;
  font-size: 14px;
}

.card-footer a {
  color: #667eea;
  cursor: pointer;
  font-weight: 500;
}

.card-footer a:hover {
  text-decoration: underline;
}

.decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -80px;
  right: -60px;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: -50px;
  left: -40px;
}

.circle-3 {
  width: 80px;
  height: 80px;
  top: 50%;
  right: -30px;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  .card-header h1 {
    font-size: 22px;
  }
}
</style>
