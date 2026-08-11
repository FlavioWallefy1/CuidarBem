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
  // Em telas menores que 768px (celulares), desativa o scale fixo para permitir responsividade nativa
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
  <!-- Contêiner responsivo para os botões de acessibilidade -->
  <div class="fixed top-3 right-3 sm:top-6 sm:right-6 z-[9999] flex flex-row gap-2 sm:gap-4">
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

/* Estilização Responsiva dos Círculos */
.btn-circulo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-weight: 900;
  font-size: 24px;
  border: 3px solid black;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, filter 0.2s ease-in-out;
  box-shadow: 4px 4px 0px 0px rgba(255,255,255,0.15);
}

@media (min-width: 640px) {
  .btn-circulo {
    width: 70px;
    height: 70px;
    font-size: 50px;
    border: 5px solid black;
    box-shadow: 6px 6px 0px 0px rgba(255,255,255,0.15);
  }
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