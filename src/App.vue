<script setup>
import { ref, computed } from 'vue'

const zoomLevel = ref(1)

// Sistema de Voz para Guia de Acessibilidade
const falarGuia = (texto) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel() 
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.9 
    window.speechSynthesis.speak(utterance)
  }
}

const aumentarZoom = () => {
  if (zoomLevel.value < 2.5) zoomLevel.value += 0.1
}

const diminuirZoom = () => {
  if (zoomLevel.value > 0.4) zoomLevel.value -= 0.1
}

const zoomStyle = computed(() => {
  return {
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: zoomLevel.value >= 1 ? 'top left' : 'center center',
    transition: 'transform 0.2s ease-out'
  }
})
</script>

<template>
  <div class="fixed top-8 right-8 z-[9999] flex flex-row gap-4">
    
    <button 
      @click="aumentarZoom"
      @mouseenter="falarGuia('Aumentar tamanho da tela')"
      class="btn-circulo btn-mais"
    >
      +
    </button>

    <button 
      @click="diminuirZoom"
      @mouseenter="falarGuia('Diminuir tamanho da tela')"
      class="btn-circulo btn-menos"
    >
      -
    </button>

  </div>

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

/* Estilização dos Círculos */
.btn-circulo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  font-weight: 900;
  font-size: 50px;
  border: 5px solid black;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, filter 0.2s ease-in-out;
  box-shadow: 6px 6px 0px 0px rgba(255,255,255,0.15);
}

.btn-circulo:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}

.btn-circulo:active {
  transform: scale(0.9);
}

/* Cores Estritamente ligadas ao CUIDAR BEM */
.btn-mais {
  background-color: #ffff00; /* Amarelo do site */
  color: black;
}

.btn-menos {
  background-color: #FF0000; /* Vermelho do site */
  color: white;
}

/* Estrutura do Zoom */
.zoom-viewport {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center; 
  justify-content: center; 
  overflow: auto;
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