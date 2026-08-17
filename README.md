# Import Money — persistência por usuário no Wix

Este repositório contém a plataforma **Import Money** (`index.html`) e o
código Velo necessário para que, ao rodar dentro do Wix, cada mudança do
usuário (notas de corretagem importadas, operações, controle de gastos,
configurações etc.) seja salva automaticamente no login dele — e volte a
aparecer quando ele entrar de novo em outro navegador/computador.

## O que já está pronto

A própria `index.html` **já contém toda a ponte com o Wix** (não precisei
mexer nela): ela detecta sozinha se está rodando dentro de um iframe do
Wix e, nesse caso, troca o `localStorage` puro por sincronização via
`postMessage` com a página que a estiver hospedando. As chaves
sincronizadas são exatamente as que importam para "não perder nada":

- `carteira_acoes_v4` — todas as operações e notas de corretagem importadas
- `carteira_titular_v1` — perfil (CPF/nome do titular)
- `simulador_afec_v2` — simulador
- `controle_gastos_v1` — lançamentos de gastos e recebimentos
- `gastos_categorias_v1` / `receb_categorias_v1` — categorias personalizadas
- `darf_historico_v1` — histórico de DARFs
- `carteira_settings_v1`, `orphan_ignored_v1`, `ticker_rename_cache_v1`

Também já criei, no seu site Wix (**Importmoney**), a coleção de banco de
dados que vai guardar isso:

- **Coleção**: `ImportMoneyUserData`
- **Campos**: `memberId` (Text), `chave` (Text), `valor` (Text), `atualizadoEm` (Date & Time)
- **Permissões**: Admin para ler/escrever/apagar — ou seja, só o código de
  backend (abaixo) consegue acessar, nunca o navegador do visitante direto.

Falta só ligar os dois lados: **isso exige colar 2 arquivos de código no
Editor do Wix** (não existe uma API para eu fazer isso remotamente num
site Editor clássico — o código Velo só é editável de dentro do Editor).

## O que falta você fazer (uns 10 minutos)

### 1. Publicar o `index.html` em algum lugar com URL pública

O elemento de embed do Wix ("Inserir HTML"/"Custom Embeds") funciona
melhor apontando para uma URL, em vez de colar 800 KB de código dentro da
caixinha de texto do Editor. A forma mais simples e gratuita é usar o
**GitHub Pages** deste mesmo repositório:

1. No GitHub, vá em **Settings → Pages** deste repositório.
2. Em "Build and deployment", escolha **Deploy from a branch**, branch
   `main` (ou a branch que você publicar), pasta `/ (root)`.
3. Salve. Em alguns minutos o Wix te dará uma URL do tipo
   `https://pamelapissutti-web.github.io/importmoney/`.

(Se preferir, também dá para hospedar em Netlify/Vercel ou em qualquer
outro servidor — só precisa de uma URL pública apontando pro `index.html`.)

### 2. Backend: criar o web module

No Editor Wix → ative o **Modo Dev** (ícone `</>` no topo) → na aba
**Backend**, crie o arquivo:

```
backend/importMoneyData.web.js
```

e cole o conteúdo de [`wix-velo/backend/importMoneyData.web.js`](wix-velo/backend/importMoneyData.web.js)
deste repositório.

### 3. Criar a página da plataforma

1. Crie (ou escolha) a página do site onde a carteira vai ficar — ex.:
   **"Minha Carteira"**.
2. Em **Configurações da Página → Permissões**, marque **"Membros"**
   (só quem estiver logado consegue ver essa página; quem não estiver
   logado, o próprio Wix já mostra a tela de login).
3. Adicione o elemento **"Inserir HTML" / "Embed a Widget" → Custom
   Embeds → Embed HTML iframe**, cole a URL do passo 1 como link do
   iframe, e dê a ele um ID (ex. `html1`) no painel de configurações.
4. Ainda nessa página, abra o código da página (não o código do site) e
   cole o conteúdo de [`wix-velo/page-code/pagina-plataforma.js`](wix-velo/page-code/pagina-plataforma.js).
   Se o ID do elemento HTML não for `html1`, ajuste a linha
   `const ID_DO_ELEMENTO_HTML = '#html1';` no topo do arquivo.

### 4. Publicar o site

Publique o site Wix. Pronto: quando um usuário logado abrir essa página,
a plataforma carrega os dados salvos dele; qualquer mudança (importar
nota, editar operação, mexer no controle de gastos etc.) é salva
automaticamente ~1,5s depois, e reaparece em qualquer outro navegador em
que ele fizer login.

## Como funciona por baixo dos panos

```
Navegador do usuário
┌───────────────────────────────────────────┐
│  Página Wix (Velo)                         │
│  pagina-plataforma.js                      │
│    ├─ ouve WIX_PRONTO / WIX_SALVAR         │
│    ├─ chama backend/importMoneyData.web.js │
│    │     (só libera se o usuário estiver   │
│    │      logado — Permissions.SiteMember) │
│    └─ responde WIX_DADOS / WIX_SALVO_OK    │
│         │ postMessage / onMessage          │
│         ▼                                  │
│  ┌─────────────────────────────────────┐   │
│  │ iframe: index.html (Import Money)    │   │
│  │  - localStorage local (cache)        │   │
│  │  - detecta que está num iframe       │   │
│  │  - sincroniza as chaves críticas     │   │
│  └─────────────────────────────────────┘   │
└───────────────────────────────────────────┘
        │
        ▼
Coleção "ImportMoneyUserData" (Wix Data)
 1 linha por (memberId, chave) — isolada por usuário
```

Fora do Wix (abrindo o `index.html` direto no navegador), a plataforma
continua funcionando 100% com `localStorage`, sem nenhuma dependência do
Wix — é só dentro do iframe que a sincronização entra em ação.
