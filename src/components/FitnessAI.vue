<template>
  <div class="ai-container">
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="logo-text">
            <h1>AI 健身助手</h1>
            <p>智能推荐，科学训练</p>
          </div>
        </div>
        <div class="user-section">
          <button @click="handleLogout" class="logout-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            退出
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="chat-container">
        <div class="chat-messages" ref="chatContainer">
          <div class="welcome-message">
            <div class="ai-avatar">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div class="message-content">
              <p>你好！我是你的AI健身助手</p>
              <p>我可以根据你的健身记录和计划，为你提供个性化的训练建议。请问有什么可以帮你的？</p>
            </div>
          </div>

          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            :class="['message', msg.role]"
          >
            <div class="message-avatar" v-if="msg.role === 'assistant'">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
          </div>

          <div v-if="loading" class="message assistant">
            <div class="message-avatar">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-container">
          <div class="user-stats" v-if="userStats">
            <div class="stat-badge">
              <span class="stat-label">本周训练</span>
              <span class="stat-value">{{ userStats.weeklyWorkouts }}次</span>
            </div>
            <div class="stat-badge">
              <span class="stat-label">总时长</span>
              <span class="stat-value">{{ userStats.totalDuration }}分钟</span>
            </div>
            <div class="stat-badge">
              <span class="stat-label">消耗热量</span>
              <span class="stat-value">{{ userStats.totalCalories }}卡</span>
            </div>
          </div>
          <form @submit.prevent="handleSend" class="chat-input-form">
            <input 
              v-model="inputMessage"
              type="text"
              placeholder="输入你的健身问题..."
              :disabled="loading"
            />
            <button type="submit" :disabled="!inputMessage.trim() || loading">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'

const props = defineProps({
  userId: Number,
  username: String
})

const emit = defineEmits(['logout'])

const API_BASE = 'http://localhost:3001/api'
const inputMessage = ref('')
const loading = ref(false)
const messages = ref([])
const chatContainer = ref(null)
const userStats = ref(null)

const formatTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const formatMessage = (text) => {
  // 简单的格式化：换行和粗体
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const fetchUserStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/fitness/${props.userId}`)
    const data = await res.json()
    const records = data.records || []

    // 计算本周数据
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekRecords = records.filter(r => new Date(r.date) >= weekStart)

    userStats.value = {
      weeklyWorkouts: weekRecords.length,
      totalDuration: weekRecords.reduce((sum, r) => sum + (r.duration || 0), 0),
      totalCalories: weekRecords.reduce((sum, r) => sum + (r.calories || 0), 0)
    }
  } catch (err) {
    console.error('获取用户数据失败:', err)
  }
}

const fetchUserContext = async () => {
  try {
    const [recordsRes, plansRes] = await Promise.all([
      fetch(`${API_BASE}/fitness/${props.userId}`),
      fetch(`${API_BASE}/plans/${props.userId}`)
    ])

    const recordsData = await recordsRes.json()
    const plansData = await plansRes.json()

    return {
      records: recordsData.records || [],
      plans: plansData.plans || []
    }
  } catch (err) {
    console.error('获取用户上下文失败:', err)
    return { records: [], plans: [] }
  }
}

const handleSend = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userMessage,
    time: formatTime()
  })
  scrollToBottom()

  loading.value = true

  try {
    // 获取用户健身数据作为上下文
    const context = await fetchUserContext()

    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: props.userId,
        username: props.username,
        message: userMessage,
        context: context
      })
    })

    const data = await res.json()

    if (data.reply) {
      messages.value.push({
        role: 'assistant',
        content: data.reply,
        time: formatTime()
      })
    } else if (data.error) {
      messages.value.push({
        role: 'assistant',
        content: '抱歉，' + data.error,
        time: formatTime()
      })
    }
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，发生了错误，请稍后重试。',
      time: formatTime()
    })
  } finally {
    loading.value = false
    scrollToBottom()
    fetchUserStats() // 更新统计
  }
}

const handleLogout = () => {
  localStorage.removeItem('currentUser')
  emit('logout')
}

onMounted(() => {
  fetchUserStats()
})
</script>

<style scoped>
.ai-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 24px;
}

.header-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.logo-text h1 {
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 2px;
}

.logo-text p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.main-content {
  flex: 1;
  padding: 24px;
  display: flex;
  justify-content: center;
}

.chat-container {
  width: 100%;
  max-width: 800px;
  height: calc(100vh - 140px);
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-message {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 16px;
}

.ai-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  align-self: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #e8e8e8;
  color: #666;
}

.message-content {
  flex: 1;
}

.message-text {
  padding: 14px 18px;
  border-radius: 18px;
  line-height: 1.6;
  font-size: 15px;
}

.message.assistant .message-text {
  background: #f1f3f5;
  color: #1a1a2e;
  border-bottom-left-radius: 4px;
}

.message.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  padding: 0 8px;
}

.message.user .message-time {
  text-align: right;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

.chat-input-container {
  padding: 20px 24px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.user-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid #eee;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.chat-input-form {
  display: flex;
  gap: 12px;
}

.chat-input-form input {
  flex: 1;
  padding: 16px 20px;
  border: 2px solid #e8e8e8;
  border-radius: 50px;
  font-size: 15px;
  outline: none;
  transition: all 0.3s;
}

.chat-input-form input:focus {
  border-color: #667eea;
}

.chat-input-form button {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.chat-input-form button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.chat-input-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .chat-container {
    height: calc(100vh - 100px);
    border-radius: 16px;
  }

  .chat-messages {
    padding: 16px;
  }

  .message {
    max-width: 92%;
  }

  .user-stats {
    gap: 8px;
  }

  .stat-badge {
    padding: 6px 10px;
  }
}
</style>
