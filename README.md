# Encantos Burger

Site responsivo e painel administrativo da Encantos Burger. O catálogo é servido por uma API Express e persistido em SQLite; apenas o carrinho do cliente usa `localStorage`.

## Iniciar

Requer Node.js 20 ou superior.

```bash
npm install
Copy-Item .env.example .env
npm run create-admin -- admin@exemplo.com uma-senha-segura
npm run dev
```

- Site: `http://localhost:5173`
- Painel: `http://localhost:5173/admin`
- Em produção: `npm run build` e depois `npm start` (porta padrão 3001).

Defina uma `SESSION_SECRET` longa e aleatória no ambiente de produção. Não versione o arquivo `.env`.

## Onde alterar os dados

Depois de criar o primeiro administrador, use o painel:

- **Produtos:** nomes, descrições, ingredientes, preços, promoção, fotos, categoria, destaque, disponibilidade, visibilidade e ordem.
- **Categorias:** nome, ordem e estado ativo. Categorias com produtos não podem ser excluídas até que eles sejam transferidos.
- **Adicionais:** grupos de seleção única ou múltipla, limites, obrigatoriedade, opções, acréscimos e vínculos aos produtos.
- **Aparência:** título, subtítulo, botão e imagem principal, texto Sobre e aviso temporário.
- **Configurações:** logo, WhatsApp, Instagram, endereço, horários, entrega/retirada, taxa, pedido mínimo e mensagem do WhatsApp.

No ambiente Express, uploads ficam em `uploads/`; banco e sessões ficam em `data/`. No Vercel, imagens são enviadas ao Vercel Blob e exigem `BLOB_READ_WRITE_TOKEN`; o banco usa `DATABASE_URL` (pool) e as migrações devem usar `DATABASE_URL_UNPOOLED` (conexão direta).

## Dados ainda a preencher

O número de WhatsApp, Instagram, endereço, horários e logo oficial começam vazios. Enquanto o WhatsApp estiver vazio, o checkout informa que o canal aguarda configuração. A taxa de entrega começa como “a consultar”. Não há contatos fictícios.

Os três produtos iniciais (Clássico, Duplo Cheddar e Bacon Burger), suas descrições e preços são **dados demonstrativos**, identificados no catálogo e no banco pelo campo `demo`. Edite-os ou remova-os no painel antes de publicar comercialmente. A foto inicial é um ativo original gerado para este projeto e pode ser substituída pelo painel.

## Banco e segurança

O esquema local está em `server/db.js`. A migração incremental do Postgres está em `migrations/001_audit_hardening.sql`; teste-a primeiro numa branch isolada do Neon e só depois aplique conscientemente em produção com a URL direta. Ela não é executada pelo build.

Para criar ou atualizar um administrador no Postgres, configure `DATABASE_URL_UNPOOLED` e execute:

```bash
npm run create-admin:postgres -- admin@exemplo.com uma-senha-segura
```

As senhas são armazenadas com bcrypt; as sessões usam cookie `httpOnly`, `sameSite=lax` e `secure` em produção. `SESSION_SECRET` é obrigatória no Express de produção. Não existe cadastro público. Todas as rotas de gravação e upload exigem sessão administrativa, e tentativas de login são limitadas com estado persistido no banco.

Formatos de imagem aceitos: JPG, PNG e WebP, até 5 MB; o conteúdo real do arquivo é inspecionado. O carrinho revalida no servidor horário, modalidade, pedido mínimo, produtos, categorias, adicionais, preços e taxa antes de montar a mensagem do WhatsApp. Se a validação falhar, o cliente não usa dados locais como alternativa.

## Verificação

```bash
npm run check
```

Esse comando gera o catálogo público, compila o site e executa os testes das regras comerciais. Nenhum script publica o site automaticamente.
