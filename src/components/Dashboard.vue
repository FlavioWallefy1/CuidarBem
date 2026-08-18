<script setup>
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { db } from '../firebase'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'

const router = useRouter()
const remedios = ref([])
let unsubscribe = null
let intervaloVigia = null 

const jaFalouConteudo = ref('')

const falar = (texto, repetir = true) => {
  if ('speechSynthesis' in window) {
    if (!repetir && jaFalouConteudo.value === texto) return;

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.8 
    window.speechSynthesis.speak(utterance)
  
    if (!repetir) jaFalouConteudo.value = texto
  }
}

const proximoRemedio = computed(() => {
  return remedios.value.length > 0 ? remedios.value[0] : null
})

const vigiarHorario = () => {
  if (!proximoRemedio.value) return
  const agora = new Date()
  const horaAtual = String(agora.getHours()).padStart(2, '0')
  const minutoAtual = String(agora.getMinutes()).padStart(2, '0')
  const relogioAgora = `${horaAtual}:${minutoAtual}`

  if (relogioAgora === proximoRemedio.value.horario) {
    router.push('/alarme') 
  }
}

onMounted(() => {
  const q = query(
    collection(db, "remedios"), 
    where("status", "==", "pendente"),
    orderBy("horario", "asc")
  )

  unsubscribe = onSnapshot(q, (querySnapshot) => {
    const docs = []
    querySnapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() })
    })
    remedios.value = docs
  })

  intervaloVigia = setInterval(vigiarHorario, 10000)
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (intervaloVigia) clearInterval(intervaloVigia)
  window.speechSynthesis.cancel()
})
</script>

<template>
  <main class="w-screen h-[100dvh] bg-black text-white flex flex-col md:flex-row p-3 md:p-6 overflow-hidden select-none font-sans box-border relative gap-4">
    
    <!-- ========================================================= -->
    <!-- VERSÃO MOBILE (Visível apenas em celulares)                 -->
    <!-- ========================================================= -->
    <div class="flex md:hidden flex-col h-full w-full gap-3 overflow-hidden">
      
      <!-- 1. Robô no Topo -->
      <div class="flex items-center gap-3 shrink-0 pt-2">
        <div class="text-3xl animate-float shrink-0">🤖</div>
        <div class="bg-zinc-900/50 backdrop-blur-md border-l-8 border-[#00c3ff] px-3 py-2 rounded-[18px] shadow-xl flex-1 overflow-hidden">
          <p class="text-[#00c3ff] font-[1000] text-xs uppercase italic leading-tight truncate">
            {{ proximoRemedio ? 'Próximo remédio está pronto!' : 'TUDO CERTO POR AQUI!' }}
          </p>
        </div>
      </div>

      <!-- 2. Sidebar Padrão Compacta com Itens na HORIZONTAL -->
      <aside class="w-full flex flex-col p-4 bg-[#0a0a0a] rounded-[30px] border-4 border-zinc-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] shrink-0">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <div class="flex items-center gap-2">
            <div class="bg-[#ffff00] p-1.5 rounded-lg rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h1 class="text-[#ffff00] text-xs font-[1000] italic leading-none uppercase">CUIDAR BEM</h1>
          </div>
          <div class="h-1 bg-zinc-800 w-24 rounded-full overflow-hidden">
            <div class="h-full bg-[#ffff00] w-2/3 animate-loading-bar"></div>
          </div>
        </div>

        <nav class="flex flex-row items-center justify-between relative z-10 px-1">
          <!-- Botão Central em Destaque Amarelo (Início) -->
          <button class="text-black bg-[#ffff00] py-2 px-4 rounded-[15px] font-[1000] text-base uppercase shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]" @mouseenter="falar('Menu Início')">INÍCIO</button>
          
          <button @click="router.push('/remedios')" @mouseenter="falar('Remédios')" class="text-white font-black text-base uppercase transition-all hover:text-[#ffff00]">REMÉDIOS</button>
          
          <button @click="router.push('/')" @mouseenter="falar('Sair do sistema')" class="text-[#FF0000] font-[1000] text-base uppercase drop-shadow-[0_0_8px_rgba(255,0,0,0.4)]">SAIR</button>
        </nav>
      </aside>

      <!-- 3. Card Base Original com Fontes Máximas para Celular -->
      <div class="flex-grow flex flex-col overflow-hidden pb-2">
        <div v-if="proximoRemedio" 
             @mouseenter="falar(`Próximo remédio é ${proximoRemedio.nome} às ${proximoRemedio.horario}`, false)"
             class="h-full bg-[#ffff00] rounded-[35px] p-1.5 shadow-[12px_12px_0px_0px_rgba(255,255,0,0.1)] overflow-hidden">
          <div class="h-full w-full bg-black rounded-[32px] border-[4px] border-black p-4 flex flex-col justify-around items-center relative overflow-hidden">
            
            <div class="relative z-10 flex flex-col items-center flex-1 justify-center">
               <div class="px-6 py-2 bg-[#ffff00] text-black rounded-full font-[1000] text-base uppercase tracking-widest mb-1 shadow-md">
                 PRÓXIMO ÀS {{ proximoRemedio.horario }}
               </div>
               <!-- Horário hiper-enorme (26vw) -->
               <span class="text-white font-[1000] text-[26vw] leading-none tracking-tighter shadow-black drop-shadow-2xl">
                 {{ proximoRemedio.horario }}
               </span>
            </div>

            <div class="relative z-10 border-t-8 border-[#ffff00]/20 pt-2 flex flex-col items-center flex-1 justify-center w-[90%]">
              <!-- Nome do remédio hiper-enorme (13vw) -->
              <h2 class="text-[#ffff00] font-[1000] text-[13vw] uppercase tracking-tighter leading-none mb-3 text-center drop-shadow-lg">
                {{ proximoRemedio.nome }}
              </h2>
              <div class="flex gap-3 justify-center">
                <!-- Posologia em uma linha e maior (text-base) -->
                <span class="bg-white text-black px-5 py-2.5 rounded-xl font-[1000] text-base uppercase italic shadow-md whitespace-nowrap">1 COMPRIMIDO</span>
                <span class="bg-white text-black px-5 py-2.5 rounded-xl font-[1000] text-base uppercase italic shadow-md whitespace-nowrap">VIA ORAL</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else 
             @mouseenter="falar('Nenhum remédio pendente! Tudo em dia!', false)"
             class="h-full bg-zinc-900 rounded-[35px] border-8 border-[#ffff00] flex flex-col items-center justify-center p-4 shadow-[0_0_40px_rgba(255,255,0,0.1)] overflow-hidden">
            <div class="relative w-20 h-32 mb-1 rotate-[35deg] animate-capsula-bounce shrink-0">
              <div class="w-full h-1/2 bg-[#FF0000] rounded-t-full border-[8px] border-black border-b-0"></div>
              <div class="w-[110%] h-5 bg-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-20"></div>
              <div class="w-full h-1/2 bg-[#ffff00] rounded-b-full border-[8px] border-black border-t-0 shadow-[inset_0_-15px_0_rgba(0,0,0,0.1)]"></div>
              <div class="absolute top-8 left-5 w-3 h-16 bg-white/30 rounded-full blur-[2px]"></div>
            </div>
            <div class="text-center pb-2">
              <h2 class="text-white font-[1000] text-[9.5vw] uppercase italic tracking-tighter leading-tight drop-shadow-md">
                NENHUM REMÉDIO<br>
                <span class="text-[#ffff00] drop-shadow-[0_0_15px_rgba(255,255,0,0.3)]">PENDENTE!</span>
              </h2>
            </div>
        </div>
      </div>

    </div>


    <!-- ========================================================= -->
    <!-- VERSÃO DESKTOP / NOTEBOOK / TOTEM (Telas Grandes)         -->
    <!-- ========================================================= -->
    <div class="hidden md:flex h-full w-full flex-row">
      
      <aside class="w-[280px] h-full flex flex-col p-6 bg-[#0a0a0a] rounded-[40px] border-4 border-zinc-800 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mr-6 relative shrink-0">
        
        <div class="flex flex-col gap-2 mb-8 relative z-10">
          <div class="flex items-center gap-3">
            <div class="bg-[#ffff00] p-2 rounded-xl rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h1 class="text-[#ffff00] text-2xl font-[1000] italic leading-none uppercase">CUIDAR BEM</h1>
          </div>
          <div class="h-1 bg-zinc-800 mt-4 rounded-full overflow-hidden">
            <div class="h-full bg-[#ffff00] w-2/3 animate-loading-bar"></div>
          </div>
        </div>

        <nav class="flex flex-col gap-6 flex-grow relative z-10">
          <button class="w-full" @mouseenter="falar('Menu Início')">
            <div class="bg-[#ffff00] text-black py-5 rounded-[30px] font-[1000] text-3xl uppercase shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] transition-all">
              INÍCIO
            </div>
          </button>

          <button @click="router.push('/remedios')" @mouseenter="falar('Remédios')" class="group flex items-center gap-4 py-2 text-white font-black text-3xl uppercase transition-all hover:text-[#ffff00] pl-4 text-left">
            REMÉDIOS
          </button>

          <button @click="router.push('/')" @mouseenter="falar('Sair do sistema')" class="mt-auto py-6 text-[#FF0000] font-[1000] text-4xl uppercase border-t-2 border-zinc-900 pt-6 text-left drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]">
            SAIR
          </button>
        </nav>
      </aside>

      <section class="flex-1 h-full flex flex-col gap-4 overflow-hidden">
        
        <div class="flex items-center gap-6 h-[20%] animate-fade-in-up">
          <div class="text-7xl animate-float">🤖</div>
          <div class="bg-zinc-900/50 backdrop-blur-md border-l-8 border-[#00c3ff] p-6 rounded-[30px] shadow-xl flex-1">
            <p class="text-[#00c3ff] font-[1000] text-3xl uppercase italic leading-tight">
              {{ proximoRemedio ? 'Próximo remédio está pronto!' : 'TUDO CERTO POR AQUI!' }}
            </p>
          </div>
        </div>

        <div v-if="proximoRemedio" 
             @mouseenter="falar(`Próximo remédio é ${proximoRemedio.nome} às ${proximoRemedio.horario}`, false)"
             class="flex-grow bg-[#ffff00] rounded-[50px] p-1.5 shadow-[20px_20px_0px_0px_rgba(255,255,0,0.1)] overflow-hidden transition-all">
          <div class="h-full w-full bg-black rounded-[45px] border-[4px] border-black p-4 md:p-6 flex flex-col justify-around items-center relative overflow-hidden">
            
            <div class="relative z-10 flex flex-col items-center flex-1 justify-center">
               <div class="px-6 py-2 bg-[#ffff00] text-black rounded-full font-[1000] text-2xl uppercase tracking-widest mb-1">
                 PRÓXIMO ÀS {{ proximoRemedio.horario }}
               </div>
               <span class="text-white font-[1000] text-[10vw] leading-none tracking-tighter shadow-black drop-shadow-2xl">
                 {{ proximoRemedio.horario }}
               </span>
            </div>

            <div class="relative z-10 border-t-8 border-[#ffff00]/20 pt-4 flex flex-col items-center flex-1 justify-center w-[90%]">
              <h2 class="text-[#ffff00] font-[1000] text-[7vw] uppercase tracking-tighter leading-none mb-4 animate-text-glow text-center">
                {{ proximoRemedio.nome }}
              </h2>
              <div class="flex gap-4">
                <span class="bg-white text-black px-6 py-2 rounded-2xl font-[1000] text-xl uppercase italic whitespace-nowrap shadow-md">1 Comprimido</span>
                <span class="bg-white text-black px-6 py-2 rounded-2xl font-[1000] text-xl uppercase italic whitespace-nowrap shadow-md">Via Oral</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else 
             @mouseenter="falar('Nenhum remédio pendente! Tudo em dia!', false)"
             class="flex-grow bg-zinc-900 rounded-[50px] border-8 border-[#ffff00] flex flex-col items-center justify-center p-8 shadow-[0_0_50px_rgba(255,255,0,0.1)] overflow-hidden">
           
          <div class="relative w-44 h-72 mb-2 rotate-[35deg] animate-capsula-bounce shrink-0">
            <div class="w-full h-1/2 bg-[#FF0000] rounded-t-full border-[10px] border-black border-b-0"></div>
            <div class="w-[110%] h-6 bg-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-20"></div>
            <div class="w-full h-1/2 bg-[#ffff00] rounded-b-full border-[10px] border-black border-t-0 shadow-[inset_0_-20px_0_rgba(0,0,0,0.1)]"></div>
            <div class="absolute top-10 left-6 w-4 h-20 bg-white/30 rounded-full blur-[2px]"></div>
          </div>

          <div class="text-center pb-20">
            <h2 class="text-white font-[1000] text-[6vw] uppercase italic tracking-tighter leading-tight">
              NENHUM REMÉDIO<br>
              <span class="text-[#ffff00] drop-shadow-[0_0_15px_rgba(255,255,0,0.3)]">PENDENTE!</span>
            </h2>
          </div>
          
        </div>

      </section>

    </div>

  </main>
</template>

<style scoped>
.font-ultra-black { font-weight: 950; }
@keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.animate-loading-bar { animation: loading-bar 3s infinite linear; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.animate-float { animation: float 4s infinite ease-in-out; }
@keyframes text-glow { 0%, 100% { text-shadow: 0 0 20px rgba(255,255,0,0.5); } 50% { text-shadow: 0 0 40px rgba(255,255,0,0.8); } }
.animate-text-glow { animation: text-glow 2s infinite; }
@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
@keyframes capsula-bounce { 0%, 100% { transform: rotate(35deg) translateY(0); } 50% { transform: rotate(35deg) translateY(-15px); } }
.animate-capsula-bounce { animation: capsula-bounce 3s infinite ease-in-out; }
* { box-sizing: border-box; }
</style>