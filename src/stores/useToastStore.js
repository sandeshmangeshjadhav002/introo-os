import { create } from "zustand";

let toastId = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = ++toastId;
    const newToast = { id, ...toast };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    if (!toast.persistent) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration || 5000);
    }
    
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  success: (message, options = {}) =>
    useToastStore.getState().addToast({
      type: "success",
      message,
      ...options,
    }),
  error: (message, options = {}) =>
    useToastStore.getState().addToast({
      type: "error",
      message,
      ...options,
    }),
  warning: (message, options = {}) =>
    useToastStore.getState().addToast({
      type: "warning",
      message,
      ...options,
    }),
  info: (message, options = {}) =>
    useToastStore.getState().addToast({
      type: "info",
      message,
      ...options,
    }),
};
