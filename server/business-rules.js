export const MAX_ITEM_QUANTITY = 20;
export const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

const integer = (value) =>
  typeof value === "number" && Number.isSafeInteger(value) ? value : null;
const enabled = (value) => value === true || value === 1 || value === "1";
const cents = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};
const minutes = (time) => {
  const match = /^(\d{2}):(\d{2})$/.exec(String(time || ""));
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
};
const zonedParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SAO_PAULO_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: weekdays[value.weekday],
    minute: Number(value.hour) * 60 + Number(value.minute),
  };
};

export const parseSchedule = (raw) => {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return null;
    const schedule = {};
    for (let day = 0; day < 7; day += 1) {
      const intervals = parsed[day] ?? parsed[String(day)] ?? [];
      if (!Array.isArray(intervals)) return null;
      schedule[day] = intervals.map((interval) => {
        const open = minutes(interval?.open);
        const close = minutes(interval?.close);
        if (open === null || close === null || open === close)
          throw new Error("invalid interval");
        return { open, close };
      });
    }
    return schedule;
  } catch {
    return null;
  }
};

export const storeStatus = (settings, now = new Date()) => {
  if (settings.open_mode !== "hours") {
    return enabled(settings.manual_open)
      ? { open: true, reason: "manual" }
      : {
          open: false,
          reason: "manual",
          message: "A loja está fechada no momento.",
        };
  }
  const schedule = parseSchedule(settings.schedule_json);
  if (!schedule)
    return {
      open: false,
      reason: "schedule_missing",
      message: "A agenda de funcionamento ainda precisa ser configurada.",
    };
  const current = zonedParts(now);
  const todayOpen = schedule[current.day].some(({ open, close }) =>
    close > open
      ? current.minute >= open && current.minute < close
      : current.minute >= open,
  );
  const previousDay = (current.day + 6) % 7;
  const previousSpill = schedule[previousDay].some(
    ({ open, close }) => close < open && current.minute < close,
  );
  return todayOpen || previousSpill
    ? { open: true, reason: "schedule" }
    : {
        open: false,
        reason: "schedule",
        message: "A loja está fechada conforme a agenda de funcionamento.",
      };
};

export const normalizeWhatsApp = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? digits : "";
};

export const validateImageUrl = (value) => {
  if (!value) return true;
  if (String(value).startsWith("/")) return !String(value).startsWith("//");
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

export const inspectImage = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    return { extension: "jpg", contentType: "image/jpeg" };
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return { extension: "png", contentType: "image/png" };
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return { extension: "webp", contentType: "image/webp" };
  return null;
};

export const validateCart = ({
  cartItems,
  products,
  categories,
  groups,
  optionItems,
  links,
  settings,
  fulfillment,
  now,
}) => {
  const errors = [];
  const changes = [];
  const quoteItems = [];
  const status = storeStatus(settings, now);
  if (!status.open) errors.push(status.message);
  if (!["pickup", "delivery"].includes(fulfillment))
    errors.push("Escolha entrega ou retirada.");
  if (fulfillment === "pickup" && !enabled(settings.pickup_enabled))
    errors.push("A retirada está desabilitada no momento.");
  if (fulfillment === "delivery" && !enabled(settings.delivery_enabled))
    errors.push("A entrega está desabilitada no momento.");
  if (!Array.isArray(cartItems) || !cartItems.length)
    errors.push("O carrinho está vazio.");

  const seenLines = new Set();
  for (const requestItem of Array.isArray(cartItems) ? cartItems : []) {
    const productId = integer(requestItem.productId);
    const quantity = integer(requestItem.qty);
    const normalizedChoiceIds = Array.isArray(requestItem.choiceIds)
      ? requestItem.choiceIds.map(Number).sort((a, b) => a - b)
      : [];
    const lineKey = `${productId}:${JSON.stringify(normalizedChoiceIds)}`;
    if (!productId || seenLines.has(lineKey)) {
      errors.push("O carrinho contém um item duplicado ou inválido.");
      continue;
    }
    seenLines.add(lineKey);
    if (!quantity || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      errors.push(
        `A quantidade de um item deve estar entre 1 e ${MAX_ITEM_QUANTITY}.`,
      );
      continue;
    }
    const product = products.find((row) => Number(row.id) === productId);
    const category =
      product &&
      categories.find((row) => Number(row.id) === Number(product.category_id));
    if (!product || !enabled(product.visible)) {
      errors.push("Um produto do carrinho não existe ou não está visível.");
      continue;
    }
    if (!category || !enabled(category.active)) {
      errors.push(`${product.name} pertence a uma categoria inativa.`);
      continue;
    }
    if (!enabled(product.available)) {
      errors.push(`${product.name} não está disponível.`);
      continue;
    }
    const basePrice =
      product.promo_price === null || product.promo_price === undefined
        ? cents(product.price)
        : cents(product.promo_price);
    if (basePrice === null) {
      errors.push(`${product.name} está com preço inválido.`);
      continue;
    }
    if (
      integer(requestItem.snapshotPrice) !== null &&
      requestItem.snapshotPrice !== basePrice
    )
      changes.push(`O preço de ${product.name} foi atualizado.`);

    const linkedGroupIds = links
      .filter((link) => Number(link.product_id) === productId)
      .map((link) => Number(link.group_id));
    const choiceIds = normalizedChoiceIds;
    if (
      choiceIds.some((id) => integer(id) === null) ||
      new Set(choiceIds).size !== choiceIds.length
    ) {
      errors.push(`${product.name} contém adicionais duplicados ou inválidos.`);
      continue;
    }
    const choices = [];
    for (const groupId of linkedGroupIds) {
      const group = groups.find((row) => Number(row.id) === groupId);
      if (!group || !enabled(group.active)) continue;
      const availableOptions = optionItems.filter(
        (row) => Number(row.group_id) === groupId && enabled(row.active),
      );
      const selected = availableOptions.filter((option) =>
        choiceIds.includes(Number(option.id)),
      );
      const min = Math.max(0, Number(group.min_choices || 0));
      const max = Math.max(1, Number(group.max_choices || 1));
      const requiredMin = enabled(group.required) ? Math.max(1, min) : min;
      if (selected.length < requiredMin || selected.length > max)
        errors.push(
          `${product.name}: escolha entre ${requiredMin} e ${max} opção(ões) em ${group.name}.`,
        );
      if (group.selection_type === "single" && selected.length > 1)
        errors.push(`${product.name}: ${group.name} permite apenas uma opção.`);
      for (const option of selected) {
        const optionPrice = cents(option.price_delta);
        if (optionPrice === null)
          errors.push(`${option.name} está com acréscimo inválido.`);
        else
          choices.push({
            id: Number(option.id),
            name: option.name,
            price: optionPrice,
          });
      }
    }
    const validOptionIds = optionItems
      .filter(
        (row) =>
          linkedGroupIds.includes(Number(row.group_id)) && enabled(row.active),
      )
      .map((row) => Number(row.id));
    if (choiceIds.some((id) => !validOptionIds.includes(id)))
      errors.push(
        `${product.name} contém um adicional removido ou indisponível.`,
      );
    const unitPrice =
      basePrice + choices.reduce((sum, choice) => sum + choice.price, 0);
    quoteItems.push({
      productId,
      name: product.name,
      quantity,
      basePrice,
      choices,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
  }

  const subtotal = quoteItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const minimum = cents(settings.minimum_order);
  if (minimum === null) errors.push("O pedido mínimo configurado é inválido.");
  else if (subtotal < minimum)
    errors.push(
      `O pedido mínimo é de ${(minimum / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
    );
  let deliveryFee = 0;
  let total = subtotal;
  let deliveryFeePending = false;
  if (fulfillment === "delivery") {
    if (settings.delivery_fee_mode === "fixed") {
      deliveryFee = cents(settings.delivery_fee);
      if (deliveryFee === null)
        errors.push("A taxa fixa de entrega está inválida.");
      else total += deliveryFee;
    } else {
      deliveryFee = null;
      total = null;
      deliveryFeePending = true;
    }
  }
  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    changes: [...new Set(changes)],
    store: status,
    quote: {
      items: quoteItems,
      subtotal,
      deliveryFee,
      deliveryFeePending,
      total,
    },
  };
};

export const validateGroupPayload = (body) => {
  const name = String(body.name || "").trim();
  const min = Number(body.min_choices);
  const max = Number(body.max_choices);
  if (!name || name.length > 100)
    return "Informe um nome de até 100 caracteres.";
  if (!["single", "multiple"].includes(body.selection_type))
    return "Tipo de seleção inválido.";
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min < 0 ||
    max < 1 ||
    min > max
  )
    return "Os limites mínimo e máximo são inválidos.";
  if (body.selection_type === "single" && max !== 1)
    return "Grupos de seleção única devem ter máximo 1.";
  for (const item of body.items || []) {
    if (
      !String(item.name || "").trim() ||
      String(item.name).trim().length > 100
    )
      return "Cada opção deve ter um nome de até 100 caracteres.";
    if (cents(item.price_delta) === null)
      return "O acréscimo deve ser um valor inteiro não negativo.";
  }
  return "";
};

export const validateCategoryPayload = (body) => {
  const name = String(body.name || "").trim();
  if (!name || name.length > 100)
    return "Informe um nome de categoria de até 100 caracteres.";
  if (!Number.isSafeInteger(Number(body.sort_order || 0)))
    return "A ordem da categoria deve ser um número inteiro.";
  if (!validateImageUrl(body.image_url || ""))
    return "A URL da imagem é inválida.";
  return "";
};

export const validateProductPayload = (body) => {
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const promo =
    body.promo_price === "" ||
    body.promo_price === null ||
    body.promo_price === undefined
      ? null
      : Number(body.promo_price);
  if (!name || name.length > 150)
    return "Informe um nome de até 150 caracteres.";
  if (
    String(body.description || "").length > 1000 ||
    String(body.ingredients || "").length > 1000
  )
    return "Descrição e ingredientes devem ter até 1000 caracteres.";
  if (!Number.isSafeInteger(price) || price < 0)
    return "O preço deve ser informado em centavos e não pode ser negativo.";
  if (
    promo !== null &&
    (!Number.isSafeInteger(promo) || promo < 0 || promo >= price)
  )
    return "O preço promocional deve ser não negativo e menor que o preço normal.";
  if (
    !Number.isSafeInteger(Number(body.category_id)) ||
    Number(body.category_id) < 1
  )
    return "Selecione uma categoria válida.";
  if (!Number.isSafeInteger(Number(body.sort_order || 0)))
    return "A ordem deve ser um número inteiro.";
  if (!validateImageUrl(body.image_url || ""))
    return "A URL da imagem é inválida.";
  return "";
};
