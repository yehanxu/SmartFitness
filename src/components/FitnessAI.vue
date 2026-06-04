<template>
  <div class="ai-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="sidebar-title" v-if="!sidebarCollapsed">对话历史</div>
        <button @click="sidebarCollapsed = !sidebarCollapsed" class="sidebar-toggle">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline v-if="sidebarCollapsed" points="15 18 21 12 15 6"/>
            <polyline v-else points="9 18 3 12 9 6"/>
          </svg>
        </button>
      </div>
      
      <!-- 新建对话按钮 -->
      <button @click="createNewChat" class="new-chat-btn" :class="{ collapsed: sidebarCollapsed }">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span v-if="!sidebarCollapsed">新对话</span>
      </button>

      <!-- 对话列表 -->
      <div class="chat-list" v-if="!sidebarCollapsed">
        <div
          v-for="chat in chatList"
          :key="chat.id"
          :class="['chat-item', { active: currentChatId === chat.id }]"
          @click="loadChat(chat.id)"
        >
          <div class="chat-title">{{ chat.title }}</div>
          <div class="chat-time">{{ formatChatTime(chat.updated_at) }}</div>
          <button @click.stop="deleteChat(chat.id)" class="delete-chat-btn">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
        <div v-if="chatList.length === 0" class="empty-chats">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>暂无对话记录</p>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div class="main-wrapper">
      <!-- 顶部导航栏 -->
      <header class="header">
        <div class="header-left">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span class="brand-name">AI 健身助手</span>
        </div>
        <div class="header-right">
          <div class="user-chip">
            <template v-if="userAvatar">
              <img :src="userAvatar" class="user-avatar-mini-img" />
            </template>
            <div v-else class="user-avatar-mini">{{ (username || 'U')[0] }}</div>
            <span class="user-name">{{ username }}</span>
          </div>
          <button @click="handleLogout" class="logout-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- 主体 -->
      <main class="main-content">
        <div class="chat-wrapper">
        <!-- 聊天消息区域 -->
        <div class="chat-messages" ref="chatContainer">
          <!-- 欢迎卡片（无消息时显示） -->
          <div v-if="messages.length === 0" class="welcome-card">
            <div class="welcome-glow"></div>
            <div class="welcome-avatar">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h2 class="welcome-title">你好，{{ username }}！</h2>
            <p class="welcome-desc">我是你的专属 AI 健身教练，可以根据你的训练数据和计划，为你提供个性化的健身建议。</p>
            <div class="quick-chips">
              <button
                v-for="chip in quickSuggestions"
                :key="chip"
                class="chip"
                @click="sendQuick(chip)"
                :disabled="loading"
              >{{ chip }}</button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message-row', msg.role]"
          >
            <div v-if="msg.role === 'assistant'" class="msg-avatar bot-avatar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div class="msg-bubble">
              <div class="msg-text" v-html="formatMessage(msg.content)"></div>
              <span class="msg-time">{{ msg.time }}</span>
            </div>
            <div v-if="msg.role === 'user'" class="msg-avatar user-avatar">
              {{ username ? username[0] : 'U' }}
            </div>
          </div>

          <!-- 等待首字符的加载动画 -->
          <div v-if="loading && streamingContent === ''" class="message-row assistant">
            <div class="msg-avatar bot-avatar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div class="msg-bubble loading-bubble">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>

          <!-- 流式输出中的消息 -->
          <div v-if="loading && streamingContent !== ''" class="message-row assistant">
            <div class="msg-avatar bot-avatar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div class="msg-bubble">
              <div class="msg-text" v-html="formatMessage(streamingContent)"></div>
              <span class="stream-cursor">|</span>
            </div>
          </div>
        </div>

        <!-- 底部输入区 -->
        <div class="input-area">
          <!-- 统计栏 -->
          <div class="stats-row" v-if="userStats">
            <div class="stat-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>{{ userStats.weeklyWorkouts }} 次训练</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>{{ userStats.totalDuration }} 分钟</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              <span>{{ userStats.totalCalories }} 千卡</span>
            </div>
          </div>

          <!-- 输入框 -->
          <form @submit.prevent="handleSend" class="input-form">
            <div class="input-wrapper">
              <input
                ref="inputRef"
                v-model="inputMessage"
                type="text"
                placeholder="输入你的健身问题，如「今天做什么训练好」..."
                :disabled="loading"
                @keydown.enter="handleSend"
              />
              <button
                type="submit"
                class="send-btn"
                :class="{ active: inputMessage.trim() && !loading }"
                :disabled="!inputMessage.trim() || loading"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </form>
          <p class="input-hint">AI 回答仅供参考，具体训练请根据自身情况调整</p>
        </div>
      </div>
    </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  userId: Number,
  username: String
})

const emit = defineEmits(['logout'])

const API_BASE = 'http://localhost:3001/api'
const inputMessage = ref('')
const loading = ref(false)
const streamingContent = ref('')
const messages = ref([])
const chatContainer = ref(null)
const inputRef = ref(null)
const userStats = ref(null)
const userAvatar = ref('')
const userInfo = ref(null)
const sidebarCollapsed = ref(false)
const chatList = ref([])
const currentChatId = ref(null)
let streamAbortController = null

const quickSuggestions = [
  '我今天的训练计划是什么？',
  '给我推荐一个减脂训练',
  '如何改善深蹲姿势？',
  '训练后应该吃什么？',
  '一周训练几次比较好？',
  '我最近的训练效果怎么样？',
  '训练后如何快速恢复？',
  '新手应该怎么开始健身？'
]

const formatTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const formatChatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

const formatMessage = (text) => {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTo({ top: chatContainer.value.scrollHeight, behavior: 'smooth' })
    }
  })
}

const sendQuick = (text) => {
  inputMessage.value = text
  handleSend()
}

const fetchUserStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/fitness/${props.userId}`)
    const data = await res.json()
    const records = data.records || []

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
    const [recordsRes, plansRes, userRes] = await Promise.all([
      fetch(`${API_BASE}/fitness/${props.userId}`),
      fetch(`${API_BASE}/plans/${props.userId}`),
      fetch(`${API_BASE}/user/${props.userId}`)
    ])
    const recordsData = await recordsRes.json()
    const plansData = await plansRes.json()
    const userData = await userRes.json()
    if (userData.user) {
      userInfo.value = userData.user
    }
    return {
      records: recordsData.records || [],
      plans: plansData.plans || [],
      userInfo: userData.user || {}
    }
  } catch (err) {
    console.error('获取用户上下文失败:', err)
    return { records: [], plans: [], userInfo: {} }
  }
}

const handleSend = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''

  messages.value.push({
    role: 'user',
    content: userMessage,
    time: formatTime()
  })
  scrollToBottom()

  loading.value = true
  streamingContent.value = ''
  streamAbortController = new AbortController()

  try {
    const context = await fetchUserContext()

    // 构建历史对话（仅传递角色和内容）
    const history = messages.value.slice(0, -1).map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: props.userId,
        username: props.username,
        message: userMessage,
        context: context,
        history: history
      }),
      signal: streamAbortController.signal
    })

    if (!res.ok) {
      // 非流式错误（如 4xx/5xx）
      const errData = await res.json().catch(() => ({}))
      messages.value.push({
        role: 'assistant',
        content: '抱歉，' + (errData.error || '请求失败'),
        time: formatTime()
      })
      loading.value = false
      streamingContent.value = ''
      return
    }

    // 读取 SSE 流
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            messages.value.push({
              role: 'assistant',
              content: '抱歉，' + parsed.error,
              time: formatTime()
            })
            streamingContent.value = ''
            loading.value = false
            return
          }
          if (parsed.content) {
            streamingContent.value += parsed.content
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      messages.value.push({
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后重试。',
        time: formatTime()
      })
    }
  } finally {
    // 如果流式写出了内容，确认到 messages 中
    if (streamingContent.value) {
      messages.value.push({
        role: 'assistant',
        content: streamingContent.value,
        time: formatTime()
      })
    }
    loading.value = false
    streamingContent.value = ''
    streamAbortController = null
    scrollToBottom()
    fetchUserStats()
    loadChatList() // 刷新对话列表
  }
}

const handleLogout = () => {
  localStorage.removeItem('currentUser')
  emit('logout')
}

// 加载对话列表
const loadChatList = async () => {
  try {
    const res = await fetch(`${API_BASE}/ai/chats/${props.userId}`)
    const data = await res.json()
    if (data.success) {
      chatList.value = data.chats
    }
  } catch (error) {
    console.error('加载对话列表失败:', error)
  }
}

// 加载对话详情
const loadChat = async (chatId) => {
  try {
    const res = await fetch(`${API_BASE}/ai/chat/${chatId}`)
    const data = await res.json()
    if (data.success) {
      const chat = data.chat
      currentChatId.value = chatId
      messages.value = chat.messages.map((msg, index) => ({
        ...msg,
        time: index === 0 ? formatChatTime(chat.created_at) : formatTime()
      }))
      setTimeout(scrollToBottom, 100)
    }
  } catch (error) {
    console.error('加载对话失败:', error)
  }
}

// 创建新对话
const createNewChat = () => {
  messages.value = []
  currentChatId.value = null
  inputRef.value?.focus()
}

// 删除对话
const deleteChat = async (chatId) => {
  if (!confirm('确定要删除这条对话吗？')) return
  
  try {
    const res = await fetch(`${API_BASE}/ai/chat/${chatId}`, {
      method: 'DELETE'
    })
    const data = await res.json()
    if (data.success) {
      chatList.value = chatList.value.filter(c => c.id !== chatId)
      if (currentChatId.value === chatId) {
        messages.value = []
        currentChatId.value = null
      }
    }
  } catch (error) {
    console.error('删除对话失败:', error)
  }
}

onMounted(() => {
  fetchUserStats()
  loadChatList()
  // 从 localStorage 读取头像
  try {
    const saved = localStorage.getItem('currentUser')
    if (saved) {
      const u = JSON.parse(saved)
      if (u.avatar) {
        userAvatar.value = `http://localhost:3001${u.avatar}`
      }
    }
  } catch {}
})
</script>

<style scoped>
/* ===== 整体布局 ===== */
.ai-container {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  flex-direction: row;
}

/* ===== 侧边栏 ===== */
.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e8eaed;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 56px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.sidebar-toggle {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f6f8;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.sidebar-toggle:hover {
  background: #e8eaed;
  color: #333;
}

.new-chat-btn {
  margin: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.new-chat-btn.collapsed {
  padding: 12px;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.chat-item {
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.chat-item:hover {
  background: #f5f6f8;
}

.chat-item.active {
  background: #eef2ff;
}

.chat-title {
  flex: 1;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-time {
  font-size: 12px;
  color: #999;
}

.delete-chat-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #ccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
}

.chat-item:hover .delete-chat-btn {
  opacity: 1;
}

.delete-chat-btn:hover {
  background: #f0f0f0;
  color: #ff4d4f;
}

.empty-chats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.empty-chats svg {
  margin-bottom: 12px;
}

.empty-chats p {
  font-size: 13px;
}

/* ===== 主内容区域 ===== */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ===== 顶部导航 ===== */
.header {
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.02em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 6px;
  background: #f5f6f8;
  border-radius: 22px;
}

.user-avatar-mini {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.user-avatar-mini-img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.logout-btn {
  width: 34px;
  height: 34px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.logout-btn:hover {
  color: #e74c3c;
  border-color: #f5c6cb;
  background: #fff5f5;
}

/* ===== 主体区域 ===== */
.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.chat-wrapper {
  width: 100%;
  max-width: 820px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 聊天消息区 ===== */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
  width: 5px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d0d5dd;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #b0b5bd;
}

/* ===== 欢迎卡片 ===== */
.welcome-card {
  text-align: center;
  padding: 40px 24px;
  position: relative;
  overflow: hidden;
}

.welcome-glow {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.welcome-avatar {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin: 0 auto 20px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
}

.welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.welcome-desc {
  font-size: 14px;
  color: #888;
  max-width: 360px;
  margin: 0 auto 28px;
  line-height: 1.6;
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 500px;
  margin: 0 auto;
}

.chip {
  padding: 10px 18px;
  background: #f5f6f8;
  border: 1px solid #eef0f2;
  border-radius: 22px;
  font-size: 13px;
  color: #444;
  cursor: pointer;
  transition: all 0.2s;
}

.chip:hover {
  background: #eef0ff;
  border-color: #c4c8f5;
  color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.12);
}

/* ===== 消息行 ===== */
.message-row {
  display: flex;
  gap: 10px;
  max-width: 82%;
  animation: msgIn 0.3s ease-out;
}

@keyframes msgIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-row.assistant {
  align-self: flex-start;
}

.message-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

/* ===== 头像 ===== */
.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.bot-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.user-avatar {
  background: #e8ecf0;
  color: #555;
  font-size: 13px;
  font-weight: 600;
}

/* ===== 消息气泡 ===== */
.msg-bubble {
  display: flex;
  flex-direction: column;
}

.msg-text {
  padding: 12px 16px;
  border-radius: 16px;
  line-height: 1.65;
  font-size: 14.5px;
  word-break: break-word;
}

.message-row.assistant .msg-text {
  background: #f5f6f8;
  color: #1a1a2e;
  border-bottom-left-radius: 6px;
}

.message-row.user .msg-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-bottom-right-radius: 6px;
}

.msg-time {
  font-size: 11px;
  color: #b0b5bd;
  margin-top: 5px;
  padding: 0 6px;
}

.message-row.user .msg-time {
  text-align: right;
}

/* ===== 加载动画 ===== */
.loading-bubble .msg-text {
  background: #f5f6f8;
  padding: 16px 20px;
}

.typing-dots {
  display: flex;
  gap: 5px;
  align-items: center;
  height: 10px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: #c0c5d0;
  border-radius: 50%;
  animation: dotBounce 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.35;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* ===== 输入区域 ===== */
.input-area {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafbfc;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  padding: 8px 14px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f2;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #667;
  flex: 1;
  justify-content: center;
  white-space: nowrap;
}

.stat-item svg {
  color: #667eea;
  flex-shrink: 0;
}

.stat-divider {
  width: 1px;
  height: 16px;
  background: #eef0f2;
}

.input-form {
  /* wrapper */
}

.input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
  background: #fff;
  border: 2px solid #e8eaed;
  border-radius: 30px;
  padding: 4px 4px 4px 20px;
  transition: all 0.25s;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.08);
}

.input-wrapper input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14.5px;
  padding: 12px 0;
  background: transparent;
  color: #1a1a2e;
}

.input-wrapper input::placeholder {
  color: #bcc0c8;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #e8eaed;
  color: #b0b5bd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  flex-shrink: 0;
}

.send-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-btn.active:hover {
  transform: scale(1.06);
}

.send-btn:disabled {
  cursor: not-allowed;
}

.input-hint {
  text-align: center;
  font-size: 11px;
  color: #c0c5cd;
  margin-top: 10px;
}

/* ===== 流式光标 ===== */
.stream-cursor {
  color: #667eea;
  font-weight: 700;
  font-size: 15px;
  animation: blink 0.8s infinite;
  margin-left: 2px;
  display: inline;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .header {
    padding: 0 16px;
    height: 52px;
  }

  .brand-name {
    font-size: 15px;
  }

  .user-name {
    display: none;
  }

  .main-content {
    padding: 0;
  }

  .chat-wrapper {
    border-radius: 0;
    box-shadow: none;
  }

  .chat-messages {
    padding: 16px 16px 8px;
    gap: 12px;
  }

  .message-row {
    max-width: 90%;
  }

  .input-area {
    padding: 12px 16px 16px;
  }

  .input-wrapper {
    padding: 2px 2px 2px 16px;
    border-radius: 26px;
  }

  .send-btn {
    width: 40px;
    height: 40px;
  }
}
</style>
