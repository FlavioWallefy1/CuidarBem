<script setup>
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted, ref } from 'vue'
import { db } from '../firebase'
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'

const router = useRouter()
const remedios = ref([])
let unsubscribe = null

const mostrarAjuda = ref(false)
const infoAjuda = ref({ nome: '', texto: '' })

// Controle do Modal Personalizado de Exclusão
const mostrarModalExclusao = ref(false)
const remedioParaExcluir = ref(null)

const idsFalados = ref(new Set())
const carregandoIA = ref(false)

let filaVoz = []
let processandoFila = false

const processarFilaVoz = () => {
  if (filaVoz.length === 0 || !('speechSynthesis' in window)) {
    processandoFila = false
    return
  }
  processandoFila = true
  const textoAtual = filaVoz.shift()
  const utterance = new SpeechSynthesisUtterance(textoAtual)
  utterance.lang = 'pt-BR'
  utterance.rate = 0.85
  utterance.onend = () => { setTimeout(() => processarFilaVoz(), 100) }
  utterance.onerror = () => { processarFilaVoz() }
  window.speechSynthesis.speak(utterance)
}

const falar = (texto, idUnico = null, limparFila = false) => {
  if (!('speechSynthesis' in window)) return
  if (idUnico && idsFalados.value.has(idUnico)) return

  // Converte para minúsculo para evitar que o sintetizador soletrar palavras em caixa alta
  const textoParaFalar = texto ? texto.toLowerCase() : ''

  if (limparFila) {
    window.speechSynthesis.cancel()
    filaVoz = [textoParaFalar]
    processandoFila = false
    processarFilaVoz()
    if (idUnico) idsFalados.value.add(idUnico)
    return
  }

  if (filaVoz[filaVoz.length - 1] === textoParaFalar) return
  filaVoz.push(textoParaFalar)
  if (idUnico) idsFalados.value.add(idUnico)

  if (!processandoFila && !window.speechSynthesis.speaking) {
    processarFilaVoz()
  }
}

const abrirAjudaIA = async (nomeRemedio) => {
  if (!nomeRemedio) return
  const nomeLimpo = nomeRemedio.toUpperCase().trim()

  infoAjuda.value = { nome: nomeLimpo, texto: 'Buscando informações...' }
  mostrarAjuda.value = true
  carregandoIA.value = true

  falar(`Consultando informações sobre ${nomeLimpo}`, null, true)

  const baseConhecimento = {
    DIPIRONA: 'A Dipirona é indicada para tratar dor e febre.',
    PARACETAMOL: 'O Paracetamol alivia dores e febre.',
    IBUPROFENO: 'O Ibuprofeno trata inflamações, dores e febre.',
    DORFLEX: 'O Dorflex é indicado para dores musculares.',
    DRAMIN: 'O Dramin trata enjoo, náuseas e vômitos.',
    OMEPRAZOL: 'O Omeprazol trata gastrite e azia.',
    BUSCOPAN: 'O Buscopan alivia cólicas.',
    LOSARTANA: 'Controla a pressão alta.',
    METFORMINA: 'Controla o diabetes.',
    AMOXICILINA: 'Antibiótico para infecções.',
    LORATADINA: 'Antialérgico para rinite.',
    RIVOTRIL: 'Calmante para ansiedade.'
  }

  let resposta = ''
  for (let key in baseConhecimento) {
    if (nomeLimpo.includes(key)) {
      resposta = baseConhecimento[key]
      break
    }
  }

  if (resposta) {
    setTimeout(() => {
      infoAjuda.value.texto = resposta
      carregandoIA.value = false
      falar(resposta, null, true)
    }, 800)
    return
  }

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: `Para que serve o remédio ${nomeLimpo}? Responda em UMA frase curta.`,
        stream: false
      })
    })

    const data = await response.json()
    let texto = data.response?.trim() || 'Não encontrei informações. Consulte um médico.'
    infoAjuda.value.texto = texto
    falar(texto, null, true)
  } catch (error) {
    const fallback = 'Não foi possível buscar informações. Consulte um profissional de saúde.'
    infoAjuda.value.texto = fallback
    falar(fallback, null, true)
  } finally {
    carregandoIA.value = false
  }
}

const fecharAjuda = () => {
  mostrarAjuda.value = false
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    filaVoz = []
    processandoFila = false
  }
}

const solicitarExclusao = (remedio) => {
  remedioParaExcluir.value = remedio
  mostrarModalExclusao.value = true
  falar(`Você clicou no botão para excluir o remédio ${remedio.nome}. Deseja realmente fazer isso? Se sim, abaixo temos dois botões o vermelho é para confirmar e exclusão e o amarelo é para cancelar.`, null, true)
}

const cancelarExclusao = () => {
  mostrarModalExclusao.value = false
  remedioParaExcluir.value = null
  falar("Exclusão cancelada.", null, true)
}

const confirmarExclusaoEfetiva = async () => {
  if (remedioParaExcluir.value) {
    try {
      await deleteDoc(doc(db, 'remedios', remedioParaExcluir.value.id))
      falar("Remédio removido com sucesso!", null, true)
      mostrarModalExclusao.value = false
      remedioParaExcluir.value = null
    } catch (e) {
      console.error("Erro ao excluir:", e)
      falar("Erro ao excluir o remédio.", null, true)
    }
  }
}

onMounted(() => {
  const q = query(collection(db, 'remedios'), orderBy('horario', 'asc'))
  unsubscribe = onSnapshot(q, (snapshot) => {
    const lista = []
    snapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() })
    })
    remedios.value = lista
  })

  setTimeout(() => {
    falar('Veja sua lista de remédios de hoje!')
  }, 800)
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  filaVoz = []
  processandoFila = false
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
})

const confirmarTomado = async (remedio) => {
  const refDoc = doc(db, 'remedios', remedio.id)
  await updateDoc(refDoc, { status: 'tomado' })
  falar(`Você tomou ${remedio.nome}`, null, true)
}
</script>

<template>
  <main class="w-screen h-[100dvh] bg-black text-white flex flex-col md:flex-row p-3 md:p-6 overflow-hidden select-none font-sans box-border relative gap-4">
    <!-- VERSÃO MOBILE -->
    <div class="flex md:hidden flex-col h-full w-full gap-3 overflow-hidden">
      <div class="flex items-center gap-3 shrink-0 pt-2">
        <div class="text-3xl animate-float shrink-0">🤖</div>
        <div class="bg-zinc-900/50 backdrop-blur-md border-l-8 border-[#00c3ff] px-3 py-2 rounded-[18px] shadow-xl flex-1 overflow-hidden">
          <p class="text-[#00c3ff] font-[1000] text-xs uppercase italic leading-tight truncate">
            VEJA AQUI SUA LISTA DE REMÉDIOS DE HOJE!
          </p>
        </div>
      </div>

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
          <button @click="router.push('/dashboard')" @mouseenter="falar('Ir para o início')" class="text-white font-black text-base uppercase transition-all hover:text-[#ffff00]">INÍCIO</button>
          <button class="text-black bg-[#ffff00] py-2 px-4 rounded-[15px] font-[1000] text-base uppercase shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]" @mouseenter="falar('Você já está na lista de remédios')">REMÉDIOS</button>
          <button @click="router.push('/')" @mouseenter="falar('Sair do sistema')" class="text-[#FF0000] font-[1000] text-base uppercase drop-shadow-[0_0_8px_rgba(255,0,0,0.4)]">SAIR</button>
        </nav>
      </aside>

      <div class="flex-grow flex flex-col overflow-y-auto gap-4 pr-1 scroll-personalizado pb-6">
        <button @click="router.push('/cadastrarremedio')" @mouseenter="falar('Adicionar novo agendamento', 'btn-add')" class="w-full shrink-0 bg-[#ffff00] text-black py-4 px-4 rounded-[30px] font-[1000] text-lg uppercase shadow-[6px_6px_0px_0px_rgba(255,255,0,0.15)] border-3 border-black transition-all flex items-center justify-center gap-2">
          <span>➕</span> ADICIONAR NOVO AGENDAMENTO
        </button>

        <div v-for="remedio in remedios" :key="remedio.id" 
             class="w-full shrink-0 rounded-[35px] p-1 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] transition-all"
             :style="{ backgroundColor: remedio.status === 'pendente' ? '#ffff00' : '#1a1a1a' }">
          <div class="h-full w-full bg-black rounded-[33px] border-[3px] border-black p-5 flex flex-col justify-between relative overflow-hidden">
            <button @click="solicitarExclusao(remedio)" @mouseenter="falar(`Se deseja excluir o remédio ${remedio.nome} aperte nesse x vermelho`)" class="absolute top-4 right-5 text-[#FF0000] font-black text-xl uppercase p-1 z-20">X</button>

            <div class="flex flex-col z-10" @mouseenter="falar(`Remédio ${remedio.nome} às ${remedio.horario}`, remedio.id)">
                <span class="text-white font-[1000] text-2xl leading-none tracking-tighter">{{ remedio.horario }}</span>
                <div v-if="remedio.status === 'tomado'" class="bg-[#00ff00] text-black px-4 py-1 rounded-full font-black text-xs uppercase mt-2 w-max">TOMADO ✅</div>
                <div v-else class="bg-[#ffff00] text-black px-4 py-1 rounded-full font-black text-xs uppercase animate-pulse mt-2 w-max">PENDENTE</div>
            </div>

            <div class="z-10 mt-3 flex justify-between items-end">
              <div>
                <h2 class="font-[1000] text-xl uppercase leading-none tracking-tighter mb-1" :style="{ color: remedio.status === 'pendente' ? '#ffff00' : '#FFFFFF' }">{{ remedio.nome }}</h2>
                <p class="text-white font-black text-sm uppercase opacity-80">1 COMPRIMIDO</p>
              </div>

              <button @click="abrirAjudaIA(remedio.nome)" @mouseenter="falar(`Precisa de ajuda com o remédio ${remedio.nome}? aperte esse botão vermelho para ouvir uma explicação simples`)" class="bg-[#FF0000] text-white py-2 px-5 rounded-[18px] font-[1000] text-sm uppercase shadow-[0_0_15px_rgba(255,0,0,0.4)] active:scale-95 transition-all border-2 border-black">AJUDA</button>
            </div>

            <button v-if="remedio.status === 'pendente'" @click="confirmarTomado(remedio)" class="z-10 w-full bg-[#ffff00] text-black py-3 rounded-[20px] font-[1000] text-lg uppercase shadow-xl active:scale-95 transition-all border-2 border-black mt-3">JÁ TOMEI</button>
          </div>
        </div>
      </div>
    </div>

    <!-- VERSÃO DESKTOP -->
    <div class="hidden md:flex h-full w-full flex-row">
      <aside class="w-[280px] h-full flex flex-col p-6 bg-[#0a0a0a] rounded-[40px] border-4 border-zinc-800 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mr-6 shrink-0 relative overflow-hidden">
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
          <button @click="router.push('/dashboard')" @mouseenter="falar('Ir para o início')" class="group flex items-center gap-4 py-2 text-white font-black text-3xl uppercase transition-all hover:text-[#ffff00] text-left pl-4">INÍCIO</button>
          <button class="w-full" @mouseenter="falar('Você já está na lista de remédios')"><div class="bg-[#ffff00] text-black py-5 rounded-[30px] font-[1000] text-3xl uppercase shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]">REMÉDIOS</div></button>
          <button @click="router.push('/')" @mouseenter="falar('Sair do sistema')" class="mt-auto py-6 text-[#FF0000] font-[1000] text-4xl uppercase border-t-2 border-zinc-900 pt-6 text-left drop-shadow-[0_0_15px_rgba(255,0,0,0.4)]">SAIR</button>
        </nav>
      </aside>

      <section class="flex-1 h-full flex flex-col gap-4 overflow-hidden">
        <div class="flex items-center gap-6 h-[18%] animate-fade-in-up shrink-0">
          <div class="text-7xl animate-float shrink-0">🤖</div>
          <div class="bg-zinc-900/50 backdrop-blur-md border-l-8 border-[#00c3ff] p-5 rounded-[30px] shadow-xl flex-1 overflow-hidden">
            <p class="text-[#00c3ff] font-[1000] text-[2.2vw] uppercase italic leading-none whitespace-nowrap tracking-tighter">VEJA AQUI SUA LISTA DE REMÉDIOS DE HOJE!</p>
          </div>
        </div>

        <div class="flex-grow flex flex-col overflow-y-auto gap-8 pr-2 scroll-personalizado pb-10">
          <button @click="router.push('/cadastrarremedio')" @mouseenter="falar('Adicionar novo agendamento', 'btn-add')" class="w-full shrink-0 bg-[#ffff00] text-black py-8 rounded-[45px] font-[1000] text-4xl uppercase shadow-[10px_10px_0px_0px_rgba(255,255,0,0.15)] border-4 border-black transition-all flex items-center justify-center gap-4 mt-2"><span>➕</span> ADICIONAR NOVO AGENDAMENTO</button>

          <div v-for="remedio in remedios" :key="remedio.id" 
               class="w-full shrink-0 min-h-[320px] rounded-[50px] p-1.5 shadow-[15px_15px_0px_0px_rgba(255,255,255,0.05)] transition-all mb-4"
               :style="{ backgroundColor: remedio.status === 'pendente' ? '#ffff00' : '#1a1a1a' }">
            <div class="h-full w-full bg-black rounded-[45px] border-[4px] border-black p-8 flex flex-col justify-between relative overflow-hidden">
              <button @click="solicitarExclusao(remedio)" @mouseenter="falar(`Se deseja excluir o remédio ${remedio.nome} aperte nesse x vermelho`)" class="absolute top-6 right-8 text-[#FF0000] hover:scale-110 font-black text-3xl uppercase p-2 z-20">X</button>

              <div class="flex flex-col z-10" @mouseenter="falar(`Remédio ${remedio.nome} às ${remedio.horario}`, remedio.id)">
                  <span class="text-white font-[1000] text-[5vw] leading-none tracking-tighter">{{ remedio.horario }}</span>
                  <div v-if="remedio.status === 'tomado'" class="bg-[#00ff00] text-black px-6 py-2 rounded-full font-black text-2xl uppercase mt-2 w-max">TOMADO ✅</div>
                  <div v-else class="bg-[#ffff00] text-black px-6 py-2 rounded-full font-black text-2xl uppercase animate-pulse mt-2 w-max">PENDENTE</div>
              </div>

              <div class="z-10 mt-4 flex justify-between items-end">
                <div>
                  <h2 class="font-[1000] text-[6vw] uppercase leading-none tracking-tighter mb-1" :style="{ color: remedio.status === 'pendente' ? '#ffff00' : '#FFFFFF' }">{{ remedio.nome }}</h2>
                  <p class="text-white font-black text-3xl uppercase opacity-80">1 COMPRIMIDO</p>
                </div>

                <button @click="abrirAjudaIA(remedio.nome)" @mouseenter="falar(`Precisa de ajuda com o remédio ${remedio.nome}? aperte esse botão vermelho para ouvir uma explicação simples do que é esse remédio`)" class="bg-[#FF0000] text-white py-4 px-10 rounded-[25px] font-[1000] text-3xl uppercase shadow-[0_0_20px_rgba(255,0,0,0.4)] active:scale-95 transition-all border-4 border-black mb-2">AJUDA</button>
              </div>

              <button v-if="remedio.status === 'pendente'" @click="confirmarTomado(remedio)" class="z-10 w-full bg-[#ffff00] text-black py-6 rounded-[30px] font-[1000] text-4xl uppercase shadow-xl active:scale-95 transition-all border-4 border-black mt-4">JÁ TOMEI</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- MODAL DE AJUDA -->
    <Transition name="fade">
      <div v-if="mostrarAjuda" class="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-md">
        <div class="max-w-4xl w-full max-h-[95vh] bg-[#0a0a0a] border-6 md:border-8 border-[#FF0000] rounded-[40px] md:rounded-[60px] p-5 md:p-10 flex flex-col gap-4 md:gap-6 shadow-[0_0_100px_rgba(255,0,0,0.3)] overflow-hidden">
          <div class="flex items-center gap-4 md:gap-6 border-b-4 border-zinc-800 pb-4 md:pb-6 shrink-0">
            <span class="text-5xl md:text-8xl" :class="carregandoIA ? 'animate-pulse' : 'animate-bounce'">🤖</span>
            <div class="overflow-hidden">
              <h3 class="text-[#FF0000] font-[1000] text-xl md:text-3xl uppercase italic leading-none">Aviso de Segurança</h3>
              <h2 class="text-white font-[1000] text-2xl md:text-6xl uppercase tracking-tighter truncate">{{ infoAjuda.nome }}</h2>
            </div>
          </div>

          <div class="bg-zinc-900 p-5 md:p-8 rounded-[30px] md:rounded-[40px] border-2 border-zinc-800 text-center overflow-y-auto scroll-personalizado">
            <p class="text-white font-black text-lg md:text-3xl leading-snug uppercase italic">
              "{{ infoAjuda.texto }}"
            </p>
          </div>

          <button @click="fecharAjuda" class="w-full bg-[#ffff00] text-black py-5 md:py-10 rounded-[30px] md:rounded-[40px] font-[1000] text-2xl md:text-5xl uppercase border-6 md:border-8 border-black shadow-[8px_8px_0_0_#fff] shrink-0 active:scale-95 transition-all">FECHAR AJUDA</button>
        </div>
      </div>
    </Transition>

    <!-- MODAL PERSONALIZADO DE EXCLUSÃO -->
    <Transition name="fade">
      <div v-if="mostrarModalExclusao" class="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-md">
        <div class="max-w-4xl w-full bg-[#0a0a0a] border-6 md:border-8 border-[#FF0000] rounded-[40px] md:rounded-[60px] p-6 md:p-10 flex flex-col gap-6 shadow-[0_0_100px_rgba(255,0,0,0.3)] text-center">
          
          <div class="flex items-center justify-center gap-4">
            <span class="text-6xl animate-bounce">⚠️</span>
            <h3 class="text-[#FF0000] font-[1000] text-2xl md:text-4xl uppercase italic leading-none">Confirmação de Exclusão</h3>
          </div>

          <div class="bg-zinc-900 p-6 rounded-[30px] border-2 border-zinc-800">
            <p class="text-white font-black text-xl md:text-3xl leading-snug uppercase">
              Você clicou no botão para excluir o remédio <span class="text-[#ffff00]">{{ remedioParaExcluir?.nome }}</span>. Deseja realmente fazer isso?
            </p>
          </div>

          <div class="flex flex-col md:flex-row gap-4">
            <button @click="confirmarExclusaoEfetiva" @mouseenter="falar('Sim, desejo excluir')" class="flex-1 bg-[#FF0000] text-white py-5 rounded-[30px] font-[1000] text-xl md:text-3xl uppercase border-4 border-black shadow-lg active:scale-95 transition-all">
              SIM, EXCLUIR 🗑️
            </button>
            <button @click="cancelarExclusao" @mouseenter="falar('Não, voltar')" class="flex-1 bg-[#ffff00] text-black py-5 rounded-[30px] font-[1000] text-xl md:text-3xl uppercase border-4 border-black shadow-lg active:scale-95 transition-all">
              NÃO, VOLTAR ❌
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.font-\[1000\] { font-weight: 950; }
@keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.animate-loading-bar { animation: loading-bar 3s infinite linear; }
.scroll-personalizado::-webkit-scrollbar { width: 8px; }
.scroll-personalizado::-webkit-scrollbar-track { background: #000; }
.scroll-personalizado::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.animate-float { animation: float 4s infinite ease-in-out; }
@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.animate-pulse { animation: pulse 1s infinite; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
* { box-sizing: border-box; }
</style>