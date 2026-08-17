// ══════════════════════════════════════════════════════════════════
// Import Money — Backend Velo (Web Module)
// Salva e carrega os dados da plataforma por usuário logado no Wix.
//
// COMO INSTALAR:
// 1. No Editor Wix, ative o modo Dev (ícone </> no topo).
// 2. Em "Backend", crie o arquivo:  backend/importMoneyData.web.js
// 3. Copie e cole todo o conteúdo deste arquivo lá.
//
// Depende da coleção "ImportMoneyUserData" (já criada no seu site),
// com os campos: memberId (Text), chave (Text), valor (Text),
// atualizadoEm (Date & Time). Permissões: Admin para tudo — o acesso
// só acontece por aqui, usando suppressAuth, nunca direto do front-end.
// ══════════════════════════════════════════════════════════════════

import { webMethod, Permissions } from 'wix-web-module';
import wixData from 'wix-data';
import { currentMember } from 'wix-members-backend';

const COLLECTION = 'ImportMoneyUserData';

async function getMemberIdOuFalha() {
  const member = await currentMember.getMember();
  if (!member || !member._id) {
    throw new Error('Usuário não está logado.');
  }
  return member._id;
}

// Chamado quando a plataforma envia WIX_PRONTO — devolve tudo que
// já está salvo para este usuário.
export const loadUserData = webMethod(Permissions.SiteMember, async () => {
  const memberId = await getMemberIdOuFalha();
  const { items } = await wixData
    .query(COLLECTION)
    .eq('memberId', memberId)
    .limit(100)
    .find({ suppressAuth: true });

  const dados = {};
  items.forEach((item) => {
    dados[item.chave] = item.valor;
  });
  return dados;
});

// Chamado quando a plataforma envia WIX_SALVAR — grava/atualiza
// cada chave alterada (operações, carteira, controle de gastos etc.)
export const saveUserData = webMethod(Permissions.SiteMember, async (dados) => {
  const memberId = await getMemberIdOuFalha();
  const chaves = Object.keys(dados || {});

  await Promise.all(
    chaves.map((chave) =>
      wixData.save(
        COLLECTION,
        {
          // _id determinístico = upsert natural (1 linha por usuário+chave)
          _id: `${memberId}::${chave}`,
          memberId,
          chave,
          valor: dados[chave],
          atualizadoEm: new Date(),
        },
        { suppressAuth: true }
      )
    )
  );

  return { ok: true };
});
