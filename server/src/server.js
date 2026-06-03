import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import initSqlJs from 'sql.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001
const DB_PATH = join(__dirname, 'users.db')

// 中间件
app.use(cors())
app.use(express.json())

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
  const fields = ['gender', 'real_name', 'favorite_sports', 'bio']
  fields.forEach(field => {
    try {
      db.run(`ALTER TABLE users ADD COLUMN ${field} TEXT`)
    } catch (e) {
      // 如果字段已存在，忽略错误
    }
  })

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
      saveDb()
      res.json({ message: '注册成功' })
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        if (error.message.includes('email')) {
          res.status(400).json({ error: '邮箱已被注册' })
        } else {
          res.status(400).json({ error: '用户名已存在' })
        }
      } else {
        res.status(400).json({ error: '注册失败' })
      }
    }
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
        bio: user.bio
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
        bio: user.bio
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

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { userId, username, message, context } = req.body

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' })
    }

    // 构建用户上下文信息
    const recentRecords = context.records?.slice(0, 10) || []
    const plans = context.plans || []

    const weekStats = recentRecords.reduce((acc, r) => {
      acc.totalDuration += r.duration || 0
      acc.totalCalories += r.calories || 0
      return acc
    }, { totalDuration: 0, totalCalories: 0 })

    const systemPrompt = `你是一位专业的健身教练AI助手。你的任务是根据用户的健身数据和计划，提供科学、个性化的训练建议。

用户信息：
- 用户名：${username}
- 最近训练次数：${recentRecords.length}次
- 最近总训练时长：${weekStats.totalDuration}分钟
- 最近总消耗卡路里：${weekStats.totalCalories}千卡

用户的一周训练计划：
${plans.map(p => `- 周${['日', '一', '二', '三', '四', '五', '六'][p.day_of_week]}：${p.workout_type}，${p.duration}分钟，预计${p.calories}卡`).join('\n')}

用户最近的健身记录：
${recentRecords.map(r => `- ${r.date}：${r.workout_type}，${r.duration}分钟，${r.calories}卡${r.notes ? '，备注：' + r.notes : ''}`).join('\n') || '暂无记录'}

请根据以上信息：
1. 如果用户询问训练建议，提供专业的健身指导
2. 如果用户询问训练计划，根据现有计划给出优化建议
3. 如果用户询问动作要领，提供详细的动作指导和注意事项
4. 回答要专业、友好、有帮助，使用中文
5. 适当使用表情符号让回答更生动
6. 如果不确定某事，诚实地说明并建议咨询专业人士`

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    const data = await response.json()

    if (data.error) {
      return res.status(400).json({ error: data.error.message })
    }

    const reply = data.choices?.[0]?.message?.content || '抱歉，我无法生成回复'
    res.json({ reply })
  } catch (error) {
    console.error('AI对话错误:', error)
    res.status(500).json({ error: 'AI服务暂时不可用' })
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
