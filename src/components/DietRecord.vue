<template>
  <div class="diet-container">
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <div class="logo-text">
            <h1>饮食管理</h1>
            <p>🍴 记录每一餐，让健康可见</p>
          </div>
        </div>
        <div class="user-section">
          <div class="user-info">
            <span class="greeting">你好，</span>
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
      <!-- 今日概览 -->
      <div class="daily-summary">
        <div class="summary-card calories-card">
          <div class="summary-icon">
            <span>🔥</span>
          </div>
          <div class="summary-info">
            <span class="summary-label">今日摄入</span>
            <span class="summary-value">{{ todaySummary.totalCalories }} <small>卡</small></span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, todaySummary.totalCalories / 20) + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="summary-card protein-card">
          <div class="summary-icon">
            <span>🥩</span>
          </div>
          <div class="summary-info">
            <span class="summary-label">蛋白质</span>
            <span class="summary-value">{{ todaySummary.totalProtein }}<small>g</small></span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, todaySummary.totalProtein * 2) + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="summary-card carbs-card">
          <div class="summary-icon">
            <span>🍚</span>
          </div>
          <div class="summary-info">
            <span class="summary-label">碳水化合物</span>
            <span class="summary-value">{{ todaySummary.totalCarbs }}<small>g</small></span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, todaySummary.totalCarbs) + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="summary-card fat-card">
          <div class="summary-icon">
            <span>🥑</span>
          </div>
          <div class="summary-info">
            <span class="summary-label">脂肪</span>
            <span class="summary-value">{{ todaySummary.totalFat }}<small>g</small></span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(100, todaySummary.totalFat * 2) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- 添加饮食 -->
        <section class="add-section">
          <div class="section-header">
            <h2>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              添加今日饮食
            </h2>
          </div>
          <form @submit.prevent="handleAddDiet" class="diet-form">
            <div class="form-row">
              <div class="form-group">
                <label>📅 日期</label>
                <input v-model="newDiet.date" type="date" required />
              </div>
              <div class="form-group">
                <label>🍽️ 餐食类型</label>
                <select v-model="newDiet.meal_type" required>
                  <option value="">请选择</option>
                  <option value="早餐">🌅 早餐</option>
                  <option value="午餐">☀️ 午餐</option>
                  <option value="晚餐">🌙 晚餐</option>
                  <option value="加餐">🍪 加餐</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>🥗 食物名称</label>
                <input v-model="newDiet.food_name" type="text" placeholder="如：鸡胸肉、米饭" required />
              </div>
              <div class="form-group form-group-small">
                <label>⚖️ 份量</label>
                <input v-model="newDiet.portion" type="text" placeholder="如：200g、1碗" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>🔥 热量(卡)</label>
                <input v-model.number="newDiet.calories" type="number" min="0" placeholder="0" />
              </div>
              <div class="form-group form-group-small">
                <label>🥩 蛋白质(g)</label>
                <input v-model.number="newDiet.protein" type="number" min="0" step="0.1" placeholder="0" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>🍚 碳水(g)</label>
                <input v-model.number="newDiet.carbs" type="number" min="0" step="0.1" placeholder="0" />
              </div>
              <div class="form-group form-group-small">
                <label>🥑 脂肪(g)</label>
                <input v-model.number="newDiet.fat" type="number" min="0" step="0.1" placeholder="0" />
              </div>
            </div>
            <div class="form-group">
              <label>📝 备注</label>
              <input v-model="newDiet.notes" type="text" placeholder="口味、做法、感受等..." />
            </div>

            <!-- 快捷食物 -->
            <div class="quick-foods">
              <span class="quick-label">✨ 快捷添加：</span>
              <div class="quick-grid">
                <button type="button" @click="addQuickFood('鸡蛋', '1个', 70, 6, 1, 5)" class="quick-btn">
                  <span class="emoji">🥚</span>
                  <span class="name">鸡蛋</span>
                </button>
                <button type="button" @click="addQuickFood('鸡胸肉', '200g', 260, 46, 0, 6)" class="quick-btn">
                  <span class="emoji">🍗</span>
                  <span class="name">鸡胸肉</span>
                </button>
                <button type="button" @click="addQuickFood('米饭', '1碗', 200, 4, 45, 0.5)" class="quick-btn">
                  <span class="emoji">🍚</span>
                  <span class="name">米饭</span>
                </button>
                <button type="button" @click="addQuickFood('牛奶', '250ml', 160, 8, 12, 7)" class="quick-btn">
                  <span class="emoji">🥛</span>
                  <span class="name">牛奶</span>
                </button>
                <button type="button" @click="addQuickFood('香蕉', '1根', 90, 1, 23, 0.3)" class="quick-btn">
                  <span class="emoji">🍌</span>
                  <span class="name">香蕉</span>
                </button>
                <button type="button" @click="addQuickFood('西兰花', '200g', 70, 5, 13, 0.5)" class="quick-btn">
                  <span class="emoji">🥦</span>
                  <span class="name">西兰花</span>
                </button>
                <button type="button" @click="addQuickFood('全麦面包', '2片', 160, 6, 30, 2)" class="quick-btn">
                  <span class="emoji">🍞</span>
                  <span class="name">面包</span>
                </button>
                <button type="button" @click="addQuickFood('三文鱼', '150g', 310, 34, 0, 18)" class="quick-btn">
                  <span class="emoji">🐟</span>
                  <span class="name">三文鱼</span>
                </button>
              </div>
            </div>

            <button type="submit" class="add-btn" :disabled="loading">
              <span v-if="loading" class="loader"></span>
              <span v-else>✅ 保存记录</span>
            </button>
          </form>
        </section>

        <!-- 历史记录 -->
        <section class="history-section">
          <div class="section-header">
            <h2>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              饮食记录
            </h2>
            <span class="record-count" v-if="groupedRecords.length > 0">📊 {{ totalRecords }} 条记录</span>
          </div>

          <div v-if="groupedRecords.length === 0" class="empty-state">
            <span class="empty-icon">🍽️</span>
            <p>还没有饮食记录</p>
            <span>开始记录你的每日饮食吧！</span>
          </div>

          <div v-else class="records">
            <div v-for="group in groupedRecords" :key="group.date" class="date-group">
              <div class="date-header">
                <div class="date-info">
                  <span class="date-text">{{ group.dateLabel }}</span>
                  <span class="date-total">🔥 总计 {{ group.totalCalories }} 卡</span>
                </div>
              </div>
              <div v-for="record in group.records" :key="record.id" class="record-card">
                <div class="record-left">
                  <div :class="['meal-tag', 'meal-' + record.meal_type]">
                    {{ record.meal_type }}
                  </div>
                  <div class="record-main">
                    <div class="food-name">
                      {{ record.food_name }}
                      <span v-if="record.portion" class="portion">({{ record.portion }})</span>
                    </div>
                  </div>
                </div>
                <div class="record-right">
                  <div class="record-stats">
                    <div class="stat-item">
                      <span class="stat-icon">🔥</span>
                      <span class="stat-text">{{ record.calories }} 卡</span>
                    </div>
                    <div v-if="record.protein" class="stat-item">
                      <span class="stat-icon">🥩</span>
                      <span class="stat-text">{{ record.protein }}g</span>
                    </div>
                    <div v-if="record.carbs" class="stat-item">
                      <span class="stat-icon">🍚</span>
                      <span class="stat-text">{{ record.carbs }}g</span>
                    </div>
                    <div v-if="record.fat" class="stat-item">
                      <span class="stat-icon">🥑</span>
                      <span class="stat-text">{{ record.fat }}g</span>
                    </div>
                  </div>
                  <button @click="handleDelete(record.id)" class="delete-btn" title="删除">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div v-if="record.notes" class="record-notes">
                  <span class="notes-icon">📝</span>
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
import { ref, reactive, computed, onMounted } from 'vue'

const props = defineProps({
  userId: Number,
  username: String
})

const emit = defineEmits(['logout'])

const API_BASE = 'http://localhost:3001/api'
const allRecords = ref([])
const loading = ref(false)

const newDiet = reactive({
  date: '',
  meal_type: '',
  food_name: '',
  portion: '',
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  notes: ''
})

onMounted(() => {
  newDiet.date = new Date().toISOString().split('T')[0]
  fetchRecords()
})

const fetchRecords = async () => {
  try {
    const res = await fetch(`${API_BASE}/diet/${props.userId}`)
    const data = await res.json()
    allRecords.value = (data.records || []).sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (err) {
    console.error('获取饮食记录失败:', err)
  }
}

const totalRecords = computed(() => allRecords.value.length)

const groupedRecords = computed(() => {
  const groups = {}
  const mealOrder = { '早餐': 0, '午餐': 1, '晚餐': 2, '加餐': 3 }

  allRecords.value.forEach(r => {
    if (!groups[r.date]) {
      groups[r.date] = { date: r.date, dateLabel: formatDate(r.date), records: [], totalCalories: 0 }
    }
    groups[r.date].records.push(r)
    groups[r.date].totalCalories += r.calories || 0
  })

  Object.values(groups).forEach(g => {
    g.records.sort((a, b) => (mealOrder[a.meal_type] ?? 4) - (mealOrder[b.meal_type] ?? 4))
  })

  return Object.values(groups)
})

const todaySummary = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = allRecords.value.filter(r => r.date === today)
  return {
    totalCalories: todayRecords.reduce((s, r) => s + (r.calories || 0), 0),
    totalProtein: todayRecords.reduce((s, r) => s + (r.protein || 0), 0),
    totalCarbs: todayRecords.reduce((s, r) => s + (r.carbs || 0), 0),
    totalFat: todayRecords.reduce((s, r) => s + (r.fat || 0), 0)
  }
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().split('T')[0]) return '今天'
  if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天'

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[date.getDay()]

  return `${date.getMonth() + 1}月${date.getDate()}日 · ${weekDay}`
}

const addQuickFood = (name, portion, calories, protein, carbs, fat) => {
  newDiet.food_name = name
  newDiet.portion = portion
  newDiet.calories = calories
  newDiet.protein = protein
  newDiet.carbs = carbs
  newDiet.fat = fat
}

const handleAddDiet = async () => {
  if (!newDiet.meal_type || !newDiet.food_name) return

  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/diet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: props.userId,
        date: newDiet.date,
        meal_type: newDiet.meal_type,
        food_name: newDiet.food_name,
        portion: newDiet.portion,
        calories: newDiet.calories || 0,
        protein: newDiet.protein || 0,
        carbs: newDiet.carbs || 0,
        fat: newDiet.fat || 0,
        notes: newDiet.notes
      })
    })

    if (res.ok) {
      newDiet.meal_type = ''
      newDiet.food_name = ''
      newDiet.portion = ''
      newDiet.calories = null
      newDiet.protein = null
      newDiet.carbs = null
      newDiet.fat = null
      newDiet.notes = ''
      newDiet.date = new Date().toISOString().split('T')[0]
      fetchRecords()
    }
  } catch (err) {
    console.error('添加饮食记录失败:', err)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('确定要删除这条饮食记录吗？')) return

  try {
    const res = await fetch(`${API_BASE}/diet/${id}`, { method: 'DELETE' })
    if (res.ok) fetchRecords()
  } catch (err) {
    console.error('删除失败:', err)
  }
}

const handleLogout = () => {
  localStorage.removeItem('currentUser')
  emit('logout')
}
</script>

<style scoped>
.diet-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px 24px;
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
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.logo-text h1 {
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.logo-text p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
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
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
}

.username {
  color: #fff;
  font-weight: 600;
  font-size: 15px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 12px 18px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 36px 24px;
}

.daily-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.summary-card {
  background: #fff;
  border-radius: 20px;
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.calories-card { border-left: 4px solid #ff6b6b; }
.protein-card { border-left: 4px solid #4ecdc4; }
.carbs-card { border-left: 4px solid #ffe66d; }
.fat-card { border-left: 4px solid #a8e6cf; }

.summary-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: #f8f9fa;
}

.calories-card .summary-icon { background: #fff0f0; }
.protein-card .summary-icon { background: #f0fffb; }
.carbs-card .summary-icon { background: #fffbf0; }
.fat-card .summary-icon { background: #f0fff5; }

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.summary-label {
  font-size: 12px;
  color: #868e96;
  font-weight: 500;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #212529;
  line-height: 1.2;
}

.summary-value small {
  font-size: 14px;
  font-weight: 400;
  color: #868e96;
}

.progress-bar {
  height: 6px;
  background: #f1f3f5;
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.calories-card .progress-fill { background: linear-gradient(90deg, #ff6b6b, #ff8787); }
.protein-card .progress-fill { background: linear-gradient(90deg, #4ecdc4, #63e6be); }
.carbs-card .progress-fill { background: linear-gradient(90deg, #ffe66d, #ffd43b); }
.fat-card .progress-fill { background: linear-gradient(90deg, #a8e6cf, #8ce99a); }

.content-grid {
  display: grid;
  grid-template-columns: 440px 1fr;
  gap: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #212529;
  font-size: 20px;
  font-weight: 600;
}

.section-header h2 svg { color: #667eea; }

.record-count {
  background: #667eea;
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.add-section {
  background: #fff;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  height: fit-content;
}

.diet-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr;
  gap: 16px;
}

.form-row-4 {
  display: flex;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row-4 .form-group:first-child {
  flex: 1.2;
}

.form-row-4 .form-group:not(:first-child) {
  flex: 0.7;
  min-width: 100px;
}

.form-group label {
  font-size: 13px;
  color: #495057;
  font-weight: 600;
}

.form-group input,
.form-group select {
  padding: 14px 12px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  transition: all 0.3s;
  background: #f8f9fa;
  font-weight: 500;
  width: 100%;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.quick-foods {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: #f8f9fa;
  border-radius: 16px;
}

.quick-label {
  font-size: 12px;
  color: #868e96;
  font-weight: 600;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.quick-btn {
  background: #fff;
  border: 2px solid #e9ecef;
  padding: 12px 10px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  color: #495057;
}

.quick-btn:hover {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.quick-btn .emoji {
  font-size: 22px;
}

.quick-btn .name {
  font-size: 12px;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 16px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.add-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.loader {
  width: 22px; height: 22px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

.history-section {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 32px;
  backdrop-filter: blur(20px);
}

.history-section .section-header h2 { color: #fff; }
.history-section .section-header h2 svg { color: rgba(255,255,255,0.9); }

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: rgba(255, 255, 255, 0.85);
}

.empty-icon { font-size: 56px; display: block; margin-bottom: 20px; }

.empty-state p {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-state span { font-size: 15px; opacity: 0.75; }

.records {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-text {
  color: #fff;
  font-size: 17px;
  font-weight: 600;
}

.date-total {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 14px;
  font-weight: 500;
}

.record-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.record-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.record-main {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meal-tag {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.meal-早餐 { background: #fff3e0; color: #e65100; }
.meal-午餐 { background: #ffebee; color: #c62828; }
.meal-晚餐 { background: #e8eaf6; color: #283593; }
.meal-加餐 { background: #e8f5e9; color: #2e7d32; }

.food-name {
  font-size: 17px;
  font-weight: 600;
  color: #212529;
}

.portion {
  font-size: 14px;
  color: #868e96;
  font-weight: 400;
  margin-left: 6px;
}

.record-right {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.record-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-icon {
  font-size: 14px;
}

.stat-text {
  font-size: 13px;
  color: #495057;
  font-weight: 600;
}

.delete-btn {
  background: #fff5f5;
  border: none;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  color: #ff6b6b;
  transition: all 0.3s;
}

.delete-btn:hover {
  background: #ff6b6b;
  color: #fff;
  transform: scale(1.1);
}

.record-notes {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px dashed #e9ecef;
  font-size: 14px;
  color: #868e96;
}

.notes-icon {
  font-size: 14px;
}

@media (max-width: 960px) {
  .content-grid { grid-template-columns: 1fr; }
  .daily-summary { grid-template-columns: repeat(2, 1fr); }
  .form-row-4 { grid-template-columns: repeat(2, 1fr); }
  .quick-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 640px) {
  .header-content { flex-direction: column; gap: 16px; align-items: flex-start; }
  .daily-summary { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .form-row-4 { grid-template-columns: repeat(2, 1fr); }
  .quick-grid { grid-template-columns: repeat(4, 1fr); }
  .record-right { flex-direction: column; align-items: flex-start; }
  .record-stats { width: 100%; }
}
</style>
