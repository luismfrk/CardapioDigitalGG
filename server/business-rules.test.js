import assert from "node:assert/strict";
import test from "node:test";
import { inspectImage, storeStatus, validateCart } from "./business-rules.js";

const base = {
  products: [
    {
      id: 1,
      name: "Burger",
      price: 2000,
      promo_price: null,
      category_id: 1,
      visible: 1,
      available: 1,
    },
  ],
  categories: [{ id: 1, active: 1 }],
  groups: [],
  optionItems: [],
  links: [],
  settings: {
    open_mode: "manual",
    manual_open: "1",
    pickup_enabled: "1",
    delivery_enabled: "1",
    minimum_order: "0",
    delivery_fee_mode: "fixed",
    delivery_fee: "500",
  },
};

test("agenda considera intervalo que atravessa a meia-noite em São Paulo", () => {
  const settings = {
    open_mode: "hours",
    schedule_json: JSON.stringify({ 5: [{ open: "17:00", close: "01:00" }] }),
  };
  assert.equal(
    storeStatus(settings, new Date("2026-11-14T03:30:00Z")).open,
    true,
  );
  assert.equal(
    storeStatus(settings, new Date("2026-11-14T05:00:00Z")).open,
    false,
  );
});

test("cotação usa preço do servidor e soma taxa de entrega", () => {
  const result = validateCart({
    ...base,
    fulfillment: "delivery",
    cartItems: [{ productId: 1, qty: 2, choiceIds: [], snapshotPrice: 1900 }],
  });
  assert.equal(result.ok, true);
  assert.equal(result.quote.subtotal, 4000);
  assert.equal(result.quote.total, 4500);
  assert.equal(result.changes.length, 1);
});

test("bloqueia produto indisponível, mínimo e adicional obrigatório", () => {
  const result = validateCart({
    ...base,
    products: [{ ...base.products[0], available: 0 }],
    settings: { ...base.settings, minimum_order: "5000" },
    groups: [
      {
        id: 3,
        name: "Ponto",
        active: 1,
        required: 1,
        min_choices: 1,
        max_choices: 1,
        selection_type: "single",
      },
    ],
    optionItems: [
      { id: 7, group_id: 3, name: "Ao ponto", price_delta: 0, active: 1 },
    ],
    links: [{ product_id: 1, group_id: 3 }],
    fulfillment: "pickup",
    cartItems: [{ productId: 1, qty: 1, choiceIds: [] }],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /não está disponível/);
  assert.match(result.errors.join(" "), /pedido mínimo/i);
});

test("rejeita arquivo que apenas finge ser imagem", () => {
  assert.equal(inspectImage(Buffer.from("not-an-image")), null);
  assert.equal(
    inspectImage(Buffer.from([0xff, 0xd8, 0xff, ...Array(12).fill(0)]))
      ?.contentType,
    "image/jpeg",
  );
});
