<template>
  <div class="fitness-container">
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6.5 6.5h11v11h-11z"/>
              <path d="M6.5 2.5v4"/>
              <path d="M2.5 6.5h4"/>
              <path d="M17.5 2.5v4"/>
              <path d="M21.5 6.5h-4"/>
              <path d="M6.5 17.5v4"/>
              <path d="M2.5 17.5h4"/>
              <path d="M17.5 17.5v4"/>
              <path d="M21.5 17.5h-4"/>
            </svg>
          </div>
          <div class="logo-text">
            <h1>健身记录</h1>
            <p>记录每一次进步</p>
          </div>
        </div>
        <div class="user-section">
          <div class="user-info">
            <span class="greeting">早上好，</span>
            <span class="username">{{ username }}</span>
          </div>
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
      <div class="content-grid">
        <section class="add-record-section">
          <div class="section-header">
            <h2>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              添加记录
            </h2>
          </div>
          <form @submit.prevent="handleAddRecord" class="record-form">
            <div class="form-row">
              <div class="form-group">
                <label>日期</label>
                <input v-model="newRecord.date" type="date" required />
              </div>
              <div class="form-group">
                <label>运动类型</label>
                <select v-model="newRecord.workout_type" required>
                  <option value="">请选择</option>
                  <option value="跑步">🏃 跑步</option>
                  <option value="游泳">🏊 游泳</option>
                  <option value="健身">💪 健身</option>
                  <option value="瑜伽">🧘 瑜伽</option>
                  <option value="骑行">🚴 骑行</option>
                  <option value="篮球">🏀 篮球</option>
                  <option value="足球">⚽ 足球</option>
                  <option value="其他">🏋️ 其他</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>时长(分钟)</label>
                <div class="input-with-unit">
                  <input v-model.number="newRecord.duration" type="number" min="1" placeholder="0" required />
                  <span class="unit">分钟</span>
                </div>
              </div>
              <div class="form-group">
                <label>消耗卡路里</label>
                <div class="input-with-unit">
                  <input v-model.number="newRecord.calories" type="number" min="0" placeholder="0" />
                  <span class="unit">卡</span>
                </div>
              </div>
            </div>
            <div class="form-group full-width">
              <label>备注</label>
              <textarea v-model="newRecord.notes" placeholder="记录一下今天的运动感受..."></textarea>
            </div>
            <button type="submit" class="add-btn" :disabled="loading">
              <span v-if="loading" class="loader"></span>
              <span v-else>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                添加记录
              </span>
            </button>
          </form>
        </section>

        <section class="record-list-section">
          <div class="section-header">
            <h2>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              历史记录
            </h2>
            <span class="record-count" v-if="records.length > 0">{{ records.length }} 条记录</span>
          </div>
          
          <div v-if="records.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6.5 6.5h11v11h-11z"/>
                <path d="M6.5 2.5v4"/>
                <path d="M2.5 6.5h4"/>
                <path d="M17.5 2.5v4"/>
                <path d="M21.5 6.5h-4"/>
                <path d="M6.5 17.5v4"/>
                <path d="M2.5 17.5h4"/>
                <path d="M17.5 17.5v4"/>
                <path d="M21.5 17.5h-4"/>
              </svg>
            </div>
            <p>还没有记录</p>
            <span>开始添加你的第一条健身记录吧！</span>
          </div>

          <div v-else class="records">
            <div v-for="record in records" :key="record.id" class="record-card">
              <div class="record-date-badge">
                {{ formatDateBadge(record.date) }}
              </div>
              <div class="record-content">
                <div class="record-main">
                  <div class="workout-type">
                    <span class="emoji">{{ getWorkoutEmoji(record.workout_type) }}</span>
                    {{ record.workout_type }}
                  </div>
                  <button @click="handleDelete(record.id)" class="delete-btn" title="删除">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
                <div class="record-stats">
                  <div class="stat">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{{ record.duration }} 分钟</span>
                  </div>
                  <div class="stat">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    <span>{{ record.calories }} 卡</span>
                  </div>
                </div>
                <div v-if="record.notes" class="record-notes">
                  {{ record.notes }}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const props = defineProps({
  userId: Number,
  username: String
})

const emit = defineEmits(['logout'])

const API_BASE = 'http://localhost:3001/api'
const records = ref([])
const loading = ref(false)

const newRecord = reactive({
  date: '',
  workout_type: '',
  duration: null,
  calories: null,
  notes: ''
})

const workoutEmojis = {
  '跑步': '🏃',
  '游泳': '🏊',
  '健身': '💪',
  '瑜伽': '🧘',
  '骑行': '🚴',
  '篮球': '🏀',
  '足球': '⚽',
  '其他': '🏋️'
}

onMounted(() => {
  newRecord.date = new Date().toISOString().split('T')[0]
  fetchRecords()
})

const fetchRecords = async () => {
  try {
    const res = await fetch(`${API_BASE}/fitness/${props.userId}`)
    const data = await res.json()
    records.value = (data.records || []).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )
  } catch (err) {
    console.error('获取记录失败:', err)
  }
}

const getWorkoutEmoji = (type) => {
  return workoutEmojis[type] || '🏋️'
}

const handleAddRecord = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/fitness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: props.userId,
        date: newRecord.date,
        workout_type: newRecord.workout_type,
        duration: newRecord.duration,
        calories: newRecord.calories || 0,
        notes: newRecord.notes
      })
    })

    if (res.ok) {
      newRecord.workout_type = ''
      newRecord.duration = null
      newRecord.calories = null
      newRecord.notes = ''
      newRecord.date = new Date().toISOString().split('T')[0]
      fetchRecords()
    }
  } catch (err) {
    console.error('添加记录失败:', err)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('确定要删除这条记录吗？')) return
  
  try {
    const res = await fetch(`${API_BASE}/fitness/${id}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      fetchRecords()
    }
  } catch (err) {
    console.error('删除记录失败:', err)
  }
}

const formatDateBadge = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (dateStr === today.toISOString().split('T')[0]) return '今天'
  if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天'
  
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日${date.getFullYear() !== new Date().getFullYear() ? ',' + date.getFullYear() : ''}`
}

const handleLogout = () => {
  localStorage.removeItem('currentUser')
  emit('logout')
}
</script>

<style scoped>
.fitness-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 24px;
}

.header-content {
  max-width: 1200px;
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

.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  text-align: right;
}

.greeting {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.username {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.content-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.record-count {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.add-record-section {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  height: fit-content;
}

.record-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  transition: all 0.3s;
  background: #fafafa;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #667eea;
  background: #fff;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.input-with-unit {
  position: relative;
}

.input-with-unit input {
  width: 100%;
  padding-right: 50px;
}

.input-with-unit .unit {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 14px;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.add-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.add-btn .loader {
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

.record-list-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(10px);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.8);
}

.empty-icon {
  opacity: 0.5;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-state span {
  font-size: 14px;
  opacity: 0.7;
}

.records {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.record-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.record-date-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
}

.record-content {
  padding: 20px;
}

.record-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.workout-type {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.emoji {
  font-size: 24px;
}

.delete-btn {
  background: #f5f5f5;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s;
}

.delete-btn:hover {
  background: #fee;
  color: #ff4d4f;
}

.record-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.stat svg {
  color: #667eea;
}

.record-notes {
  padding-top: 12px;
  border-top: 1px dashed #eee;
  font-size: 14px;
  color: #888;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .user-info {
    text-align: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .main-content {
    padding: 20px 16px;
  }
}
</style>
