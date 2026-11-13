const products = [
  // Burgers
  ["Burgers", "Kids Burger", "Pão, hambúrguer e queijo.", 1500],
  [
    "Burgers",
    "Big Duplo Burger",
    "Pão, duplo burger, queijo cremoso, cheddar, bacon, alface e maionese.",
    3500,
  ],
  [
    "Burgers",
    "California Burger",
    "Pão, hambúrguer suíno, queijo, farofa de bacon, salada coleslaw e molho barbecue.",
    2800,
  ],
  [
    "Burgers",
    "Egg Bacon Burger",
    "Pão, hambúrguer, alface, tomate, picles, queijo, ovo, bacon e maionese.",
    2800,
  ],
  [
    "Burgers",
    "Encanto Burger",
    "Pão, hambúrguer, alface, bacon, queijo, maionese e cebola crispy.",
    2800,
  ],
  [
    "Burgers",
    "Family Burger",
    "Pão, hambúrguer, alface, tomate e maionese.",
    1800,
  ],
  [
    "Burgers",
    "Frangão Burger",
    "Pão, hambúrguer de frango, alface, catupiry, cebola agridoce, bacon e maionese.",
    2800,
  ],
  [
    "Burgers",
    "Hollywood Burger",
    "Pão, hambúrguer, alface, tomate, molho cheddar, bacon, cebola chapeada ao molho shoyo e maionese.",
    2800,
  ],
  [
    "Burgers",
    "Toscana Burger",
    "Pão, hambúrguer toscana, vinagrete, molho de mostarda, queijo e bacon.",
    2800,
  ],
  [
    "Burgers",
    "Tropical Burger",
    "Pão, hambúrguer, queijo, rúcula, bacon, geleia de abacaxi e maionese.",
    2800,
  ],
  [
    "Burgers",
    "Pururuca Burger",
    "Pão, hambúrguer suíno, queijo, bacon, alface e cebola agridoce.",
    2800,
  ],
  [
    "Burgers",
    "Vegetariano Burger",
    "Pão, burger de soja, tomate, alface, queijo, cebola chapeada ou cebola crispy e maionese.",
    2800,
  ],
  [
    "Burgers",
    "Picanha Burger",
    "Pão, hambúrguer, tiras de picanha, bacon, queijo e maionese.",
    3800,
  ],
  [
    "Burgers",
    "Brasão Burger",
    "Pão, triplo burger, alface, tomate, cebola roxa, cheddar, queijo cremoso, bacon e maionese.",
    4500,
  ],
  // Lançamentos
  [
    "Lançamentos",
    "Costela Burger",
    "Pão, hambúrguer, catupiry, costela desfiada e molho especial.",
    3500,
  ],
  [
    "Lançamentos",
    "GG Burger",
    "Pão, burger duplo, queijo mussarela, queijo empanado, geleia de bacon, alface e molho de mostarda, mel e pimenta.",
    4600,
  ],
  [
    "Lançamentos",
    "Doritos Burger",
    "Pão, burger, cheddar, bacon e Doritos.",
    2800,
  ],
  // Porções
  ["Porções", "Batata Frita Simples", "", 2500],
  ["Porções", "Batata Completa", "Queijo, bacon, cheddar e catupiry.", 4000],
  ["Porções", "Batata com Queijo e Bacon", "", 3800],
  ["Porções", "Batata com Queijo e Calabresa", "", 4000],
  ["Porções", "Onion Rings", "", 2500],
  ["Porções", "Frango à Passarinho", "", 3800],
  ["Porções", "Tilápia", "", 4000],
  ["Porções", "Mandioca", "", 2000],
  ["Porções", "Polenta", "", 2200],
  ["Porções", "Bolinho de Carne", "", 2500],
  ["Porções", "Frios", "", 3800],
  ["Porções", "Alcatra", "Queijo, pepino e ovos de codorna.", 7000],
  [
    "Tábua de Carnes",
    "Tábua de Carnes",
    "Alcatra, frango à passarinho, batata, mandioca, bacon, mussarela, calabresa e fatias de pão.",
    15000,
  ],
  // Pastéis salgados
  ["Pastéis Salgados", "Carne Simples", "Carne e temperinho verde.", 1500],
  ["Pastéis Salgados", "Carne Completo", "Carne, ovo e queijo.", 1800],
  ["Pastéis Salgados", "Frango", "", 1600],
  ["Pastéis Salgados", "Frango Bacon Milho", "", 1800],
  ["Pastéis Salgados", "Frango com Catupiry", "", 1800],
  ["Pastéis Salgados", "Palmito", "Mussarela e creme de palmito.", 1800],
  [
    "Pastéis Salgados",
    "Picante",
    "Queijo, presunto, azeitona, tomate, bacon e molho picante.",
    1800,
  ],
  [
    "Pastéis Salgados",
    "Strogonoff de Frango",
    "Strogonoff de frango, queijo e batata palha.",
    1800,
  ],
  ["Pastéis Salgados", "Pizza", "Mussarela, presunto, tomate e orégano.", 1800],
  ["Pastéis Salgados", "3 Queijos", "Mussarela, catupiry e cheddar.", 2000],
  [
    "Pastéis Salgados",
    "Strogonoff de Carne",
    "Strogonoff de carne, queijo e batata palha.",
    2200,
  ],
  [
    "Pastéis Salgados",
    "Especial Encanto",
    "Carne moída, frango, queijo, bacon, presunto, ovo, milho, ervilha, azeitona e orégano. 460 g.",
    2800,
  ],
  [
    "Pastéis Salgados",
    "Calabresa",
    "Calabresa, bacon e mussarela. Massa de ervas finas.",
    2000,
  ],
  [
    "Pastéis Salgados",
    "Vegetariano",
    "Brócolis, milho, ervilha fresca, palmito, mussarela e catupiry. Massa de ervas finas.",
    2000,
  ],
  [
    "Pastéis Salgados",
    "Carne Seca",
    "Carne seca e catupiry. Massa de ervas finas.",
    2300,
  ],
  [
    "Pastéis Salgados",
    "Picante Misto",
    "Frango, carne, bacon, calabresa, catupiry e geleia de pimenta. Massa vermelha.",
    2500,
  ],
  // Pastéis doces
  ["Pastéis Doces", "Banana com Canela", "", 1200],
  ["Pastéis Doces", "Banana com Doce de Leite", "", 1500],
  ["Pastéis Doces", "Sensação", "", 1800],
  ["Pastéis Doces", "Dois Amores", "", 1800],
  ["Pastéis Doces", "Romeu e Julieta", "", 1500],
  ["Pastéis Doces", "Chocolate com Pimenta", "Massa vermelha.", 1800],
  ["Pastéis Doces", "Banana com Creme de Avelã", "Massa de chocolate.", 2000],
  // Sobremesas
  ["Sobremesas", "Brownie com Sorvete", "", 1800],
  ["Sobremesas", "Sorvete na Taça", "", 2000],
  ["Sobremesas", "Banana Split", "", 2000],
  ["Sobremesas", "Merengue de Morango", "", 2000],
  ["Sobremesas", "Banoffee", "", 2000],
  ["Sobremesas", "Taça Encantos", "", 2000],
  ["Sobremesas", "Tigela de Açaí", "", 2500],
  // Drinks alcoólicos
  [
    "Drinks Alcoólicos",
    "Espanhola",
    "Leite condensado, maracujá, morango ou abacaxi e vinho tinto suave.",
    1800,
  ],
  [
    "Drinks Alcoólicos",
    "Caipiroska de Açaí",
    "Vodka, morango, açaí e leite condensado.",
    2000,
  ],
  [
    "Drinks Alcoólicos",
    "Ferrugem",
    "Whisky, Amarula, sorvete de creme e bolacha Negresco.",
    2500,
  ],
  [
    "Drinks Alcoólicos",
    "Gin Cremoso",
    "Gin, leite condensado, leite de coco, coco ralado e Gakak em pó.",
    2200,
  ],
  [
    "Drinks Alcoólicos",
    "Moscow Mule",
    "Vodka, suco de limão, xarope de gengibre, água com gás e espuma caseira.",
    2200,
  ],
  [
    "Drinks Alcoólicos",
    "Camaleão",
    "Vodka blueberry, gelo de coco, energético e xarope.",
    2000,
  ],
  [
    "Drinks Alcoólicos",
    "Mojito Tradicional",
    "Rum, açúcar, limão, Sprite Zero, hortelã e gelo.",
    2000,
  ],
  [
    "Drinks Alcoólicos",
    "Mojito de Maracujá",
    "Rum, açúcar, maracujá, suco de limão, hortelã, água com gás e gelo.",
    2000,
  ],
  [
    "Drinks Alcoólicos",
    "50 Tons de Cinza",
    "Sorvete de flocos, Jurupinga e corante preto.",
    2500,
  ],
  [
    "Drinks Alcoólicos",
    "Piña Colada com Álcool",
    "Leite condensado, leite de coco, suco de abacaxi, gelo e Smirnoff.",
    2000,
  ],
  ["Drinks Alcoólicos", "Yakult", "Limão, Yakult, açúcar, vodka e gelo.", 2000],
  [
    "Drinks Alcoólicos",
    "Cerveja",
    "Limão, açúcar, vodka, gelo e cerveja.",
    2000,
  ],
  [
    "Drinks Alcoólicos",
    "Draft de Vinho",
    "Limão, leite condensado, cachaça e draft de vinho.",
    2000,
  ],
  [
    "Drinks Alcoólicos",
    "Tropical",
    "Vodka, açúcar, picolé e polpa de fruta.",
    2000,
  ],
  // Drinks sem álcool
  [
    "Drinks sem Álcool",
    "Soda Italiana",
    "Limão, xarope de frutas, água com gás e gelo.",
    1800,
  ],
  [
    "Drinks sem Álcool",
    "Smurf",
    "Xarope Curaçau Blue, limão, refrigerante de soda e gelo.",
    1800,
  ],
  [
    "Drinks sem Álcool",
    "Mix de Frutas",
    "Polpa de frutas, leite condensado, creme de leite, refrigerante e gelo.",
    1800,
  ],
  [
    "Drinks sem Álcool",
    "Cerveja sem Álcool",
    "Limão, açúcar, cerveja sem álcool e gelo.",
    2000,
  ],
  [
    "Drinks sem Álcool",
    "Piña Colada",
    "Leite condensado, leite de coco, suco de abacaxi e gelo.",
    1800,
  ],
  [
    "Drinks sem Álcool",
    "Paradise",
    "Groselha, suco de laranja, isotônico e gelo.",
    1800,
  ],
  [
    "Drinks sem Álcool",
    "Frapê",
    "Morango, amora, leite condensado e água.",
    1800,
  ],
  // Caipiras e sucos
  [
    "Caipiras",
    "Caipira com Vodka",
    "Sabores: morango, kiwi, abacaxi, limão, maracujá ou maracujá com banana.",
    1500,
  ],
  [
    "Caipiras",
    "Caipira com Bacardi",
    "Sabores: morango, kiwi, abacaxi, limão, maracujá ou maracujá com banana.",
    2000,
  ],
  [
    "Caipiras",
    "Caipira com Steinhäger",
    "Sabores: morango, kiwi, abacaxi, limão, maracujá ou maracujá com banana.",
    2000,
  ],
  [
    "Caipiras",
    "Caipira com Cachaça",
    "Sabores: morango, kiwi, abacaxi, limão, maracujá ou maracujá com banana.",
    1800,
  ],
  [
    "Caipiras",
    "Caipira com Smirnoff",
    "Sabores: morango, kiwi, abacaxi, limão, maracujá ou maracujá com banana.",
    2000,
  ],
  [
    "Sucos",
    "Suco com Água",
    "Sabores: uva, amora, abacaxi com hortelã, coco, laranja natural, maracujá, morango, kiwi, manga ou frutas vermelhas.",
    1200,
  ],
  [
    "Sucos",
    "Suco com Leite",
    "Sabores: uva, amora, abacaxi com hortelã, coco, laranja natural, maracujá, morango, kiwi, manga ou frutas vermelhas.",
    1500,
  ],
];

const pizzas = [
  [
    "Frango com Catupiry",
    "Molho de tomate, mussarela, frango e catupiry e orégano.",
    6000,
    6500,
  ],
  [
    "Calabresa Tradicional",
    "Molho de tomate, mussarela, presunto, calabresa, cebola e orégano.",
    6000,
    6500,
  ],
  [
    "Espanhola",
    "Molho de tomate, mussarela, atum, palmito, tomate picado, catupiry e orégano.",
    6000,
    6500,
  ],
  [
    "Bacon",
    "Molho de tomate, mussarela, presunto, bacon e orégano.",
    6300,
    6800,
  ],
  [
    "Calabresa Especial",
    "Molho de tomate, mussarela, presunto, calabresa ralada, champignon, bacon, cebola, catupiry e orégano.",
    6300,
    6800,
  ],
  [
    "Marguerita",
    "Molho de tomate, mussarela, tomate, manjericão fresco e orégano.",
    6300,
    6800,
  ],
  [
    "Vegetariana",
    "Molho de tomate, mussarela, brócolis, palmito, milho, ervilha fresca, tomate, cebola, pimentão verde, orégano e azeitonas.",
    5800,
    6500,
  ],
  [
    "Portuguesa",
    "Molho de tomate, mussarela, presunto, calabresa, palmito, ovo, ervilha, cebola, tomate, orégano, azeitona e queijo cremoso.",
    6000,
    6900,
  ],
  [
    "À Moda",
    "Molho de tomate, mussarela, lombo canadense, ervilha fresca, milho, bacon, palmito, catupiry, manjericão, orégano e tomate.",
    6500,
    7000,
  ],
  [
    "4 Queijos",
    "Molho de tomate, mussarela, catupiry, cheddar, provolone e orégano.",
    6800,
    7300,
  ],
  [
    "Coração",
    "Molho de tomate, mussarela, coração de frango, bacon, tomate e orégano.",
    6800,
    7300,
  ],
  [
    "Mignon Especial",
    "Molho de tomate, mussarela, mignon, molho barbecue e orégano.",
    8300,
    9000,
  ],
  [
    "Strogonoff de Carne",
    "Molho de tomate, mussarela, strogonoff de carne, batata palha e orégano.",
    7500,
    8000,
  ],
  [
    "Costelinha de Porco Defumada",
    "Molho de tomate, mussarela, costelinha defumada, molho barbecue e orégano.",
    7500,
    8000,
  ],
  [
    "Brasileira",
    "Molho de tomate, mussarela, frango ao molho branco, bacon, milho, ervilha, palmito, cebola, pimentão e catupiry.",
    7300,
    7800,
  ],
  [
    "Brócolis com Bacon",
    "Molho de tomate, mussarela, brócolis, bacon e catupiry.",
    6300,
    6800,
  ],
];

const sweetPizzas = [
  ["Prestígio", "Mussarela, chocolate preto e coco ralado.", 6000, 6500],
  [
    "Sonho de Valsa",
    "Mussarela, chocolate preto e Sonho de Valsa.",
    6000,
    6500,
  ],
  ["Sensação", "Mussarela, chocolate preto e morango.", 6000, 6500],
  ["Banana", "Mussarela, banana, chocolate branco e canela.", 6000, 6500],
];

// Fotos oficiais identificadas por nome nas publicações do Instagram da marca.
// Só preenche itens sem imagem para não sobrescrever alterações feitas no painel.
const officialProductImages = {
  "GG Burger": "/assets/menu/gg-burger-instagram.jpg",
};

export function importOfficialMenu(db) {
  const categoryId = db.prepare(
    "SELECT id FROM categories WHERE lower(name)=lower(?) LIMIT 1",
  );
  const exists = db.prepare(
    "SELECT id FROM products WHERE category_id=? AND lower(name)=lower(?) LIMIT 1",
  );
  const insert = db.prepare(`INSERT INTO products
    (name,description,ingredients,price,category_id,image_url,featured,available,visible,sort_order,demo)
    VALUES (?,?,?,?,?,'',0,1,1,?,0)`);
  let order = 100;
  db.transaction(() => {
    for (const [category, name, description, price] of products) {
      const cat = categoryId.get(category);
      if (cat && !exists.get(cat.id, name))
        insert.run(name, description, description, price, cat.id, order++);
    }
    const setOfficialImage = db.prepare(
      "UPDATE products SET image_url=? WHERE lower(name)=lower(?) AND image_url=''",
    );
    Object.entries(officialProductImages).forEach(([name, imageUrl]) =>
      setOfficialImage.run(imageUrl, name),
    );
    const addPizza = (category, [name, description, medium, large]) => {
      const cat = categoryId.get(category);
      if (!cat || exists.get(cat.id, name)) return;
      const productId = Number(
        insert.run(name, description, description, medium, cat.id, order++)
          .lastInsertRowid,
      );
      const groupId = Number(
        db
          .prepare(
            "INSERT INTO option_groups (name,selection_type,required,min_choices,max_choices,active) VALUES ('Tamanho','single',1,1,1,1)",
          )
          .run().lastInsertRowid,
      );
      const option = db.prepare(
        "INSERT INTO option_items (group_id,name,price_delta,active) VALUES (?,?,?,1)",
      );
      option.run(groupId, "M", 0);
      option.run(groupId, "G", large - medium);
      db.prepare("INSERT INTO product_option_groups VALUES (?,?)").run(
        productId,
        groupId,
      );
    };
    pizzas.forEach((pizza) => addPizza("Pizzas Salgadas", pizza));
    sweetPizzas.forEach((pizza) => addPizza("Pizzas Doces", pizza));

    const burgerCategory = categoryId.get("Burgers");
    if (burgerCategory) {
      let group = db
        .prepare("SELECT id FROM option_groups WHERE name=? LIMIT 1")
        .get("Adicionais do cardápio");
      if (!group) {
        const groupId = Number(
          db
            .prepare(
              "INSERT INTO option_groups (name,selection_type,required,min_choices,max_choices,active) VALUES (?,'multiple',0,0,9,1)",
            )
            .run("Adicionais do cardápio").lastInsertRowid,
        );
        const addOption = db.prepare(
          "INSERT INTO option_items (group_id,name,price_delta,active) VALUES (?,?,?,1)",
        );
        [
          ["Molho da casa", 200],
          ["Molho cheddar", 500],
          ["Bacon", 600],
          ["Cebola crispy", 400],
          ["Cebola caramelizada", 500],
          ["Geleia de abacaxi", 500],
          ["Dobra de queijo", 1000],
          ["Batata", 400],
          ["Burger", 1000],
        ].forEach(([name, price]) => addOption.run(groupId, name, price));
        group = { id: groupId };
      }
      const link = db.prepare(
        "INSERT OR IGNORE INTO product_option_groups (product_id,group_id) VALUES (?,?)",
      );
      db.prepare("SELECT id FROM products WHERE category_id=?")
        .all(burgerCategory.id)
        .forEach(({ id }) => link.run(id, group.id));
    }
  })();
}
