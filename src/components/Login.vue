<script setup>
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted, ref } from 'vue'
import bioImg from '../assets/biometria 1.png'
import googleImg from '../assets/icons8-google-logo-60 1.png'

const router = useRouter()
const showSplash = ref(true)

const falarInstrucao = (texto) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.85 
    window.speechSynthesis.speak(utterance)
  }
}

const iniciarVozUnica = () => {
  const mensagem = "Olá! Toque no grande botão amarelo para entrar com sua digital."
  falarInstrucao(mensagem)
}

onMounted(() => {
  setTimeout(() => {
    showSplash.value = false;
    setTimeout(() => iniciarVozUnica(), 500);
  }, 2500)
})

onUnmounted(() => {
  window.speechSynthesis.cancel()
})

const handleLogin = () => {
  falarInstrucao("Digital reconhecida. Entrando no sistema.")
  setTimeout(() => router.push('/dashboard'), 1500)
}
</script>

<template>
  <transition name="fade-out">
    <div v-if="showSplash" class="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-8 overflow-hidden">
      <div class="w-56 h-56 border-[16px] border-[#ffff00] rounded-[55px] flex items-center justify-center bg-black shadow-[15px_15px_0px_0px_rgba(255,255,0,0.2)] animate-pulse-slow">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-32 h-32 text-[#ffff00]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      <h1 class="text-[#ffff00] text-7xl font-[1000] uppercase tracking-tighter italic animate-fade-in-up">CUIDAR BEM</h1>
    </div>
  </transition>

  <!-- Removida a borda cinza (border-[10px]) e ajustado o padding para 4 para dar respiro lateral nas pontas -->
  <main class="w-screen h-screen bg-black text-white p-4 sm:p-6 flex flex-col items-center justify-between overflow-hidden select-none box-border">
    
    <!-- Header com espaço inteligente no topo para não encostar nos botões do App.vue -->
    <header class="w-full flex items-center gap-4 sm:gap-6 pt-10 sm:pt-0 h-[15%] animate-slide-in-top">
      <div class="text-5xl sm:text-6xl animate-float shrink-0">🤖</div>
      <div class="bg-zinc-900/50 backdrop-blur-md border-l-8 border-[#00c3ff] p-3 sm:p-4 rounded-[25px] shadow-xl w-fit">
        <p class="text-[#00c3ff] font-[1000] text-[2.5vw] sm:text-[2.2vw] uppercase italic leading-none whitespace-nowrap tracking-tighter">
          TOQUE NO BOTÃO AMARELO PARA ENTRAR
        </p>
      </div>
    </header>

    <section class="flex flex-col items-center justify-center flex-grow py-2">
      <div class="w-44 h-44 border-[10px] border-[#ffff00] rounded-[45px] flex items-center justify-center bg-[#0a0a0a] shadow-[12px_12px_0px_0px_rgba(255,255,0,0.15)] animate-pulse-logo mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 text-[#ffff00]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      <h1 class="text-[#ffff00] text-[5.5vw] font-[1000] uppercase italic tracking-tighter leading-none whitespace-nowrap">
        CUIDAR BEM
      </h1>
    </section>

    <!-- Rodapé ajustado com flex-1 e gap adequado para os textos encaixarem perfeitamente sem comer nas bordas -->
    <footer class="w-full flex flex-row gap-4 sm:gap-6 mb-2 h-28 sm:h-32 shrink-0">
      <button class="flex-1 bg-white text-black rounded-[30px] sm:rounded-[35px] font-[1000] text-xl sm:text-2xl uppercase transition-all duration-300 flex items-center justify-center gap-3 px-2 hover:scale-105 active:scale-95 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] border-4 border-zinc-200">
        <img :src="googleImg" class="w-8 h-8 sm:w-9 sm:h-9 icon-black" alt="Google">
        GOOGLE
      </button>

      <button 
        @click="handleLogin"
        class="flex-1 bg-[#ffff00] text-black rounded-[30px] sm:rounded-[35px] font-[1000] text-2xl sm:text-4xl uppercase shadow-[8px_8px_0px_0px_rgba(255,255,0,0.2)] transition-all duration-300 flex items-center justify-center gap-3 px-2 hover:scale-105 active:scale-95 animate-btn-glow border-4 border-black"
      >
        <img :src="bioImg" class="w-11 h-11 sm:w-14 sm:h-14 icon-black" alt="Digital">
        ENTRAR
      </button>
    </footer>
  </main>
</template>