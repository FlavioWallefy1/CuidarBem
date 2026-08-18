<script setup>
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted, ref } from 'vue'
import { db } from '../firebase'
import { collection, query, where, getDocs, updateDoc, doc, limit } from 'firebase/firestore'

const router = useRouter()
const nomeRemedioAtivo = ref('Carregando...')
const idRemedioAtivo = ref(null)
let intervaloVoz = null

const buscarRemedioAtual = async () => {
  const agora = new Date()
  const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`

  try {
    const q = query(
      collection(db, "remedios"), 
      where("horario", "==", horaAtual),
      where("status", "==", "pendente"),
      limit(1)
    )
    
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const dados = querySnapshot.docs[0].data()
      nomeRemedioAtivo.value = dados.nome
      idRemedioAtivo.value = querySnapshot.docs[0].id
      falarAlarme(dados.nome)
    } else {
      nomeRemedioAtivo.value = "NÃO ENCONTRADO"
    }
  } catch (error) {
    console.error("Erro ao buscar remédio do alarme:", error)
  }
}

const falarAlarme = (nome) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const msg = `Atenção! Hora de tomar seu remédio ${nome}. Toque no botão amarelo para confirmar.`
    const utterance = new SpeechSynthesisUtterance(msg)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.9
    utterance.pitch = 1.1 
    window.speechSynthesis.speak(utterance)
  }
}

onMounted(() => {
  buscarRemedioAtual()
  intervaloVoz = setInterval(() => {
    if (nomeRemedioAtivo.value !== 'Carregando...') {
      falarAlarme(nomeRemedioAtivo.value)
    }
  }, 10000)
})

onUnmounted(() => {
  if (intervaloVoz) clearInterval(intervaloVoz)
  window.speechSynthesis.cancel()
})

const confirmarDose = async () => {
  if (idRemedioAtivo.value) {
    try {
      const docRef = doc(db, "remedios", idRemedioAtivo.value)
      await updateDoc(docRef, { status: 'tomado' })
      
      if (intervaloVoz) clearInterval(intervaloVoz)
      window.speechSynthesis.cancel()
      
      const confirmacao = new SpeechSynthesisUtterance("Remédio confirmado! Muito bem, continue se cuidando.")
      window.speechSynthesis.speak(confirmacao)
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (e) {
      console.error("Erro ao confirmar:", e)
    }
  } else {
    router.push('/dashboard')
  }
}
</script>

<template>
  <main class="w-screen h-[100dvh] bg-black text-white flex flex-col md:flex-row p-3 md:p-6 overflow-hidden select-none font-sans box-border relative gap-4 animate-flash-bg">
    
    <!-- ========================================================= -->
    <!-- VERSÃO MOBILE (Visível apenas em celulares)                 -->
    <!-- ========================================================= -->
    <div class="flex md:hidden flex-col h-full w-full gap-3 overflow-hidden">
      
      <!-- 1. Robô no Topo com Alerta -->
      <div class="flex items-center gap-3 shrink-0 pt-2">
        <div class="text-3xl animate-float shrink-0">🤖</div>
        <div class="bg-[#ff4444] border-l-8 border-white px-3 py-2 rounded-[18px] shadow-2xl flex-1 overflow-hidden">
          <p class="text-white font-[1000] text-xs uppercase italic leading-tight truncate animate-pulse">
            ATENÇÃO! É HORA DO SEU REMÉDIO!
          </p>
        </div>
      </div>

      <!-- 2. Sidebar Padrão Compacta com Itens na HORIZONTAL -->
      <aside class="w-full flex flex-col p-4 bg-[#0a0a0a] rounded-[30px] border-4 border-zinc-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] shrink-0 opacity-80">
        <div class="flex items-center justify-between mb-2 relative z-10">
          <div class="flex items-center gap-2">
            <div class="bg-[#ffff00] p-1.5 rounded-lg rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h1 class="text-[#ffff00] text-xs font-[1000] italic leading-none uppercase">CUIDAR BEM</h1>
          </div>
          <span class="text-zinc-500 font-black text-xs uppercase">ALERTA ATIVO</span>
        </div>

        <nav class="flex flex-row items-center justify-around relative z-10 px-1 pt-1 border-t border-zinc-900">
          <span class="text-zinc-600 font-bold text-sm uppercase">MODO ALARME ATIVADO</span>
        </nav>
      </aside>

      <!-- 3. Card de Alarme e Botão Gigante em Baixo com Fontes Hiper-Ampliada -->
      <div class="flex-grow flex flex-col overflow-hidden pb-2 gap-3">
        <div class="h-full bg-[#ffff00] rounded-[35px] p-1.5 shadow-[12px_12px_0px_0px_rgba(255,255,0,0.1)] overflow-hidden animate-glow-pulse flex flex-col">
          <div class="h-full w-full bg-black rounded-[32px] border-[4px] border-black p-4 flex flex-col justify-between items-center relative overflow-hidden">
            
            <div class="absolute inset-0 bg-[#ffff00]/5 animate-flash-overlay"></div>

            <div class="relative z-10 flex flex-col items-center justify-center flex-grow text-center">
               <!-- Sino Bem Maior -->
               <span class="text-8xl animate-bounce-fast mb-2">🔔</span>
               <!-- Nome do Remédio Hiper Gigante (16vw) -->
               <h2 class="text-[#ffff00] font-[1000] text-[16vw] uppercase leading-none tracking-tighter drop-shadow-2xl">
                 {{ nomeRemedioAtivo }}
               </h2>
            </div>

            <button 
              @click="confirmarDose"
              class="relative z-10 w-full bg-[#ffff00] text-black py-5 rounded-[25px] font-[1000] text-3xl uppercase shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] active:scale-95 transition-all border-4 border-black animate-btn-shimmer shrink-0"
            >
              JÁ TOMEI ✅
            </button>
          </div>
        </div>
      </div>

    </div>


    <!-- ========================================================= -->
    <!-- VERSÃO DESKTOP / NOTEBOOK / TOTEM (Telas Grandes)         -->
    <!-- ========================================================= -->
    <div class="hidden md:flex h-full w-full flex-row">
      
      <aside class="w-[280px] h-full flex flex-col p-6 bg-[#0a0a0a] rounded-[40px] border-4 border-zinc-800 opacity-50 mr-6 shrink-0 relative overflow-hidden">
        <div class="flex flex-col gap-2 mb-8 relative z-10">
          <div class="flex items-center gap-3">
            <div class="bg-[#ffff00] p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/vue" class="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h1 class="text-[#ffff00] text-2xl font-[1000] italic leading-none">CUIDAR<br>BEM</h1>
          </div>
        </div>
        <div class="flex-grow flex items-center justify-center">
          <span class="text-zinc-700 font-black text-2xl uppercase rotate-90 whitespace-nowrap">ALERTA ATIVO</span>
        </div>
      </aside>

      <section class="flex-1 h-full flex flex-col gap-4 overflow-hidden">
        
        <div class="flex items-center gap-6 h-[18%] animate-bounce-slow shrink-0">
          <div class="text-7xl shrink-0">🤖</div>
          <div class="bg-[#ff4444] border-l-8 border-white p-5 rounded-[30px] shadow-2xl flex-1 overflow-hidden">
            <p class="text-white font-[1000] text-[2.5vw] uppercase italic leading-none whitespace-nowrap tracking-tighter animate-pulse">
              ATENÇÃO! É HORA DO SEU REMÉDIO!
            </p>
          </div>
        </div>

        <div class="flex-grow p-4 overflow-hidden flex flex-col">
          <div class="flex-grow bg-[#ffff00] rounded-[50px] p-2 animate-glow-pulse">
            <div class="h-full w-full bg-black rounded-[45px] border-[6px] border-black p-8 flex flex-col justify-between items-center relative overflow-hidden">
              
              <div class="absolute inset-0 bg-[#ffff00]/5 animate-flash-overlay"></div>

              <div class="relative z-10 flex flex-col items-center gap-4">
                 <span class="text-9xl animate-bounce-fast">🔔</span>
                 <h2 class="text-[#ffff00] font-[1000] text-[8vw] uppercase leading-none tracking-tighter text-center">
                   {{ nomeRemedioAtivo }}
                 </h2>
              </div>

              <button 
                @click="confirmarDose"
                class="relative z-10 w-full bg-[#ffff00] text-black py-10 rounded-[40px] font-[1000] text-6xl uppercase shadow-[15px_15px_0px_0px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all border-8 border-black animate-btn-shimmer"
              >
                JÁ TOMEI ✅
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>

  </main>
</template>

<style scoped>
.font-\[1000\] { font-weight: 950; }
@keyframes flash-bg { 0%, 100% { background-color: #000; } 50% { background-color: #1a0000; } }
.animate-flash-bg { animation: flash-bg 2s infinite; }

@keyframes glow-pulse { 
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 0, 0.2); } 
  50% { box-shadow: 0 0 80px rgba(255, 255, 0, 0.6); } 
}
.animate-glow-pulse { animation: glow-pulse 1.5s infinite ease-in-out; }

@keyframes btn-shimmer { 0% { background-position: -200%; } 100% { background-position: 200%; } }
.animate-btn-shimmer {
  background: linear-gradient(90deg, #ffff00 0%, #fff 50%, #ffff00 100%);
  background-size: 200% auto;
  animation: btn-shimmer 3s infinite linear;
}
@keyframes bounce-fast { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
.animate-bounce-fast { animation: bounce-fast 0.6s infinite ease-in-out; }
@keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.animate-bounce-slow { animation: bounce-slow 2s infinite ease-in-out; }
@keyframes flash-overlay { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
.animate-flash-overlay { animation: flash-overlay 0.5s infinite; }
</style>