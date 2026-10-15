import { createContext, useCallback, useMemo, useState } from "react";

export const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "success", timeout = 4000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (timeout) setTimeout(() => remove(id), timeout);
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      toasts,
      success: (m) => push(m, "success"),
      error: (m) => push(m, "danger"),
      info: (m) => push(m, "info"),
      warning: (m) => push(m, "warning"),
      dismiss: remove,
    }),
    [toasts, push, remove]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
