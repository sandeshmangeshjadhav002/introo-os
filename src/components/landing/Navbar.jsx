import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Button from "../Button";

export default function LandingNavbar() {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            to="/"
            className="text-2xl font-bold bg-gradient-to-r from-[#2563EB] to-purple-600 bg-clip-text text-transparent"
          >
            Introo OS
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link
              to="/"
              className="text-[#64748B] hover:text-[#0F172A] dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Features
            </Link>
            <Link
              to="/"
              className="text-[#64748B] hover:text-[#0F172A] dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/"
              className="text-[#64748B] hover:text-[#0F172A] dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Testimonials
            </Link>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-[#64748B] dark:text-gray-400 transition-all"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link to="/login">
              <Button variant="outline" size="md">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="md">Get Started</Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-[#64748B] dark:text-gray-400"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#0F172A] dark:text-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="px-6 py-6 space-y-4">
            <Link
              to="/"
              className="block text-[#64748B] hover:text-[#0F172A] dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Features
            </Link>
            <Link
              to="/"
              className="block text-[#64748B] hover:text-[#0F172A] dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/"
              className="block text-[#64748B] hover:text-[#0F172A] dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Testimonials
            </Link>
            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <Link to="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="w-full">
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
