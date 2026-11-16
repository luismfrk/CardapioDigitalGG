import { useEffect, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { api, useCart } from "../main";
import {
  LayoutDashboard,
  Package,
  Tags,
  SlidersHorizontal,
  Palette,
  Settings,
  LogOut,
  ExternalLink,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Upload,
  AlertCircle,
  Check,
  Menu,
  X,
  ChevronRight,
  Eye,
} from "../components/Icons";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const nav = [
  ["", LayoutDashboard, "Visão geral"],
  ["produtos", Package, "Produtos"],
  ["categorias", Tags, "Categorias"],
  ["adicionais", SlidersHorizontal, "Adicionais"],
  ["aparencia", Palette, "Aparência"],
  ["configuracoes", Settings, "Configurações"],
];
function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="admin-login">
      <form onSubmit={submit}>
        <div className="admin-login-logo">
          <img src="/assets/logo-encantos.png" alt="Encantos Burger" />
          <span>PAINEL ADMINISTRATIVO</span>
        </div>
        <h1>Bem-vindo de volta</h1>
        <p>Acesse para gerenciar o cardápio.</p>
        {error && (
          <div className="admin-alert error">
            <AlertCircle />
            {error}
          </div>
        )}
        <label>
          E-mail
          <input
            type="email"
            required
            autoComplete="username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <button className="btn full" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
        <small>
          Não há cadastro público. O primeiro acesso é criado pelo terminal.
        </small>
      </form>
    </main>
  );
}
function Shell({ reload, data, user, onLogout }) {
  const [mobile, setMobile] = useState(false);
  return (
    <div className="admin-shell">
      <aside className={mobile ? "open" : ""}>
        <div className="admin-brand">
          <img src="/assets/logo-encantos.png" alt="" />
          <div>
            <strong>ENCANTOS</strong>
            <small>PAINEL</small>
          </div>
          <button onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <nav>
          {nav.map(([path, Icon, label]) => (
            <NavLink
              key={label}
              end={!path}
              to={`/admin/${path}`}
              onClick={() => setMobile(false)}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-bottom">
          <a href="/" target="_blank">
            <ExternalLink />
            Visualizar site
          </a>
          <button onClick={onLogout}>
            <LogOut />
            Sair
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header>
          <button className="admin-mobile" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div>
            <small>ADMINISTRADOR</small>
            <strong>{user.email}</strong>
          </div>
        </header>
        <Routes>
          <Route index element={<Dashboard data={data} />} />
          <Route
            path="produtos"
            element={<Products data={data} reload={reload} />}
          />
          <Route
            path="categorias"
            element={<Categories data={data} reload={reload} />}
          />
          <Route
            path="adicionais"
            element={<Groups data={data} reload={reload} />}
          />
          <Route
            path="aparencia"
            element={<SettingsPage data={data} reload={reload} appearance />}
          />
          <Route
            path="configuracoes"
            element={<SettingsPage data={data} reload={reload} />}
          />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </main>
    </div>
  );
}
const PageHead = ({ eyebrow, title, children }) => (
  <div className="admin-page-head">
    <div>
      <p>{eyebrow}</p>
      <h1>{title}</h1>
    </div>
    {children}
  </div>
);
function Dashboard({ data }) {
  const d = data.dashboard;
  const categories = data.categories
    .filter((category) => category.active)
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, 7);
  const maxProducts = Math.max(...categories.map((c) => c.product_count), 1);
  const setupItems = [
    ["WhatsApp", data.settings.whatsapp],
    ["Instagram", data.settings.instagram],
    ["Endereço", data.settings.address],
    ["Horários", data.settings.hours],
  ];
  const configured = setupItems.filter(([, value]) => value).length;
  const recentProducts = data.products.slice(0, 6);
  return (
    <section className="admin-page">
      <PageHead eyebrow="VISÃO GERAL" title="Olá, Encantos!">
        <a className="admin-outline-button" href="/" target="_blank">
          <Eye /> Visualizar site
        </a>
      </PageHead>

      <div className="dashboard-actions">
        <NavLink className="dashboard-action primary" to="/admin/produtos">
          <span>
            <Plus />
          </span>
          <div>
            <strong>Novo produto</strong>
            <small>Adicione um item ao cardápio</small>
          </div>
          <ChevronRight />
        </NavLink>
        <NavLink className="dashboard-action" to="/admin/categorias">
          <span>
            <Tags />
          </span>
          <div>
            <strong>Nova categoria</strong>
            <small>Organize os filtros do catálogo</small>
          </div>
          <ChevronRight />
        </NavLink>
        <NavLink className="dashboard-action" to="/admin/configuracoes">
          <span>
            <Settings />
          </span>
          <div>
            <strong>Configurar loja</strong>
            <small>Contatos, entrega e horários</small>
          </div>
          <ChevronRight />
        </NavLink>
      </div>

      <div className="stat-grid">
        {[
          ["Total de produtos", d.products, Package, "Itens cadastrados"],
          [
            "Disponíveis",
            d.available,
            Check,
            `${d.unavailable} indisponível(is)`,
          ],
          ["Categorias ativas", d.categories, Tags, "Filtros no catálogo"],
          ["Em destaque", d.featured, Palette, "Exibidos na página inicial"],
        ].map(([l, v, I, hint]) => (
          <article key={l}>
            <div className="stat-icon">
              <I />
            </div>
            <div>
              <p>{l}</p>
              <strong>{v}</strong>
              <small>{hint}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="admin-card dashboard-categories">
          <div className="card-heading">
            <div>
              <p>CATÁLOGO</p>
              <h2>Produtos por categoria</h2>
            </div>
            <NavLink to="/admin/categorias">
              Ver todas <ChevronRight />
            </NavLink>
          </div>
          <div className="category-summary">
            {categories.map((category) => (
              <div className="category-summary-row" key={category.id}>
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.product_count} produto(s)</span>
                </div>
                <div className="category-bar">
                  <i
                    style={{
                      width: `${(category.product_count / maxProducts) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card dashboard-setup">
          <div className="card-heading">
            <div>
              <p>CONFIGURAÇÃO</p>
              <h2>Informações da loja</h2>
            </div>
          </div>
          <div className="setup-score">
            <strong>
              {configured}/{setupItems.length}
            </strong>
            <span>informações preenchidas</span>
          </div>
          <div className="setup-list">
            {setupItems.map(([label, value]) => (
              <div key={label} className={value ? "done" : "pending"}>
                {value ? <Check /> : <AlertCircle />}
                <span>{label}</span>
                <small>{value ? "Configurado" : "Pendente"}</small>
              </div>
            ))}
          </div>
          <NavLink className="setup-link" to="/admin/configuracoes">
            Revisar configurações <ChevronRight />
          </NavLink>
        </div>
      </div>

      <div className="admin-card dashboard-products">
        <div className="card-heading">
          <div>
            <p>ACESSO RÁPIDO</p>
            <h2>Produtos do catálogo</h2>
          </div>
          <NavLink to="/admin/produtos">
            Gerenciar produtos <ChevronRight />
          </NavLink>
        </div>
        <div className="dashboard-product-list">
          {recentProducts.map((product) => (
            <NavLink to="/admin/produtos" key={product.id}>
              <div className="dashboard-product-thumb">
                {product.image_url ? (
                  <img src={product.image_url} alt="" />
                ) : (
                  <Package />
                )}
              </div>
              <div>
                <strong>{product.name}</strong>
                <span>{product.category_name}</span>
              </div>
              <small
                className={product.available ? "available" : "unavailable"}
              >
                {product.available ? "Disponível" : "Indisponível"}
              </small>
              <b>
                {money.format((product.promo_price || product.price) / 100)}
              </b>
              <ChevronRight />
            </NavLink>
          ))}
        </div>
      </div>
    </section>
  );
}
const emptyProduct = {
  name: "",
  description: "",
  ingredients: "",
  price: "",
  promo_price: "",
  category_id: "",
  image_url: "",
  featured: false,
  available: true,
  visible: true,
  sort_order: 0,
};
function UploadField({ value, onChange }) {
  const upload = async (file) => {
    const body = new FormData();
    body.append("image", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error);
    onChange(d.url);
  };
  return (
    <div className="upload-field">
      {value && <img src={value} alt="Prévia" />}
      <label>
        <Upload /> Enviar imagem
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) =>
            e.target.files[0] &&
            upload(e.target.files[0]).catch((err) => alert(err.message))
          }
        />
      </label>
      <input
        placeholder="ou URL da imagem"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function Products({ data, reload }) {
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const save = async (e) => {
    e.preventDefault();
    await api(`/api/admin/products${edit.id ? `/${edit.id}` : ""}`, {
      method: edit.id ? "PUT" : "POST",
      body: JSON.stringify({
        ...edit,
        price: Math.round(Number(edit.price) * 100),
        promo_price: edit.promo_price
          ? Math.round(Number(edit.promo_price) * 100)
          : null,
      }),
    });
    setEdit(null);
    reload();
  };
  const list = data.products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || String(p.category_id) === filter),
  );
  return (
    <section className="admin-page">
      <PageHead eyebrow="CATÁLOGO" title="Produtos">
        <button className="btn" onClick={() => setEdit(emptyProduct)}>
          <Plus />
          Novo produto
        </button>
      </PageHead>
      <div className="admin-toolbar">
        <input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todas as categorias</option>
          {data.categories.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="admin-list">
        {list.map((p) => (
          <article key={p.id}>
            <img src={p.image_url || "/assets/hero-burger.png"} alt="" />
            <div className="grow">
              <h3>
                {p.name} {p.demo && <small>DEMO</small>}
              </h3>
              <p>
                {p.category_name} ·{" "}
                {p.visible
                  ? p.available
                    ? "Disponível"
                    : "Indisponível"
                  : "Oculto"}
              </p>
              <strong>{money.format((p.promo_price || p.price) / 100)}</strong>
            </div>
            <div className="row-actions">
              <button
                onClick={() =>
                  setEdit({
                    ...p,
                    price: p.price / 100,
                    promo_price: p.promo_price ? p.promo_price / 100 : "",
                  })
                }
              >
                <Pencil />
              </button>
              <button
                onClick={() =>
                  api(`/api/admin/products/${p.id}/duplicate`, {
                    method: "POST",
                  }).then(reload)
                }
              >
                <Copy />
              </button>
              <button
                onClick={() =>
                  confirm(`Excluir ${p.name}?`) &&
                  api(`/api/admin/products/${p.id}`, { method: "DELETE" }).then(
                    reload,
                  )
                }
              >
                <Trash2 />
              </button>
            </div>
          </article>
        ))}
      </div>
      {edit && (
        <div className="modal-backdrop">
          <form className="modal admin-form" onSubmit={save}>
            <button
              type="button"
              className="modal-close icon-btn"
              onClick={() => setEdit(null)}
            >
              <X />
            </button>
            <h2>{edit.id ? "Editar" : "Novo"} produto</h2>
            <div className="form-grid">
              <label>
                Nome
                <input
                  required
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </label>
              <label>
                Categoria
                <select
                  required
                  value={edit.category_id}
                  onChange={(e) =>
                    setEdit({ ...edit, category_id: e.target.value })
                  }
                >
                  <option value="">Selecione</option>
                  {data.categories.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Preço (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={edit.price}
                  onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                />
              </label>
              <label>
                Promocional (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={edit.promo_price || ""}
                  onChange={(e) =>
                    setEdit({ ...edit, promo_price: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Descrição
                <textarea
                  value={edit.description}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Ingredientes
                <textarea
                  value={edit.ingredients}
                  onChange={(e) =>
                    setEdit({ ...edit, ingredients: e.target.value })
                  }
                />
              </label>
              <div className="wide">
                <UploadField
                  value={edit.image_url}
                  onChange={(image_url) => setEdit({ ...edit, image_url })}
                />
              </div>
              <label>
                Ordem
                <input
                  type="number"
                  value={edit.sort_order}
                  onChange={(e) =>
                    setEdit({ ...edit, sort_order: e.target.value })
                  }
                />
              </label>
              <div className="checks">
                <label>
                  <input
                    type="checkbox"
                    checked={!!edit.featured}
                    onChange={(e) =>
                      setEdit({ ...edit, featured: e.target.checked })
                    }
                  />
                  Destaque
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={!!edit.available}
                    onChange={(e) =>
                      setEdit({ ...edit, available: e.target.checked })
                    }
                  />
                  Disponível
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={!!edit.visible}
                    onChange={(e) =>
                      setEdit({ ...edit, visible: e.target.checked })
                    }
                  />
                  Visível
                </label>
              </div>
            </div>
            <button className="btn full">Salvar produto</button>
          </form>
        </div>
      )}
    </section>
  );
}
function Categories({ data, reload }) {
  const [edit, setEdit] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    await api(`/api/admin/categories${edit.id ? `/${edit.id}` : ""}`, {
      method: edit.id ? "PUT" : "POST",
      body: JSON.stringify(edit),
    });
    setEdit(null);
    reload();
  };
  return (
    <section className="admin-page">
      <PageHead eyebrow="ORGANIZAÇÃO" title="Categorias">
        <button
          className="btn"
          onClick={() =>
            setEdit({
              name: "",
              image_url: "",
              sort_order: data.categories.length,
              active: true,
            })
          }
        >
          <Plus />
          Nova categoria
        </button>
      </PageHead>
      <div className="admin-list">
        {data.categories.map((c) => (
          <article key={c.id}>
            <div className="category-icon">
              <Tags />
            </div>
            <div className="grow">
              <h3>{c.name}</h3>
              <p>
                {c.product_count} produto(s) · {c.active ? "Ativa" : "Inativa"}{" "}
                · Ordem {c.sort_order}
              </p>
            </div>
            <div className="row-actions">
              <button onClick={() => setEdit(c)}>
                <Pencil />
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Excluir ${c.name}?`))
                    try {
                      await api(`/api/admin/categories/${c.id}`, {
                        method: "DELETE",
                      });
                      reload();
                    } catch (e) {
                      alert(e.message);
                    }
                }}
              >
                <Trash2 />
              </button>
            </div>
          </article>
        ))}
      </div>
      {edit && (
        <div className="modal-backdrop">
          <form className="modal admin-form" onSubmit={save}>
            <button
              type="button"
              className="modal-close icon-btn"
              onClick={() => setEdit(null)}
            >
              <X />
            </button>
            <h2>{edit.id ? "Editar" : "Nova"} categoria</h2>
            <label>
              Nome
              <input
                required
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </label>
            <label>
              Ordem
              <input
                type="number"
                value={edit.sort_order}
                onChange={(e) =>
                  setEdit({ ...edit, sort_order: e.target.value })
                }
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={!!edit.active}
                onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
              />
              Categoria ativa
            </label>
            <button className="btn full">Salvar categoria</button>
          </form>
        </div>
      )}
    </section>
  );
}
function Groups({ data, reload }) {
  const blank = {
    name: "",
    selection_type: "single",
    required: false,
    min_choices: 0,
    max_choices: 1,
    active: true,
    items: [{ name: "", price_delta: 0, active: true }],
    product_ids: [],
  };
  const [edit, setEdit] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    await api(`/api/admin/groups${edit.id ? `/${edit.id}` : ""}`, {
      method: edit.id ? "PUT" : "POST",
      body: JSON.stringify({
        ...edit,
        items: edit.items.map((i) => ({
          ...i,
          price_delta: Math.round(Number(i.price_delta || 0) * 100),
        })),
      }),
    });
    setEdit(null);
    reload();
  };
  return (
    <section className="admin-page">
      <PageHead eyebrow="PERSONALIZAÇÃO" title="Adicionais">
        <button className="btn" onClick={() => setEdit(blank)}>
          <Plus />
          Novo grupo
        </button>
      </PageHead>
      <div className="admin-list">
        {data.groups.map((g) => (
          <article key={g.id}>
            <div className="category-icon">
              <SlidersHorizontal />
            </div>
            <div className="grow">
              <h3>{g.name}</h3>
              <p>
                {g.items.length} opções ·{" "}
                {g.selection_type === "single"
                  ? "Escolha única"
                  : "Múltipla escolha"}{" "}
                · {g.active ? "Ativo" : "Inativo"}
              </p>
            </div>
            <div className="row-actions">
              <button
                onClick={() =>
                  setEdit({
                    ...g,
                    items: g.items.map((i) => ({
                      ...i,
                      price_delta: i.price_delta / 100,
                    })),
                  })
                }
              >
                <Pencil />
              </button>
              <button
                onClick={() =>
                  confirm(`Excluir ${g.name}?`) &&
                  api(`/api/admin/groups/${g.id}`, { method: "DELETE" }).then(
                    reload,
                  )
                }
              >
                <Trash2 />
              </button>
            </div>
          </article>
        ))}
      </div>
      {edit && (
        <div className="modal-backdrop">
          <form className="modal admin-form" onSubmit={save}>
            <button
              type="button"
              className="modal-close icon-btn"
              onClick={() => setEdit(null)}
            >
              <X />
            </button>
            <h2>Grupo de opções</h2>
            <label>
              Nome
              <input
                required
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </label>
            <label>
              Tipo
              <select
                value={edit.selection_type}
                onChange={(e) =>
                  setEdit({ ...edit, selection_type: e.target.value })
                }
              >
                <option value="single">Seleção única</option>
                <option value="multiple">Seleção múltipla</option>
              </select>
            </label>
            <div className="form-grid">
              <label>
                Mínimo
                <input
                  type="number"
                  min="0"
                  value={edit.min_choices}
                  onChange={(e) =>
                    setEdit({ ...edit, min_choices: e.target.value })
                  }
                />
              </label>
              <label>
                Máximo
                <input
                  type="number"
                  min="1"
                  value={edit.max_choices}
                  onChange={(e) =>
                    setEdit({ ...edit, max_choices: e.target.value })
                  }
                />
              </label>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={!!edit.required}
                onChange={(e) =>
                  setEdit({ ...edit, required: e.target.checked })
                }
              />
              Obrigatório
            </label>
            <h3>Opções</h3>
            {edit.items.map((i, n) => (
              <div className="option-edit" key={n}>
                <input
                  placeholder="Nome"
                  required
                  value={i.name}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      items: edit.items.map((x, k) =>
                        k === n ? { ...x, name: e.target.value } : x,
                      ),
                    })
                  }
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Acréscimo R$"
                  value={i.price_delta}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      items: edit.items.map((x, k) =>
                        k === n ? { ...x, price_delta: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setEdit({
                      ...edit,
                      items: edit.items.filter((_, k) => k !== n),
                    })
                  }
                >
                  <Trash2 />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setEdit({
                  ...edit,
                  items: [
                    ...edit.items,
                    { name: "", price_delta: 0, active: true },
                  ],
                })
              }
            >
              <Plus />
              Adicionar opção
            </button>
            <h3>Vincular a produtos</h3>
            <div className="product-checks">
              {data.products.map((p) => (
                <label key={p.id}>
                  <input
                    type="checkbox"
                    checked={edit.product_ids.includes(p.id)}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        product_ids: e.target.checked
                          ? [...edit.product_ids, p.id]
                          : edit.product_ids.filter((id) => id !== p.id),
                      })
                    }
                  />
                  {p.name}
                </label>
              ))}
            </div>
            <button className="btn full">Salvar grupo</button>
          </form>
        </div>
      )}
    </section>
  );
}
function SettingsPage({ data, reload, appearance = false }) {
  const keys = appearance
    ? [
        "hero_title",
        "hero_subtitle",
        "hero_button",
        "hero_image",
        "about",
        "notice",
      ]
    : [
        "business_name",
        "logo_url",
        "whatsapp",
        "instagram",
        "address",
        "hours",
        "delivery_enabled",
        "pickup_enabled",
        "delivery_fee_mode",
        "delivery_fee",
        "minimum_order",
        "order_intro",
        "open_mode",
        "manual_open",
        "schedule_json",
      ];
  const [form, setForm] = useState(
    Object.fromEntries(keys.map((k) => [k, data.settings[k] || ""])),
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setForm(
      Object.fromEntries(keys.map((key) => [key, data.settings[key] || ""])),
    );
    setSaved(false);
    setError("");
  }, [appearance, data.settings]);
  const labels = {
    business_name: "Nome",
    logo_url: "Logo",
    whatsapp: "WhatsApp com DDI e DDD",
    instagram: "Instagram",
    address: "Endereço",
    hours: "Horários",
    delivery_fee: "Taxa fixa em centavos",
    minimum_order: "Pedido mínimo em centavos",
    order_intro: "Mensagem inicial",
    hero_title: "Título principal",
    hero_subtitle: "Subtítulo",
    hero_button: "Texto do botão",
    hero_image: "Imagem principal",
    about: "Texto Sobre",
    notice: "Aviso temporário",
    schedule_json: "Agenda semanal (JSON; dias 0=domingo a 6=sábado)",
  };
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          section: appearance ? "appearance" : "business",
          values: form,
        }),
      });
      setSaved(true);
      await reload();
      setTimeout(() => setSaved(false), 2500);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="admin-page">
      <PageHead
        eyebrow={appearance ? "IDENTIDADE" : "NEGÓCIO"}
        title={appearance ? "Aparência" : "Configurações"}
      />
      <form className="admin-card settings-form" onSubmit={save}>
        {saved && (
          <div className="admin-alert success">
            <Check />
            Alterações salvas e publicadas no catálogo.
          </div>
        )}
        {error && (
          <div className="admin-alert error">
            <AlertCircle /> {error}
          </div>
        )}
        {keys.map((k) =>
          k === "hero_image" || k === "logo_url" ? (
            <div key={k}>
              <label>{labels[k]}</label>
              <UploadField
                value={form[k]}
                onChange={(v) => setForm({ ...form, [k]: v })}
              />
            </div>
          ) : [
              "about",
              "notice",
              "hours",
              "address",
              "order_intro",
              "schedule_json",
            ].includes(k) ? (
            <label key={k}>
              {labels[k]}
              <textarea
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </label>
          ) : ["delivery_enabled", "pickup_enabled", "manual_open"].includes(
              k,
            ) ? (
            <label className="check" key={k}>
              <input
                type="checkbox"
                checked={form[k] === "1"}
                onChange={(e) =>
                  setForm({ ...form, [k]: e.target.checked ? "1" : "0" })
                }
              />
              {k === "delivery_enabled"
                ? "Aceitar entrega"
                : k === "pickup_enabled"
                  ? "Aceitar retirada"
                  : "Aberto manualmente"}
            </label>
          ) : ["delivery_fee_mode", "open_mode"].includes(k) ? (
            <label key={k}>
              {k === "delivery_fee_mode" ? "Taxa de entrega" : "Estado da loja"}
              <select
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              >
                {k === "delivery_fee_mode" ? (
                  <>
                    <option value="consult">A consultar</option>
                    <option value="fixed">Taxa fixa</option>
                  </>
                ) : (
                  <>
                    <option value="manual">Manual</option>
                    <option value="hours">Seguir horários</option>
                  </>
                )}
              </select>
            </label>
          ) : (
            <label key={k}>
              {labels[k]}
              <input
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </label>
          ),
        )}
        <button className="btn" disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </section>
  );
}
export default function Admin() {
  const cart = useCart();
  const [user, setUser] = useState(undefined);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const load = async () => {
    setLoadError("");
    try {
      const [all, dashboard] = await Promise.all([
        api("/api/admin/all"),
        api("/api/admin/dashboard"),
      ]);
      setData({ ...all, dashboard });
    } catch (error) {
      setLoadError(error.message);
    }
  };
  useEffect(() => {
    api("/api/auth/me")
      .then((u) => {
        setUser(u);
        load();
      })
      .catch(() => setUser(null));
  }, []);
  if (user === undefined)
    return (
      <main className="load-state">
        <div className="loader" />
      </main>
    );
  if (!user)
    return (
      <Login
        onLogin={() =>
          api("/api/auth/me").then((u) => {
            setUser(u);
            load();
          })
        }
      />
    );
  if (loadError)
    return (
      <main className="load-state">
        <AlertCircle />
        <h1>Não foi possível carregar o painel</h1>
        <p>{loadError}</p>
        <button className="btn" onClick={load}>
          Tentar novamente
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="load-state">
        <div className="loader" />
      </main>
    );
  return (
    <Shell
      data={data}
      user={user}
      reload={load}
      onLogout={() =>
        api("/api/auth/logout", { method: "POST" }).then(() => {
          cart.clear();
          setUser(null);
        })
      }
    />
  );
}
