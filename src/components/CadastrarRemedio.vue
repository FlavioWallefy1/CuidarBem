<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore'

const router = useRouter()
const route = useRoute()

const nomeRemedio = ref('')
const hora = ref(8)
const minutos = ref(0)
const idEdicao = ref(route.query.id || null)

// Lógica para ligar o Input de Hora às variáveis hora/minuto
const horarioInput = computed({
  get: () => `${String(hora.value).padStart(2, '0')}:${String(minutos.value).padStart(2, '0')}`,
  set: (novoValor) => {
    if (novoValor) {
      const [h, m] = novoValor.split(':')
      hora.value = parseInt(h)
      minutos.value = parseInt(m)
    }
  }
})

// O "caderninho" para evitar repetições chatas no conteúdo
const idsFalados = ref(new Set())

const falar = (texto, idUnico = null) => {
  if ('speechSynthesis' in window) {
    if (idUnico && idsFalados.value.has(idUnico)) return;

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(texto)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)

    if (idUnico) idsFalados.value.add(idUnico)
  }
}

const carregarDadosParaEdicao = async () => {
  if (idEdicao.value) {
    try {
      const docRef = doc(db, "remedios", idEdicao.value)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const dados = docSnap.data()
        nomeRemedio.value = dados.nome
        const [h, m] = dados.horario.split(':')
        hora.value = parseInt(h)
        minutos.value = parseInt(m)
      }
    } catch (error) {
      console.error("Erro ao carregar:", error)
    }
  }
}

onMounted(() => {
  carregarDadosParaEdicao()
})

onUnmounted(() => {
  window.speechSynthesis.cancel()
})

const ajustarHora = (valor) => {
  hora.value = (hora.value + valor + 24) % 24
}

const ajustarMinuto = (valor) => {
  minutos.value = (minutos.value + valor + 60) % 60
}

const salvarRemedio = async () => {
  if (!nomeRemedio.value) {
    falar("Por favor, digite o nome do remédio antes de salvar.")
    return
  }

  const horarioFormatado = `${String(hora.value).padStart(2, '0')}:${String(minutos.value).padStart(2, '0')}`

  try {
    if (idEdicao.value) {
      const docRef = doc(db, "remedios", idEdicao.value)
      await updateDoc(docRef, {
        nome: nomeRemedio.value.toUpperCase(),
        horario: horarioFormatado,
        atualizadoEm: serverTimestamp()
      })
      falar("Alteração salva com sucesso!")
    } else {
      await addDoc(collection(db, "remedios"), {
        nome: nomeRemedio.value.toUpperCase(),
        horario: horarioFormatado,
        status: 'pendente',
        criadoEm: serverTimestamp()
      })
      falar("Remédio agendado com sucesso!")
    }
    setTimeout(() => router.push('/remedios'), 2000)
  } catch (error) {
    console.error("Erro ao salvar:", error)
    falar("Erro ao conectar com o banco de dados.")
  }
}
</script>

<template>
  <main class="w-screen h-screen bg-black text-white flex p-4 overflow-hidden select-none font-sans box-border">
    
    <aside class="w-[280px] h-full flex flex-col p-6 bg-[#0a0a0a] rounded-[40px] border-4 border-zinc-800 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mr-6 shrink-0 relative overflow-hidden">
      
      <div class="flex flex-col gap-2 mb-8 relative z-10">
        <div class="flex items-center gap-3">
          <div class="bg-[#ffff00] p-2 rounded-xl rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h1 class="text-[#ffff00] text-2xl font-[1000] italic leading-none uppercase">CUIDAR<br>BEM</h1>
        </div>
        <div class="h-1 bg-zinc-800 mt-4 rounded-full overflow-hidden">
          <div class="h-full bg-[#ffff00] w-2/3 animate-loading-bar"></div>
        </div>
      </div>

      <nav class="flex flex-col gap-6 flex-grow relative z-10">
        <button @click="router.push('/dashboard')" @mouseenter="falar('Ir para o início')" class="group flex items-center gap-4 py-2 text-white font-black text-3xl uppercase transition-all hover:text-[#ffff00] text-left pl-4">
          INÍCIO
        </button>
        <button @click="router.push('/remedios')" @mouseenter="falar('Ver meus remédios')" class="group flex items-center gap-4 py-2 text-white font-black text-3xl uppercase transition-all hover:text-[#ffff00] text-left pl-4">
          REMÉDIOS
        </button>
        <button class="w-full" @mouseenter="falar(idEdicao ? 'Você está alterando um remédio' : 'Você está cadastrando um novo remédio')">
          <div class="bg-[#ffff00] text-black py-5 rounded-[30px] font-[1000] text-3xl uppercase shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]">
            {{ idEdicao ? 'ALTERAR' : 'AGENDAR' }}
          </div>
        </button>
        <button @click="router.push('/')" @mouseenter="falar('Sair do sistema')" class="mt-auto py-6 text-[#FF0000] font-[1000] text-4xl uppercase border-t-2 border-zinc-900 pt-6 text-left drop-shadow-[0_0_15px_rgba(255,0,0,0.4)]">
          SAIR
        </button>
      </nav>
    </aside>

    <section class="flex-1 h-full flex flex-col gap-4 overflow-hidden">
      
      <div class="flex items-center gap-6 h-[15%] shrink-0">
        <div class="text-7xl animate-float shrink-0">🤖</div>
        <div class="bg-zinc-900/50 backdrop-blur-md border-l-8 border-[#00c3ff] p-5 rounded-[30px] shadow-xl flex-1 overflow-hidden">
          <p class="text-[#00c3ff] font-[1000] text-[2.2vw] uppercase italic leading-none whitespace-nowrap tracking-tighter">
            {{ idEdicao ? 'VAMOS ALTERAR SEU REMÉDIO!' : 'VAMOS CADASTRAR UM NOVO REMÉDIO!' }}
          </p>
        </div>
      </div>

      <div class="flex-grow flex flex-col gap-6 overflow-y-auto pr-2 scroll-personalizado pb-10">
        
        <div 
          class="bg-zinc-900 rounded-[40px] p-8 border-4 border-zinc-800 shadow-[15px_15px_0px_0px_rgba(255,255,0,0.05)]"
          @mouseenter="falar('Toque no campo preto de borda amarela para digitar o nome do remédio', 'campo-nome')"
        >
          <label class="text-white font-black text-3xl uppercase mb-4 block tracking-tight">QUAL O NOME DO REMÉDIO?</label>
          <input v-model="nomeRemedio" type="text" placeholder="TOQUE AQUI PARA DIGITAR" class="w-full bg-black border-4 border-[#ffff00] rounded-[25px] p-6 text-white font-[1000] text-5xl uppercase focus:outline-none focus:shadow-[0_0_40px_rgba(255,255,0,0.3)] placeholder:text-[#ffff00]/30">
        </div>

        <div 
          class="bg-zinc-900 rounded-[40px] p-8 border-4 border-zinc-800 shadow-[15px_15px_0px_0px_rgba(255,255,0,0.05)] flex items-center justify-between"
          @mouseenter="falar('Toque no número para digitar o horário ou use os botões ao lado', 'campo-hora')"
        >
          <div class="flex flex-col gap-2">
            <label class="text-white font-black text-3xl uppercase tracking-tight">QUE HORAS TOMAR?</label>
            <div class="flex items-center">
              <input 
                type="time" 
                v-model="horarioInput"
                class="bg-transparent text-[#ffff00] font-[1000] text-9xl tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,0,0.3)] border-none outline-none cursor-pointer"
                style="color-scheme: dark;"
              >
            </div>
          </div>
          <div class="flex gap-4">
            <div class="flex flex-col gap-4">
              <button @click="ajustarHora(1)" class="w-24 h-24 bg-[#ffff00] text-black rounded-3xl font-black text-6xl shadow-lg active:scale-90">+</button>
              <button @click="ajustarHora(-1)" class="w-24 h-24 bg-zinc-800 text-white rounded-3xl font-black text-6xl shadow-lg active:scale-90">-</button>
            </div>
          </div>
        </div>

        <button 
          @click="salvarRemedio"
          @mouseenter="falar('Toque aqui para salvar o agendamento', 'botao-salvar')"
          class="w-full bg-[#00ff00] text-black py-10 rounded-[45px] font-[1000] text-6xl uppercase shadow-[15px_15px_0px_0px_rgba(0,255,0,0.2)] border-8 border-black hover:scale-[1.02] active:scale-95 transition-all mt-4"
        >
          {{ idEdicao ? 'SALVAR ALTERAÇÕES ✅' : 'SALVAR AGENDAMENTO ✅' }}
        </button>

      </div>
    </section>
  </main>
</template>

<style scoped>
.font-\[1000\] { font-weight: 950; }
@keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.animate-loading-bar { animation: loading-bar 3s infinite linear; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.animate-float { animation: float 4s infinite ease-in-out; }
.scroll-personalizado::-webkit-scrollbar { width: 12px; }
.scroll-personalizado::-webkit-scrollbar-track { background: #000; }
.scroll-personalizado::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }

input[type="time"]::-webkit-calendar-picker-indicator {
    background: none;
    display: none;
}

* { box-sizing: border-box; }
</style>