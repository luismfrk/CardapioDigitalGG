import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import Admin from "./admin/Admin";
import "./styles.css";

export const api = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(
      data.error || data.errors?.join(" ") || "Falha na operação.",
    );
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
};
const CartContext = createContext();
const key = "encantos-cart-v1";
export const useCart = () => useContext(CartContext);
function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);
  useEffect(() => localStorage.setItem(key, JSON.stringify(items)), [items]);
  const add = (product, choices = []) => {
    const signature = JSON.stringify(choices.map((c) => c.id).sort());
    setItems((old) => {
      const found = old.find(
        (i) => i.productId === product.id && i.signature === signature,
      );
      return found
        ? old.map((i) => (i === found ? { ...i, qty: i.qty + 1 } : i))
        : [
            ...old,
            {
              productId: product.id,
              name: product.name,
              basePrice: product.promo_price || product.price,
              image: product.image_url,
              choices,
              signature,
              qty: 1,
            },
          ];
    });
    setOpen(true);
  };
  const update = (index, qty) =>
    setItems((old) =>
      qty < 1
        ? old.filter((_, i) => i !== index)
        : old.map((x, i) => (i === index ? { ...x, qty } : x)),
    );
  const clear = () => {
    localStorage.removeItem(key);
    setItems([]);
    setOpen(false);
  };
  const value = useMemo(
    () => ({
      items,
      setItems,
      add,
      update,
      clear,
      open,
      setOpen,
      count: items.reduce((s, i) => s + i.qty, 0),
      total: items.reduce(
        (s, i) =>
          s +
          (i.basePrice + i.choices.reduce((a, c) => a + c.price_delta, 0)) *
            i.qty,
        0,
      ),
    }),
    [items, open],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/*" element={<App />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
