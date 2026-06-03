<template>
  <div class="plan-container">
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="logo-text">
            <h1>健身计划</h1>
            <p>合理安排，持久进步</p>
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
      <div class="today-highlight" v-if="todayPlan">
        <div class="today-badge">
          <span class="day-name">{{ weekDays[todayPlan.day_of_week] }}</span>
          <span class="today-label">今日计划</span>
        </div>
        <div class="today-content">
          <div class="today-main">
            <span class="emoji">{{ getWorkoutEmoji(todayPlan.workout_type) }}</span>
            <div class="today-info">
              <h3>{{ todayPlan.workout_type }}</h3>
              <p v-if="todayPlan.notes">{{ todayPlan.notes }}</p>
            </div>
          </div>
          <div class="today-stats">
            <div class="stat-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{{ todayPlan.duration }} 分钟</span>
            </div>
            <div class="stat-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span>{{ todayPlan.calories }} 卡</span>
            </div>
          </div>
        </div>
      </div>

      <div class="week-grid">
        <div 
          v-for="day in weekDays" 
          :key="day.value"
          :class="['day-card', { active: selectedDay === day.value, today: isToday(day.value) }]"
          @click="selectDay(day.value)"
        >
          <span class="day-label">{{ day.label }}</span>
          <div class="day-preview" v-if="getPlanByDay(day.value)">
            <span class="preview-emoji">{{ getWorkoutEmoji(getPlanByDay(day.value).workout_type) }}</span>
            <span class="preview-type">{{ getPlanByDay(day.value).workout_type }}</span>
          </div>
          <span class="day-empty" v-else>未安排</span>
        </div>
      </div>

      <div class="plan-editor">
        <div class="editor-header">
          <h2>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {{ selectedDayLabel }} 训练计划
          </h2>
          <button v-if="currentPlan" @click="handleDelete" class="delete-plan-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            删除计划
          </button>
        </div>

        <form @submit.prevent="handleSave" class="plan-form">
          <div class="form-group">
            <label>训练类型</label>
            <select v-model="planForm.workout_type" required>
              <option value="">请选择训练类型</option>
              <option value="胸肌训练">💪 胸肌训练</option>
              <option value="背肌训练">💪 背肌训练</option>
              <option value="肩部训练">💪 肩部训练</option>
              <option value="臂部训练">💪 臂部训练</option>
              <option value="腿部和核心">🦵 腿部和核心</option>
              <option value="有氧运动">🏃 有氧运动</option>
              <option value="游泳">🏊 游泳</option>
              <option value="瑜伽">🧘 瑜伽/拉伸</option>
              <option value="骑行">🚴 骑行</option>
              <option value="篮球">🏀 篮球</option>
              <option value="足球">⚽ 足球</option>
              <option value="休息日">😴 休息日</option>
              <option value="其他">🏋️ 其他</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>训练时长</label>
              <div class="input-with-unit">
                <input v-model.number="planForm.duration" type="number" min="0" placeholder="0" required />
                <span class="unit">分钟</span>
              </div>
            </div>
            <div class="form-group">
              <label>预计消耗</label>
              <div class="input-with-unit">
                <input v-model.number="planForm.calories" type="number" min="0" placeholder="0" />
                <span class="unit">卡路里</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>训练内容备注</label>
            <textarea v-model="planForm.notes" placeholder="详细说明今天的训练内容，如：卧推4组、引体向上3组..."></textarea>
          </div>

          <button type="submit" class="save-btn" :disabled="loading">
            <span v-if="loading" class="loader"></span>
            <span v-else>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              保存计划
            </span>
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

const props = defineProps({
  userId: Number,
  username: String
})

const emit = defineEmits(['logout'])

const API_BASE = 'http://localhost:3001/api'
const plans = ref([])
const selectedDay = ref(new Date().getDay())
const loading = ref(false)

const weekDays = [
  { value: 0, label: '周日', name: '星期日' },
  { value: 1, label: '周一', name: '星期一' },
  { value: 2, label: '周二', name: '星期二' },
  { value: 3, label: '周三', name: '星期三' },
  { value: 4, label: '周四', name: '星期四' },
  { value: 5, label: '周五', name: '星期五' },
  { value: 6, label: '周六', name: '星期六' }
]

const planForm = reactive({
  workout_type: '',
  duration: null,
  calories: null,
  notes: ''
})

const selectedDayLabel = computed(() => {
  return weekDays.find(d => d.value === selectedDay.value)?.name || ''
})

const todayPlan = computed(() => {
  const today = new Date().getDay()
  return plans.value.find(p => p.day_of_week === today)
})

const currentPlan = computed(() => {
  return plans.value.find(p => p.day_of_week === selectedDay.value)
})

const isToday = (day) => new Date().getDay() === day

const getPlanByDay = (day) => {
  return plans.value.find(p => p.day_of_week === day)
}

const workoutEmojis = {
  '胸肌训练': '💪', '背肌训练': '💪', '肩部训练': '💪', '臂部训练': '💪',
  '腿部和核心': '🦵', '有氧运动': '🏃', '游泳': '🏊', '瑜伽': '🧘',
  '骑行': '🚴', '篮球': '🏀', '足球': '⚽', '休息日': '😴', '其他': '🏋️'
}

const getWorkoutEmoji = (type) => workoutEmojis[type] || '🏋️'

onMounted(() => {
  fetchPlans()
})

const fetchPlans = async () => {
  try {
    const res = await fetch(`${API_BASE}/plans/${props.userId}`)
    const data = await res.json()
    plans.value = data.plans || []
    
    // 如果当前选中日有计划，填充表单
    if (currentPlan.value) {
      fillForm(currentPlan.value)
    }
  } catch (err) {
    console.error('获取计划失败:', err)
  }
}

const fillForm = (plan) => {
  planForm.workout_type = plan.workout_type
  planForm.duration = plan.duration
  planForm.calories = plan.calories
  planForm.notes = plan.notes || ''
}

const selectDay = (day) => {
  selectedDay.value = day
  const plan = getPlanByDay(day)
  if (plan) {
    fillForm(plan)
  } else {
    planForm.workout_type = ''
    planForm.duration = null
    planForm.calories = null
    planForm.notes = ''
  }
}

const handleSave = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: props.userId,
        day_of_week: selectedDay.value,
        workout_type: planForm.workout_type,
        duration: planForm.duration,
        calories: planForm.calories || 0,
        notes: planForm.notes
      })
    })

    if (res.ok) {
      fetchPlans()
    }
  } catch (err) {
    console.error('保存计划失败:', err)
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!currentPlan.value) return
  if (!confirm(`确定要删除${selectedDayLabel}的训练计划吗？`)) return

  try {
    const res = await fetch(`${API_BASE}/plans/${currentPlan.value.id}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      planForm.workout_type = ''
      planForm.duration = null
      planForm.calories = null
      planForm.notes = ''
      fetchPlans()
    }
  } catch (err) {
    console.error('删除计划失败:', err)
  }
}

const handleLogout = () => {
  localStorage.removeItem('currentUser')
  emit('logout')
}
</script>

<style scoped>
.plan-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 24px;
}

.header-content {
  max-width: 1000px;
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
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
}

.today-highlight {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 24px;
}

.today-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  flex-shrink: 0;
}

.day-name {
  font-size: 16px;
  font-weight: 700;
}

.today-label {
  font-size: 11px;
  opacity: 0.9;
}

.today-content {
  flex: 1;
}

.today-main {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.emoji {
  font-size: 40px;
}

.today-info h3 {
  font-size: 22px;
  color: #1a1a2e;
  font-weight: 700;
  margin-bottom: 4px;
}

.today-info p {
  color: #888;
  font-size: 14px;
}

.today-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 15px;
}

.stat-item svg {
  color: #11998e;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.day-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.day-card:hover {
  background: rgba(255, 255, 255, 0.25);
}

.day-card.active {
  background: #fff;
  border-color: #11998e;
  box-shadow: 0 8px 25px rgba(17, 153, 142, 0.3);
}

.day-card.today {
  background: rgba(255, 255, 255, 0.2);
}

.day-card.today.active {
  background: #fff;
}

.day-label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
}

.day-card.active .day-label {
  color: #11998e;
}

.day-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.preview-emoji {
  font-size: 24px;
}

.preview-type {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.day-card.active .preview-type {
  color: #1a1a2e;
}

.day-empty {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.day-card.active .day-empty {
  color: #ccc;
}

.plan-editor {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.editor-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1a1a2e;
  font-size: 18px;
  font-weight: 600;
}

.editor-header h2 svg {
  color: #11998e;
}

.delete-plan-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  border: none;
  color: #999;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.delete-plan-btn:hover {
  background: #fee;
  color: #ff4d4f;
}

.plan-form {
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
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #11998e;
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
  padding-right: 70px;
}

.input-with-unit .unit {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 14px;
}

.save-btn {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.save-btn .loader {
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

@media (max-width: 768px) {
  .week-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .today-highlight {
    flex-direction: column;
    text-align: center;
  }
  
  .today-stats {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .week-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
