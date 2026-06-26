/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        "primary-light": "#60A5FA",
        bg: "#F8FAFC",
        surface: "#FFFFFF",
        "text-primary": "#0F172A",
        "text-secondary": "#64748B",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444"
      },
      borderRadius: {
        xl: "20px"
      },
      boxShadow: {
        soft: "0 2px 8px rgba(15, 23, 42, 0.08)",
        medium: "0 4px 16px rgba(15, 23, 42, 0.12)",
        large: "0 8px 32px rgba(15, 23, 42, 0.16)"
      }
    },
  },
  plugins: [],
}
