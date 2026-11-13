import { useEffect, useMemo, useState } from "react";
import {
  Menu,
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Flame,
  ArrowRight,
  Instagram,
  MapPin,
  Clock,
  Check,
  AlertCircle,
} from "./components/Icons";
import { api, useCart } from "./main";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const titleParts = (title) => {
  const words = title.split(" ");
  return (
    <>
      {words.slice(0, 2).join(" ")} <span>{words.slice(2).join(" ")}</span>
    </>
  );
};
function Brand({ logo, name = "Encantos Burger" }) {
  return (
    <a className="brand-image-link" href="/" aria-label={name}>
      <img
        className="brand-logo"
        src={logo || "/assets/logo-encantos.png"}
        alt={name}
      />
    </a>
  );
}
function Header({ settings, catalogPage = false }) {
  const [menu, setMenu] = useState(false);
  const cart = useCart();
  return (
    <header>
      <div className="container nav">
        <Brand logo={settings.logo_url} />
        <nav className={menu ? "open" : ""} aria-label="Principal">
          <a
            className={!catalogPage ? "active" : ""}
            href="/"
            onClick={() => setMenu(false)}
          >
            Início
          </a>
          <a
            className={catalogPage ? "active" : ""}
            href="/cardapio"
            onClick={() => setMenu(false)}
          >
            Cardápio
          </a>
          <a href="/#sobre" onClick={() => setMenu(false)}>
            Sobre
          </a>
        </nav>
        <div className="nav-actions">
          <button
            className="btn order"
            onClick={() =>
              catalogPage
                ? cart.setOpen(true)
                : (window.location.href = "/cardapio")
            }
          >
            <ShoppingBag /> Fazer pedido
          </button>
          <button
            className="icon-btn cart-button"
            onClick={() => cart.setOpen(true)}
            aria-label={`Carrinho com ${cart.count} itens`}
          >
            <ShoppingBag />
            <b>{cart.count}</b>
          </button>
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Abrir menu"
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
function Hero({ settings }) {
  return (
    <section id="inicio" className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1>
            {titleParts(settings.hero_title || "SEU PRÓXIMO BURGER FAVORITO.")}
          </h1>
          <div className="hero-bursts" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <p>{settings.hero_subtitle}</p>
          <a href="/cardapio" className="btn big">
            <ShoppingBag /> {settings.hero_button || "Ver cardápio"}{" "}
            <ArrowRight />
          </a>
        </div>
        <div className="hero-visual" aria-label="Hambúrguer em destaque">
          <div className="orange-orbit" />
          <Flame className="spark one" />
          <Flame className="spark two" />
          <img
            src={settings.hero_image || "/assets/hero-burger.png"}
            alt="Hambúrguer artesanal em destaque"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
function ProductModal({ product, onClose }) {
  const cart = useCart();
  const [selected, setSelected] = useState({});
  const groups = product.option_groups || [];
  const toggle = (g, item) =>
    setSelected((old) => {
      const list = old[g.id] || [];
      return {
        ...old,
        [g.id]:
          g.selection_type === "single"
            ? [item]
            : list.some((x) => x.id === item.id)
              ? list.filter((x) => x.id !== item.id)
              : list.length < g.max_choices
                ? [...list, item]
                : list,
      };
    });
  const valid = groups.every(
    (g) => !g.required || (selected[g.id] || []).length >= g.min_choices,
  );
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <button className="modal-close icon-btn" onClick={onClose}>
          <X />
        </button>
        <h2>Personalize seu {product.name}</h2>
        {groups.map((g) => (
          <fieldset key={g.id}>
            <legend>
              {g.name} {g.required && <small>Obrigatório</small>}
            </legend>
            <p>
              Escolha {g.min_choices || 0} a {g.max_choices}
            </p>
            {g.items.map((i) => (
              <label className="choice" key={i.id}>
                <input
                  type={g.selection_type === "single" ? "radio" : "checkbox"}
                  name={`group-${g.id}`}
                  checked={(selected[g.id] || []).some((x) => x.id === i.id)}
                  onChange={() => toggle(g, i)}
                />
                <span>{i.name}</span>
                <b>
                  {i.price_delta
                    ? `+ ${money.format(i.price_delta / 100)}`
                    : "Incluso"}
                </b>
              </label>
            ))}
          </fieldset>
        ))}
        <button
          className="btn full"
          disabled={!valid}
          onClick={() => {
            cart.add(product, Object.values(selected).flat());
            onClose();
          }}
        >
          <Plus /> Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}
function MenuSection({ catalog, featuredOnly = false }) {
  const [category, setCategory] = useState("all");
  const [custom, setCustom] = useState(null);
  const cart = useCart();
  const products = useMemo(
    () =>
      catalog.products.filter((p) =>
        featuredOnly
          ? Boolean(p.featured)
          : category === "all" || p.category_id === category,
      ),
    [catalog.products, category, featuredOnly],
  );
  const add = (p) => (p.option_groups?.length ? setCustom(p) : cart.add(p));
  return (
    <section id="cardapio" className="menu-section">
      <div className="container">
        <div className="section-title">
          <i className="title-line" aria-hidden="true" />
          <span>
            <Flame />
          </span>
          <div>
            <p>{featuredOnly ? "MAIS PEDIDOS" : "ESCOLHA O SEU"}</p>
            <h2>
              {featuredOnly ? "Os favoritos da casa" : "Cardápio completo"}
            </h2>
          </div>
          <i className="title-line" aria-hidden="true" />
        </div>
        {!featuredOnly && (
          <div className="filters" role="group" aria-label="Categorias">
            <button
              className={category === "all" ? "active" : ""}
              onClick={() => setCategory("all")}
            >
              Todos
            </button>
            {catalog.categories.map((c) => (
              <button
                key={c.id}
                className={category === c.id ? "active" : ""}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        <div className="product-grid">
          {products.map((p) => (
            <article
              className={`product-card ${!p.available ? "unavailable" : ""} ${!p.image_url ? "no-image" : ""}`}
              key={p.id}
            >
              {p.image_url && (
                <div className="product-image">
                  <img src={p.image_url} alt="" loading="lazy" />
                  {p.demo ? (
                    <span className="demo-tag">Item demonstrativo</span>
                  ) : null}
                  {!p.available ? (
                    <span className="soldout">Indisponível</span>
                  ) : null}
                </div>
              )}
              <div className="product-body">
                <p className="category-label">{p.category_name}</p>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <small>{p.ingredients}</small>
                <div className="product-footer">
                  <div>
                    {p.promo_price && <s>{money.format(p.price / 100)}</s>}
                    <strong>
                      {money.format((p.promo_price || p.price) / 100)}
                    </strong>
                  </div>
                  <button
                    className="btn small"
                    disabled={!p.available}
                    onClick={() => add(p)}
                  >
                    <Plus /> Adicionar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!products.length && (
          <div className="empty">
            <ShoppingBag />
            <h3>Nenhum produto nesta categoria</h3>
          </div>
        )}
        {featuredOnly && (
          <div className="menu-more">
            <a className="btn" href="/cardapio">
              Ver cardápio completo <ArrowRight />
            </a>
          </div>
        )}
      </div>
      {custom && (
        <ProductModal product={custom} onClose={() => setCustom(null)} />
      )}
    </section>
  );
}
function Cart({ catalog }) {
  const cart = useCart();
  const [form, setForm] = useState({
    name: "",
    type: "pickup",
    address: "",
    notes: "",
  });
  const [message, setMessage] = useState("");
  const settings = catalog.settings;
  const checkout = async () => {
    setMessage("");
    if (!form.name.trim()) return setMessage("Informe seu nome.");
    if (form.type === "delivery" && !form.address.trim())
      return setMessage("Informe o endereço de entrega.");
    const validation = await api("/api/cart/validate", {
      method: "POST",
      body: JSON.stringify({ items: cart.items }),
    });
    const changes = [];
    for (const item of cart.items) {
      const live = validation.products.find((p) => p.id === item.productId);
      if (!live || !live.visible || !live.available)
        changes.push(`${item.name} não está mais disponível`);
      else if ((live.promo_price || live.price) !== item.basePrice)
        changes.push(`O preço de ${item.name} foi atualizado`);
    }
    if (changes.length)
      return setMessage(
        `${changes.join(". ")}. Remova o item e adicione-o novamente.`,
      );
    if (!settings.whatsapp)
      return setMessage(
        "O canal de pedidos pelo WhatsApp está aguardando configuração.",
      );
    const lines = [
      settings.order_intro || "Olá! Gostaria de fazer um pedido:",
      "",
      ...cart.items.map(
        (i) =>
          `${i.qty}x ${i.name}${i.choices.length ? ` (${i.choices.map((c) => c.name).join(", ")})` : ""} — ${money.format(((i.basePrice + i.choices.reduce((s, c) => s + c.price_delta, 0)) * i.qty) / 100)}`,
      ),
      "",
      `Subtotal: ${money.format(cart.total / 100)}`,
    ];
    if (form.type === "delivery")
      lines.push(
        settings.delivery_fee_mode === "fixed" && settings.delivery_fee
          ? `Taxa de entrega: ${money.format(Number(settings.delivery_fee) / 100)}`
          : "Taxa de entrega: a confirmar",
      );
    lines.push(
      `Nome: ${form.name}`,
      `Modalidade: ${form.type === "delivery" ? "Entrega" : "Retirada"}`,
    );
    if (form.address) lines.push(`Endereço: ${form.address}`);
    if (form.notes) lines.push(`Observações: ${form.notes}`);
    window.open(
      `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  return (
    <div
      className={`cart-drawer ${cart.open ? "open" : ""}`}
      aria-hidden={!cart.open}
    >
      <button
        className="cart-overlay"
        onClick={() => cart.setOpen(false)}
        aria-label="Fechar carrinho"
      />
      <aside>
        <div className="drawer-head">
          <div>
            <small>SEU PEDIDO</small>
            <h2>Carrinho</h2>
          </div>
          <button className="icon-btn" onClick={() => cart.setOpen(false)}>
            <X />
          </button>
        </div>
        {!cart.items.length ? (
          <div className="empty">
            <ShoppingBag />
            <h3>Seu carrinho está vazio</h3>
            <p>Escolha um dos nossos burgers para começar.</p>
            <button
              className="btn"
              onClick={() => {
                cart.setOpen(false);
                window.location.href = "/cardapio";
              }}
            >
              Ver cardápio
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.items.map((i, index) => (
                <div
                  className="cart-item"
                  key={`${i.productId}-${i.signature}`}
                >
                  {i.image && <img src={i.image} alt="" />}
                  <div>
                    <h3>{i.name}</h3>
                    {i.choices.map((c) => (
                      <small key={c.id}>{c.name}</small>
                    ))}
                    <strong>
                      {money.format(
                        (i.basePrice +
                          i.choices.reduce((s, c) => s + c.price_delta, 0)) /
                          100,
                      )}
                    </strong>
                    <div className="quantity">
                      <button onClick={() => cart.update(index, i.qty - 1)}>
                        <Minus />
                      </button>
                      <span>{i.qty}</span>
                      <button onClick={() => cart.update(index, i.qty + 1)}>
                        <Plus />
                      </button>
                      <button
                        className="remove"
                        onClick={() => cart.update(index, 0)}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="checkout">
              <div className="total">
                <span>Subtotal</span>
                <strong>{money.format(cart.total / 100)}</strong>
              </div>
              <label>
                Seu nome
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <div className="radio-row">
                <label>
                  <input
                    type="radio"
                    checked={form.type === "pickup"}
                    onChange={() => setForm({ ...form, type: "pickup" })}
                  />{" "}
                  Retirada
                </label>
                <label>
                  <input
                    type="radio"
                    checked={form.type === "delivery"}
                    onChange={() => setForm({ ...form, type: "delivery" })}
                  />{" "}
                  Entrega
                </label>
              </div>
              {form.type === "delivery" && (
                <label>
                  Endereço
                  <textarea
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </label>
              )}
              <label>
                Observações (opcional)
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
              {message && (
                <p className="form-message">
                  <AlertCircle />
                  {message}
                </p>
              )}
              <button className="btn full" onClick={checkout}>
                <Check /> Montar pedido no WhatsApp
              </button>
              <small className="checkout-note">
                O pedido só será enviado após sua confirmação no WhatsApp.
              </small>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
function About({ settings }) {
  return (
    <section id="sobre" className="about">
      <div className="container about-grid">
        <div className="about-photo-wrap">
          <div className="about-photo-accent" aria-hidden="true" />
          <img
            className="about-photo"
            src="/assets/sobre-encantos.png"
            alt="Responsáveis pela Encantos Burger segurando um certificado de qualidade"
            loading="lazy"
          />
        </div>
        <div className="about-content">
          <p className="eyebrow">
            <Flame /> CONHEÇA A ENCANTOS
          </p>
          <h2>
            Sobre <span>nós.</span>
          </h2>
          <p>{settings.about}</p>
          <div className="about-points">
            <span>
              <Check /> Hambúrgueres artesanais
            </span>
            <span>
              <Check /> Chopp gelado e variedade
            </span>
          </div>
        </div>
      </div>
      <Flame className="about-flame" aria-hidden="true" />
    </section>
  );
}
function Footer({ settings }) {
  return (
    <footer>
      <div className="container footer-grid">
        <Brand logo={settings.logo_url} name={settings.business_name} />
        <div>
          <h3>Navegação</h3>
          <a href="/">Início</a>
          <a href="/cardapio">Cardápio</a>
          <a href="/#sobre">Sobre</a>
        </div>
        <div>
          <h3>Contato</h3>
          {settings.instagram ? (
            <a
              href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
              target="_blank"
            >
              <Instagram /> {settings.instagram}
            </a>
          ) : (
            <span>
              <Instagram /> Instagram a configurar
            </span>
          )}
          {settings.address ? (
            <span>
              <MapPin />
              {settings.address}
            </span>
          ) : (
            <span>
              <MapPin /> Endereço a configurar
            </span>
          )}
          {settings.hours ? (
            <span>
              <Clock />
              {settings.hours}
            </span>
          ) : (
            <span>
              <Clock /> Horários a configurar
            </span>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          © {new Date().getFullYear()} {settings.business_name}.{" "}
          <span>Dados de contato ainda podem depender de configuração.</span>
        </div>
      </div>
    </footer>
  );
}
export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/api/catalog")
      .then(setCatalog)
      .catch((e) => setError(e.message));
  }, []);
  if (error)
    return (
      <main className="load-state">
        <AlertCircle />
        <h1>Não foi possível carregar o cardápio</h1>
        <p>{error}</p>
      </main>
    );
  if (!catalog)
    return (
      <main className="load-state">
        <div className="loader" />
        <p>Preparando o cardápio...</p>
      </main>
    );
  const catalogPage = window.location.pathname === "/cardapio";
  return (
    <>
      <Header settings={catalog.settings} catalogPage={catalogPage} />
      {catalog.settings.notice && (
        <div className="notice">{catalog.settings.notice}</div>
      )}
      <main>
        {catalogPage ? (
          <MenuSection catalog={catalog} />
        ) : (
          <>
            <Hero settings={catalog.settings} />
            <MenuSection catalog={catalog} featuredOnly />
            <About settings={catalog.settings} />
          </>
        )}
      </main>
      <Footer settings={catalog.settings} />
      <Cart catalog={catalog} />
    </>
  );
}
