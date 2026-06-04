<template>
  <div id="app">
    <Login v-if="!currentUser" @login-success="handleLoginSuccess" />
    <div v-else class="app-container">
      <nav class="nav-tabs">
        <button 
          :class="{ active: currentPage === 'record' }" 
          @click="currentPage = 'record'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          健身记录
        </button>
        <button 
          :class="{ active: currentPage === 'plan' }" 
          @click="currentPage = 'plan'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          健身计划
        </button>
        <button 
          :class="{ active: currentPage === 'ai' }" 
          @click="currentPage = 'ai'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          AI助手
        </button>
        <button 
          :class="{ active: currentPage === 'diet' }" 
          @click="currentPage = 'diet'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
          饮食管理
        </button>
        <button 
          :class="{ active: currentPage === 'profile' }" 
          @click="currentPage = 'profile'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          个人中心
        </button>
        <button 
          v-if="currentUser?.username === 'admin'"
          :class="{ active: currentPage === 'admin' }" 
          @click="currentPage = 'admin'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          管理后台
        </button>
      </nav>
      <FitnessRecord 
        v-if="currentPage === 'record'"
        :user-id="currentUser.id"
        :username="currentUser.username"
        @logout="handleLogout"
      />
      <FitnessPlan 
        v-else-if="currentPage === 'plan'"
        :user-id="currentUser.id"
        :username="currentUser.username"
        @logout="handleLogout"
      />
      <FitnessAI 
        v-else-if="currentPage === 'ai'"
        :user-id="currentUser.id"
        :username="currentUser.username"
        @logout="handleLogout"
      />
      <DietRecord 
        v-else-if="currentPage === 'diet'"
        :user-id="currentUser.id"
        :username="currentUser.username"
        @logout="handleLogout"
      />
      <UserProfile 
        v-else-if="currentPage === 'profile'"
        :user="currentUser"
        @profile-updated="handleProfileUpdated"
      />
      <AdminPanel 
        v-else-if="currentPage === 'admin'"
        @logout="handleLogout"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Login from './components/Login.vue'
import FitnessRecord from './components/FitnessRecord.vue'
import FitnessPlan from './components/FitnessPlan.vue'
import FitnessAI from './components/FitnessAI.vue'
import DietRecord from './components/DietRecord.vue'
import UserProfile from './components/UserProfile.vue'
import AdminPanel from './components/AdminPanel.vue'

const currentUser = ref(null)
const currentPage = ref('record')

onMounted(() => {
  const saved = localStorage.getItem('currentUser')
  if (saved) {
    currentUser.value = JSON.parse(saved)
  }
})

const handleLoginSuccess = (user) => {
  currentUser.value = user
  currentPage.value = 'record'
}

const handleLogout = () => {
  currentUser.value = null
}

const handleProfileUpdated = (updatedUser) => {
  currentUser.value = updatedUser
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
}

.nav-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.nav-tabs button {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  padding: 14px 28px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.nav-tabs button:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

.nav-tabs button.active {
  background: #fff;
  color: #667eea;
  border-color: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  text-shadow: none;
}

.nav-tabs button.active svg {
  stroke: #667eea;
}

.nav-tabs button svg {
  stroke: #fff;
}

.nav-tabs button.active svg {
  stroke: #667eea;
}
</style>
