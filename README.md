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

Uploads persistentes ficam em `uploads/`; banco e sessões ficam em `data/`. Em hospedagem, esses diretórios precisam estar em volume persistente e devem entrar no backup.

## Dados ainda a preencher

O número de WhatsApp, Instagram, endereço, horários e logo oficial começam vazios. Enquanto o WhatsApp estiver vazio, o checkout informa que o canal aguarda configuração. A taxa de entrega começa como “a consultar”. Não há contatos fictícios.

Os três produtos iniciais (Clássico, Duplo Cheddar e Bacon Burger), suas descrições e preços são **dados demonstrativos**, identificados no catálogo e no banco pelo campo `demo`. Edite-os ou remova-os no painel antes de publicar comercialmente. A foto inicial é um ativo original gerado para este projeto e pode ser substituída pelo painel.

## Banco e segurança

O esquema e as migrações idempotentes estão em `server/db.js`. As senhas são armazenadas com bcrypt; a sessão fica no SQLite e usa cookie `httpOnly`, `sameSite=lax` e `secure` em produção. Não existe cadastro público. Todas as rotas de gravação e upload exigem sessão administrativa.

Formatos de imagem aceitos: JPG, PNG e WebP, até 5 MB. O carrinho revalida preço, visibilidade e disponibilidade no servidor antes de montar a mensagem do WhatsApp.
