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

  <!-- Usando w-screen h-[100dvh] para se adaptar perfeitamente a barras de navegação de celulares e telas de qualquer proporção -->
  <main class="w-screen h-[100dvh] bg-black text-white p-4 sm:p-6 md:p-8 flex flex-col items-center justify-between overflow-hidden select-none box-border">
    
    <!-- Header fluído proporcional à largura/altura -->
    <header class="w-full flex items-center gap-4 sm:gap-6 h-[15%] shrink-0 animate-slide-in-top">
      <div class="text-[clamp(2.5rem,6vw,5rem)] animate-float shrink-0">🤖</div>
      <div class="bg-zinc-900/50 backdrop-blur-md border-l-8 border-[#00c3ff] px-4 py-2 sm:p-4 rounded-[20px] sm:rounded-[25px] shadow-xl w-auto max-w-[85%]">
        <!-- Uso de clamp() para o texto escalar perfeitamente em telas minúsculas ou gigantes -->
        <p class="text-[#00c3ff] font-[1000] text-[clamp(0.7rem,2.2vw,1.5rem)] uppercase italic leading-tight whitespace-nowrap tracking-tighter">
          TOQUE NO BOTÃO AMARELO PARA ENTRAR
        </p>
      </div>
    </header>

    <!-- Seção central adaptativa -->
    <section class="flex flex-col items-center justify-center flex-grow py-2">
      <div class="w-[clamp(100px,22vh,180px)] h-[clamp(100px,22vh,180px)] border-[8px] sm:border-[10px] border-[#ffff00] rounded-[35px] sm:rounded-[45px] flex items-center justify-center bg-[#0a0a0a] shadow-[10px_10px_0px_0px_rgba(255,255,0,0.15)] animate-pulse-logo mb-4 sm:mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[50%] h-[50%] text-[#ffff00]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      <h1 class="text-[#ffff00] text-[clamp(2rem,7vw,5rem)] font-[1000] uppercase italic tracking-tighter leading-none whitespace-nowrap">
        CUIDAR BEM
      </h1>
    </section>

    <!-- Rodapé totalmente flexível para nunca cortar os botões em telas pequenas -->
    <footer class="w-full flex flex-col sm:flex-row gap-4 sm:gap-6 mb-2 h-auto sm:h-[18%] min-h-[70px] shrink-0">
      <button class="flex-1 bg-white text-black rounded-[25px] sm:rounded-[35px] font-[1000] text-[clamp(1rem,2.5vw,1.8rem)] uppercase transition-all duration-300 flex items-center justify-center gap-3 py-3 sm:py-0 px-4 hover:scale-105 active:scale-95 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] border-4 border-zinc-200">
        <img :src="googleImg" class="w-[clamp(1.5rem,3vw,2.3rem)] h-[clamp(1.5rem,3vw,2.3rem)] icon-black" alt="Google">
        GOOGLE
      </button>

      <button 
        @click="handleLogin"
        class="flex-1 bg-[#ffff00] text-black rounded-[25px] sm:rounded-[35px] font-[1000] text-[clamp(1.1rem,3vw,2.2rem)] uppercase shadow-[8px_8px_0px_0px_rgba(255,255,0,0.2)] transition-all duration-300 flex items-center justify-center gap-3 py-3 sm:py-0 px-4 hover:scale-105 active:scale-95 animate-btn-glow border-4 border-black"
      >
        <img :src="bioImg" class="w-[clamp(1.7rem,3.5vw,2.8rem)] h-[clamp(1.7rem,3.5vw,2.8rem)] icon-black" alt="Digital">
        ENTRAR
      </button>
    </footer>
  </main>
</template>