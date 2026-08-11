<script setup>
import { ref, computed } from 'vue'

const zoomLevel = ref(1)

const zoomStyle = computed(() => {
  if (window.innerWidth < 768) {
    return { transform: 'none', width: '100vw', height: '100vh' }
  }
  return {
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: zoomLevel.value >= 1 ? 'top left' : 'center center',
    transition: 'transform 0.2s ease-out'
  }
})
</script>

<template>
  <div class="zoom-viewport bg-black">
    <div class="zoom-wrapper" :style="zoomStyle">
      <router-view />
    </div>
  </div>
</template>

<style>
body, html {
  margin: 0;
  padding: 0;
  background-color: black;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Estrutura do Zoom */
.zoom-viewport {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center; 
  justify-content: center; 
  overflow: hidden;
}

.zoom-wrapper {
  flex-shrink: 0;
  width: 100vw;
  height: 100vh;
  min-width: 100vw;
  min-height: 100vh;
}

.zoom-viewport::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.zoom-viewport::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 10px;
}
</style>