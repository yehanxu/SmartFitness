import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import initSqlJs from 'sql.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001
const DB_PATH = join(__dirname, 'users.db')

// 中间件
app.use(cors())
app.use(express.json())

// 配置文件上传（头像）
const UPLOAD_DIR = join(__dirname, '../uploads/avatars')
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    cb(null, `avatar-${req.params.userId}-${Date.now()}.${ext}`)
  }
})
const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 JPG/PNG/GIF/WebP 格式'))
    }
  }
})

// 静态文件服务（头像访问）
app.use('/uploads', express.static(join(__dirname, '../uploads')))

let db

// 初始化数据库
async function initDb() {
  const SQL = await initSqlJs()

  // 尝试读取已存在的数据库
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 如果users表没有email字段，添加它
  try {
    db.run(`ALTER TABLE users ADD COLUMN email TEXT UNIQUE`)
  } catch (e) {
    // 如果字段已存在，忽略错误
  }

  // 添加个人信息字段
  const fields = ['gender', 'real_name', 'favorite_sports', 'bio', 'avatar', 'status']
  fields.forEach(field => {
    try {
      db.run(`ALTER TABLE users ADD COLUMN ${field} TEXT`)
    } catch (e) {
      // 如果字段已存在，忽略错误
    }
  })

  // 创建日活记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_active (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      active_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建对话历史表
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT '',
      messages TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 创建健身记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS fitness_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      workout_type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      calories INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 创建健身计划表
  db.run(`
    CREATE TABLE IF NOT EXISTS fitness_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      workout_type TEXT NOT NULL,
      duration INTEGER NOT NULL,
      calories INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 创建饮食记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS diet_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      portion TEXT DEFAULT '',
      calories INTEGER DEFAULT 0,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 预制测试用户
  const result = db.exec("SELECT COUNT(*) as count FROM users")
  const count = result.length > 0 ? result[0].values[0][0] : 0
  if (count === 0) {
    const seedUsers = [
      { username: 'admin', password: '123456' },
      { username: 'user1', password: 'password123' }
    ]

    for (const user of seedUsers) {
      const hashedPassword = bcrypt.hashSync(user.password, 10)
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [user.username, hashedPassword])
    }
    
    // 添加默认健身计划
    const defaultPlans = [
      { day_of_week: 1, workout_type: '胸肌训练', duration: 60, calories: 400, notes: '卧推、飞鸟' },
      { day_of_week: 2, workout_type: '背肌训练', duration: 60, calories: 380, notes: '引体向上、划船' },
      { day_of_week: 3, workout_type: '有氧运动', duration: 45, calories: 350, notes: '跑步或游泳' },
      { day_of_week: 4, workout_type: '肩部训练', duration: 50, calories: 300, notes: '推举、侧平举' },
      { day_of_week: 5, workout_type: '腿部和核心', duration: 65, calories: 450, notes: '深蹲、硬拉、平板支撑' },
      { day_of_week: 6, workout_type: '瑜伽/拉伸', duration: 40, calories: 150, notes: '全身放松' },
      { day_of_week: 0, workout_type: '休息日', duration: 0, calories: 0, notes: '充分休息' }
    ]
    
    const stmt = db.prepare('INSERT INTO fitness_plans (user_id, day_of_week, workout_type, duration, calories, notes) VALUES (?, ?, ?, ?, ?, ?)')
    for (const plan of defaultPlans) {
      stmt.run([1, plan.day_of_week, plan.workout_type, plan.duration, plan.calories, plan.notes])
    }
    stmt.free()
  }

  saveDb()
  console.log('数据库初始化完成')
}

// 保存数据库到文件
function saveDb() {
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
}

// 辅助函数：执行查询并返回结果
function query(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

// 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: '用户名、邮箱和密码不能为空' })
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: '用户名至少3位，密码至少6位' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
      db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword])
    } catch (error) {
      console.error('SQL插入错误:', error)
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        if (error.message.includes('email')) {
          return res.status(400).json({ error: '邮箱已被注册' })
        } else {
          return res.status(400).json({ error: '用户名已存在' })
        }
      }
      return res.status(400).json({ error: '注册失败，请稍后重试' })
    }

    try {
      saveDb()
    } catch (error) {
      console.error('数据库保存错误:', error)
      return res.status(500).json({ error: '服务器错误，请稍后重试' })
    }

    res.json({ message: '注册成功' })
  } catch (error) {
    res.status(500).json({ error: '服务器错误' })
  }
})

// 登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const users = query('SELECT * FROM users WHERE username = ?', [username])

    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const user = users[0]
    
    // 检查用户是否被封禁
    if (user.status === 'banned') {
      return res.status(401).json({ error: '您的账号已被封禁，请联系管理员' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    res.json({ 
      message: '登录成功',
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email,
        gender: user.gender,
        real_name: user.real_name,
        favorite_sports: user.favorite_sports,
        bio: user.bio,
        avatar: user.avatar || ''
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 获取用户信息
app.get('/api/user/:userId', (req, res) => {
  try {
    const userId = req.params.userId
    const users = query('SELECT * FROM users WHERE id = ?', [userId])
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    const user = users[0]
    res.json({ 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        gender: user.gender,
        real_name: user.real_name,
        favorite_sports: user.favorite_sports,
        bio: user.bio,
        avatar: user.avatar || ''
      }
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 更新用户信息
app.put('/api/user/:userId', (req, res) => {
  try {
    const userId = req.params.userId
    const { gender, real_name, favorite_sports, bio } = req.body

    db.run(
      'UPDATE users SET gender = ?, real_name = ?, favorite_sports = ?, bio = ? WHERE id = ?',
      [gender, real_name, favorite_sports, bio, userId]
    )
    saveDb()
    
    res.json({ message: '信息更新成功' })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 上传头像
app.post('/api/upload-avatar/:userId', upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择图片' })
    }

    const userId = req.params.userId
    const avatarUrl = `/uploads/avatars/${req.file.filename}`

    db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId])
    saveDb()

    res.json({ message: '头像上传成功', avatar: avatarUrl })
  } catch (error) {
    console.error('头像上传错误:', error)
    res.status(500).json({ error: '头像上传失败' })
  }
})

// 获取健身记录列表
app.get('/api/fitness/:userId', (req, res) => {
  try {
    const userId = req.params.userId
    const records = query('SELECT * FROM fitness_records WHERE user_id = ? ORDER BY date DESC', [userId])
    res.json({ records })
  } catch (error) {
    console.error('获取记录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 添加健身记录
app.post('/api/fitness', (req, res) => {
  try {
    const { user_id, date, workout_type, duration, calories, notes } = req.body

    if (!user_id || !date || !workout_type || !duration) {
      return res.status(400).json({ error: '请填写必填字段' })
    }

    db.run(
      'INSERT INTO fitness_records (user_id, date, workout_type, duration, calories, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, date, workout_type, duration, calories || 0, notes || '']
    )
    saveDb()

    const records = query('SELECT * FROM fitness_records ORDER BY id DESC LIMIT 1')
    res.json({ message: '添加成功', record: records[0] })
  } catch (error) {
    console.error('添加记录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 删除健身记录
app.delete('/api/fitness/:id', (req, res) => {
  try {
    const id = req.params.id
    db.run('DELETE FROM fitness_records WHERE id = ?', [id])
    saveDb()
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除记录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 获取健身计划
app.get('/api/plans/:userId', (req, res) => {
  try {
    const userId = req.params.userId
    const plans = query('SELECT * FROM fitness_plans WHERE user_id = ? ORDER BY day_of_week', [userId])
    res.json({ plans })
  } catch (error) {
    console.error('获取计划错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 添加/更新健身计划
app.post('/api/plans', (req, res) => {
  try {
    const { user_id, day_of_week, workout_type, duration, calories, notes } = req.body

    if (!user_id || day_of_week === undefined || !workout_type || !duration) {
      return res.status(400).json({ error: '请填写必填字段' })
    }

    // 检查当天是否已有计划
    const existing = query('SELECT * FROM fitness_plans WHERE user_id = ? AND day_of_week = ?', [user_id, day_of_week])
    
    if (existing.length > 0) {
      // 更新
      db.run(
        'UPDATE fitness_plans SET workout_type = ?, duration = ?, calories = ?, notes = ? WHERE user_id = ? AND day_of_week = ?',
        [workout_type, duration, calories || 0, notes || '', user_id, day_of_week]
      )
    } else {
      // 新增
      db.run(
        'INSERT INTO fitness_plans (user_id, day_of_week, workout_type, duration, calories, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, day_of_week, workout_type, duration, calories || 0, notes || '']
      )
    }
    
    saveDb()
    res.json({ message: '保存成功' })
  } catch (error) {
    console.error('保存计划错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 删除健身计划
app.delete('/api/plans/:id', (req, res) => {
  try {
    const id = req.params.id
    db.run('DELETE FROM fitness_plans WHERE id = ?', [id])
    saveDb()
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除计划错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 获取饮食记录
app.get('/api/diet/:userId', (req, res) => {
  try {
    const userId = req.params.userId
    const records = query('SELECT * FROM diet_records WHERE user_id = ? ORDER BY date DESC, created_at DESC', [userId])
    res.json({ records })
  } catch (error) {
    console.error('获取饮食记录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 获取某一天的饮食记录
app.get('/api/diet/:userId/:date', (req, res) => {
  try {
    const { userId, date } = req.params
    const records = query('SELECT * FROM diet_records WHERE user_id = ? AND date = ? ORDER BY created_at DESC', [userId, date])
    res.json({ records })
  } catch (error) {
    console.error('获取饮食记录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 添加饮食记录
app.post('/api/diet', (req, res) => {
  try {
    const { user_id, date, meal_type, food_name, portion, calories, protein, carbs, fat, notes } = req.body

    if (!user_id || !date || !meal_type || !food_name) {
      return res.status(400).json({ error: '请填写必填字段' })
    }

    db.run(
      'INSERT INTO diet_records (user_id, date, meal_type, food_name, portion, calories, protein, carbs, fat, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, date, meal_type, food_name, portion || '', calories || 0, protein || 0, carbs || 0, fat || 0, notes || '']
    )
    saveDb()

    const records = query('SELECT * FROM diet_records ORDER BY id DESC LIMIT 1')
    res.json({ message: '添加成功', record: records[0] })
  } catch (error) {
    console.error('添加饮食记录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 删除饮食记录
app.delete('/api/diet/:id', (req, res) => {
  try {
    const id = req.params.id
    db.run('DELETE FROM diet_records WHERE id = ?', [id])
    saveDb()
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除饮食记录错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// AI对话接口
// 注意：请将 YOUR_API_KEY 替换为你的实际API Key
const AI_API_KEY = 'sk-3934e275b44d426ab6f7dd2ab27a7388'
const AI_API_URL = 'https://api.deepseek.com/v1/chat/completions'

// 对话历史存储（内存中，可扩展到数据库）
const chatHistory = new Map()

// 意图识别关键词
const INTENT_KEYWORDS = {
  training_plan: ['计划', '训练计划', '安排', '日程', '今天练什么', '今日训练'],
  exercise_guide: ['动作', '姿势', '深蹲', '卧推', '俯卧撑', '引体向上', '举', '蹲', '拉', '推'],
  diet: ['吃', '饮食', '营养', '餐', '蛋白质', '碳水', '脂肪', '减脂', '增肌', '吃什么'],
  progress: ['进步', '效果', '进展', '成果', '评估', '怎么样', '如何'],
  recovery: ['恢复', '休息', '放松', '拉伸', '按摩', '睡眠'],
  motivation: ['坚持', '动力', '鼓励', '加油', '放弃'],
  injury: ['受伤', '疼', '痛', '伤', '扭伤', '拉伤'],
  equipment: ['器材', '器械', '哑铃', '杠铃', '跑步机'],
  goal: ['目标', '减脂', '增肌', '塑形', '体重', '体脂'],
  question: ['为什么', '怎么', '如何', '怎样', '什么']
}

// 识别用户意图
function recognizeIntent(message) {
  const intents = []
  const lowerMsg = message.toLowerCase()
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(keyword => lowerMsg.includes(keyword))) {
      intents.push(intent)
    }
  }
  
  return intents.length > 0 ? intents : ['general']
}

// 生成个性化建议提示
function generatePersonalizedPrompt(userData, intents) {
  const { username, recentRecords, plans, weekStats, userInfo } = userData
  
  let prompt = `你是一位专业的健身教练AI助手。你的任务是根据用户的健身数据和计划，提供科学、个性化的训练建议。

用户信息：
- 用户名：${username}
- 性别：${userInfo.gender === 'male' ? '男' : userInfo.gender === 'female' ? '女' : '未知'}
- 姓名：${userInfo.real_name || '未填写'}
- 简介：${userInfo.bio || '无'}
- 最近训练次数：${recentRecords.length}次
- 最近总训练时长：${weekStats.totalDuration}分钟
- 最近总消耗卡路里：${weekStats.totalCalories}千卡

用户的一周训练计划：
${plans.length > 0 ? plans.map(p => `- 周${['日', '一', '二', '三', '四', '五', '六'][p.day_of_week]}：${p.workout_type}，${p.duration}分钟，预计${p.calories}卡`).join('\n') : '暂无训练计划'}

用户最近的健身记录：
${recentRecords.length > 0 ? recentRecords.map(r => `- ${r.date}：${r.workout_type}，${r.duration}分钟，${r.calories}卡${r.notes ? '，备注：' + r.notes : ''}`).join('\n') : '暂无记录'}

识别到的用户意图：${intents.map(i => getIntentDescription(i)).join('、')}

请根据以上信息和用户意图：
1. 如果用户询问训练计划，根据现有计划给出优化建议，推荐适合的训练内容
2. 如果用户询问动作要领，提供详细的动作指导和注意事项，包括呼吸技巧、常见错误
3. 如果用户询问饮食建议，根据训练目标推荐合适的饮食搭配
4. 如果用户关心进步和效果，分析其训练数据并给出改进建议
5. 如果用户需要恢复建议，提供科学的恢复方法和拉伸动作
6. 如果用户缺乏动力，给予鼓励和激励
7. 如果用户提到受伤，建议适当休息并咨询专业人士
8. 回答要专业、友好、有帮助，使用中文
9. 适当使用表情符号让回答更生动
10. 如果不确定某事，诚实地说明并建议咨询专业人士
11. 尽可能引用用户的实际训练数据来提供个性化建议`

  return prompt
}

// 获取意图描述
function getIntentDescription(intent) {
  const descriptions = {
    training_plan: '训练计划咨询',
    exercise_guide: '动作指导',
    diet: '饮食建议',
    progress: '进度评估',
    recovery: '恢复建议',
    motivation: '动力激励',
    injury: '伤病咨询',
    equipment: '器材使用',
    goal: '目标设定',
    question: '一般性问题',
    general: '普通对话'
  }
  return descriptions[intent] || intent
}

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { userId, username, message, context, history } = req.body

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' })
    }

    // 识别用户意图
    const intents = recognizeIntent(message)

    // 构建用户上下文信息
    const recentRecords = context.records?.slice(0, 10) || []
    const plans = context.plans || []
    const userInfo = context.userInfo || {}

    const weekStats = recentRecords.reduce((acc, r) => {
      acc.totalDuration += r.duration || 0
      acc.totalCalories += r.calories || 0
      return acc
    }, { totalDuration: 0, totalCalories: 0 })

    // 获取历史对话
    const userHistory = history || []

    // 生成个性化提示
    const systemPrompt = generatePersonalizedPrompt({
      username,
      recentRecords,
      plans,
      weekStats,
      userInfo
    }, intents)

    // 构建消息列表（包含历史对话）
    const messages = [
      { role: 'system', content: systemPrompt }
    ]

    // 添加历史对话
    for (const h of userHistory.slice(-5)) {
      messages.push({ role: h.role, content: h.content })
    }

    // 添加当前消息
    messages.push({ role: 'user', content: message })

    // 使用 SSE 流式响应
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
        stream: true
      })
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      res.write(`data: ${JSON.stringify({ error: errData.error?.message || 'AI服务请求失败' })}\n\n`)
      return res.end()
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullResponse = ''  // 累积完整回答

    try {
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
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullResponse += delta
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`)
            }
          } catch {
            // 跳过无法解析的行
          }
        }
      }

      // 处理剩余 buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
          try {
            const parsed = JSON.parse(trimmed.slice(6))
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullResponse += delta
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`)
            }
          } catch { /* ignore */ }
        }
      }
    } finally {
      reader.releaseLock()
    }

    // 保存对话历史
    try {
      const newMessages = [...messages, { role: 'assistant', content: fullResponse }]
      saveChatHistory(userId, newMessages)
    } catch (e) {
      console.error('保存对话历史失败:', e)
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    console.error('AI对话错误:', error)
    res.status(500).json({ error: 'AI服务暂时不可用' })
  }
})

// 保存对话历史
function saveChatHistory(userId, messages) {
  try {
    // 提取第一条用户消息作为标题
    const userMessage = messages.find(m => m.role === 'user')
    const title = userMessage ? userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '') : '新对话'
    
    const messagesJson = JSON.stringify(messages)
    
    // 直接创建新对话记录
    db.run(`
      INSERT INTO chat_history (user_id, title, messages, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [userId, title, messagesJson])
    
    // 持久化到文件
    saveDb()
    
    console.log('对话历史保存成功')
  } catch (error) {
    console.error('保存对话历史失败:', error)
  }
}

// 获取用户对话列表
app.get('/api/ai/chats/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const chats = query(`
      SELECT id, title, created_at, updated_at 
      FROM chat_history 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
    `, [userId])
    
    res.json({ success: true, chats })
  } catch (error) {
    console.error('获取对话列表失败:', error)
    res.status(500).json({ error: '获取对话列表失败' })
  }
})

// 获取对话详情
app.get('/api/ai/chat/:chatId', (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId)
    const chats = query(`
      SELECT * FROM chat_history WHERE id = ?
    `, [chatId])
    
    if (chats.length === 0) {
      return res.status(404).json({ error: '对话不存在' })
    }
    
    const chat = chats[0]
    chat.messages = JSON.parse(chat.messages)
    // 过滤掉系统提示词，用户不应该看到
    chat.messages = chat.messages.filter(m => m.role !== 'system')
    res.json({ success: true, chat })
  } catch (error) {
    console.error('获取对话详情失败:', error)
    res.status(500).json({ error: '获取对话详情失败' })
  }
})

// 删除对话
app.delete('/api/ai/chat/:chatId', (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId)
    db.run('DELETE FROM chat_history WHERE id = ?', [chatId])
    res.json({ success: true })
  } catch (error) {
    console.error('删除对话失败:', error)
    res.status(500).json({ error: '删除对话失败' })
  }
})

// 更新日活记录
function updateDailyActive() {
  const today = new Date().toISOString().split('T')[0]
  try {
    // 先检查当天记录是否存在
    const existing = query('SELECT * FROM daily_active WHERE date = ?', [today])
    if (existing.length > 0) {
      db.run('UPDATE daily_active SET active_count = active_count + 1 WHERE date = ?', [today])
    } else {
      db.run('INSERT INTO daily_active (date, active_count) VALUES (?, 1)', [today])
    }
    saveDb()
  } catch (error) {
    console.error('更新日活记录错误:', error)
  }
}

// 管理员验证中间件
const adminOnly = (req, res, next) => {
  const { username } = req.body
  if (username !== 'admin') {
    return res.status(403).json({ error: '权限不足，只有管理员可以访问' })
  }
  next()
}

// 获取所有用户列表（管理员）
app.post('/api/admin/users', adminOnly, (req, res) => {
  try {
    const users = query('SELECT id, username, email, gender, real_name, avatar, status, created_at FROM users ORDER BY created_at DESC')
    res.json({ users })
  } catch (error) {
    console.error('获取用户列表错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 封禁/解封用户（管理员）
app.post('/api/admin/toggle-ban', adminOnly, (req, res) => {
  try {
    const { userId } = req.body
    const users = query('SELECT status FROM users WHERE id = ?', [userId])
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    const currentStatus = users[0].status
    const newStatus = currentStatus === 'banned' ? null : 'banned'
    
    db.run('UPDATE users SET status = ? WHERE id = ?', [newStatus, userId])
    saveDb()
    
    res.json({ message: newStatus ? '用户已封禁' : '用户已解封', status: newStatus })
  } catch (error) {
    console.error('封禁用户错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 获取日活量统计（管理员）
app.post('/api/admin/daily-active', adminOnly, (req, res) => {
  try {
    const { days = 7 } = req.body
    const records = query('SELECT * FROM daily_active ORDER BY date DESC LIMIT ?', [days])
    res.json({ records })
  } catch (error) {
    console.error('获取日活量错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 获取用户总数（管理员）
app.post('/api/admin/user-count', adminOnly, (req, res) => {
  try {
    const result = query('SELECT COUNT(*) as total FROM users')
    const activeResult = query('SELECT COUNT(*) as active FROM users WHERE status IS NULL OR status != "banned"')
    const bannedResult = query('SELECT COUNT(*) as banned FROM users WHERE status = "banned"')
    
    res.json({
      total: result[0]?.total || 0,
      active: activeResult[0]?.active || 0,
      banned: bannedResult[0]?.banned || 0
    })
  } catch (error) {
    console.error('获取用户统计错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 启动服务器
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`后端服务运行在 http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('数据库初始化失败:', err)
  process.exit(1)
})
