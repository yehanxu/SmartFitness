<template>
  <div class="slide-verify" :class="{ 'success': verified, 'error': verifyError }">
    <div class="verify-track">
      <div class="verify-bg">
        <div class="puzzle-block" :style="{ left: puzzlePosition + 'px' }"></div>
      </div>
      <div 
        class="slider" 
        :style="{ left: sliderPosition + 'px' }"
        :class="{ dragging: isDragging }"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="5 12 14 12 9 17 5 12"/>
          <polyline points="15 12 24 12 19 7 15 12"/>
        </svg>
      </div>
    </div>
    <div class="verify-tip">
      <span v-if="!verified && !verifyError">请拖动滑块完成验证</span>
      <span v-else-if="verified" class="success-text">验证成功</span>
      <span v-else class="error-text">验证失败，请重试</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const emit = defineEmits(['verified'])

const trackWidth = ref(300)
const sliderWidth = 50
const puzzleWidth = 40
const puzzlePosition = ref(0)
const sliderPosition = ref(0)
const isDragging = ref(false)
const verified = ref(false)
const verifyError = ref(false)

let startX = 0
let startPosition = 0

const generatePuzzle = () => {
  const maxPosition = trackWidth.value - puzzleWidth - sliderWidth
  puzzlePosition.value = Math.floor(Math.random() * maxPosition) + 20
  sliderPosition.value = 0
  verified.value = false
  verifyError.value = false
}

const startDrag = (e) => {
  if (verified.value) return
  isDragging.value = true
  startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  startPosition = sliderPosition.value
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  let deltaX = currentX - startX
  let newPosition = startPosition + deltaX
  
  if (newPosition < 0) newPosition = 0
  if (newPosition > trackWidth.value - sliderWidth) {
    newPosition = trackWidth.value - sliderWidth
  }
  
  sliderPosition.value = newPosition
}

const stopDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
  
  const tolerance = 10
  const puzzleCenter = puzzlePosition.value + puzzleWidth / 2
  const sliderCenter = sliderPosition.value + sliderWidth / 2
  
  if (Math.abs(sliderCenter - puzzleCenter) <= tolerance) {
    verified.value = true
    emit('verified', true)
  } else {
    verifyError.value = true
    setTimeout(() => {
      generatePuzzle()
      verifyError.value = false
    }, 1000)
  }
}

const reset = () => {
  generatePuzzle()
}

defineExpose({ reset, verified })

onMounted(() => {
  generatePuzzle()
})

watch(verified, (val) => {
  if (val) {
    emit('verified', true)
  }
})
</script>

<style scoped>
.slide-verify {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  user-select: none;
}

.verify-track {
  position: relative;
  height: 44px;
  background: #f3f4f6;
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
}

.verify-bg {
  position: absolute;
  inset: 4px;
  background: linear-gradient(90deg, #e0e5ec 0%, #f8f9fa 100%);
  border-radius: 18px;
  overflow: hidden;
}

.puzzle-block {
  position: absolute;
  top: 0;
  width: 40px;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.puzzle-block::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.slider {
  position: absolute;
  top: 4px;
  width: 50px;
  height: calc(100% - 8px);
  background: #fff;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
  cursor: grab;
}

.slider:active,
.slider.dragging {
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.verify-tip {
  text-align: center;
  margin-top: 12px;
  font-size: 13px;
  color: #888;
}

.success-text {
  color: #52c41a;
}

.error-text {
  color: #ff4d4f;
}

.slide-verify.success .verify-bg {
  background: linear-gradient(90deg, #d9f7be 0%, #e8f5e9 100%);
}

.slide-verify.success .puzzle-block {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
}

.slide-verify.success .slider {
  color: #52c41a;
  background: #fff;
}

.slide-verify.error .verify-bg {
  background: linear-gradient(90deg, #fff2f0 0%, #fff7f6 100%);
}

.slide-verify.error .puzzle-block {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
}

.slide-verify.error .slider {
  color: #ff4d4f;
}
</style>