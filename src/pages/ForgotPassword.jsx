import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../components/Card";
import Button from "../components/Button";
import { useTheme } from "../context/ThemeContext";
import { useSupabase } from "../context/SupabaseContext";
import { Sun, Moon, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
  const { theme, setTheme } = useTheme();
  const { resetPassword } = useSupabase();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Introo OS
          </Link>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2">Reset password</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {sent
              ? "Check your email for a reset link"
              : "Enter your email to reset your password"}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 mb-6">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <Button className="w-full" onClick={() => setSent(false)}>
              Send Again
            </Button>
          )}

          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            Remember your password?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
