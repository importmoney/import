// ══════════════════════════════════════════════════════════════════
// Import Money — Código da página (Velo)
// Faz a ponte entre o elemento HTML embutido (a plataforma) e o
// backend, para carregar/salvar os dados do usuário logado.
//
// COMO INSTALAR:
// 1. Crie/abra a página do site onde a plataforma vai ficar (ex.:
//    "Minha Carteira") e em Configurações da Página > Permissões,
//    marque "Membros" (só membros logados podem ver a página — o
//    próprio Wix já mostra a tela de login para quem não estiver
//    logado, então não precisa de código extra para isso).
// 2. Adicione o elemento "Inserir HTML" / "Custom Embeds" (embed de
//    iframe) nessa página, apontando para a URL onde o index.html
//    está publicado (veja o README na raiz do repositório).
// 3. Selecione o elemento, abra o painel de configurações e copie o
//    "ID do elemento" (ex.: html1). Ajuste o ID abaixo se for diferente.
// 4. No Editor, abra o código da PÁGINA (não do site inteiro) e cole
//    todo o conteúdo deste arquivo.
// ══════════════════════════════════════════════════════════════════

import { loadUserData, saveUserData } from 'backend/importMoneyData.web';

const ID_DO_ELEMENTO_HTML = '#html1'; // ajuste para o ID real do seu elemento

$w.onReady(function () {
  const html = $w(ID_DO_ELEMENTO_HTML);

  html.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    // A plataforma avisou que carregou e quer os dados salvos.
    if (msg.tipo === 'WIX_PRONTO') {
      try {
        const dados = await loadUserData();
        html.postMessage({ tipo: 'WIX_DADOS', dados });
      } catch (e) {
        html.postMessage({ tipo: 'WIX_ERRO', erro: String((e && e.message) || e) });
      }
    }

    // A plataforma quer salvar mudanças (operações, gastos, etc.)
    if (msg.tipo === 'WIX_SALVAR') {
      try {
        await saveUserData(msg.dados);
        html.postMessage({ tipo: 'WIX_SALVO_OK' });
      } catch (e) {
        html.postMessage({ tipo: 'WIX_ERRO', erro: String((e && e.message) || e) });
      }
    }
  });

  // Caso o iframe já tenha carregado e enviado WIX_PRONTO antes deste
  // código rodar, isso faz a plataforma reenviar o pedido.
  html.postMessage({ tipo: 'VELO_PRONTO' });
});
