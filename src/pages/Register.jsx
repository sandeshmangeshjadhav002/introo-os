import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../components/Card";
import Button from "../components/Button";
import { useTheme } from "../context/ThemeContext";
import { useSupabase } from "../context/SupabaseContext";
import { Sun, Moon, AlertCircle, CheckCircle } from "lucide-react";

export default function Register() {
  const { theme, setTheme } = useTheme();
  const { signUp, user, createOrganization, profile } = useSupabase();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("signup"); // 'signup', 'org', 'success'

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user && profile?.organization_id) {
      navigate("/dashboard");
    }
  }, [user, profile, navigate]);

  // After signup, if user exists but no org, go to org step
  useEffect(() => {
    if (user && !profile?.organization_id && step === "signup") {
      setStep("org");
    }
  }, [user, profile, step]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, { full_name: name, role: "admin" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createOrganization(orgName);
      setStep("success");
      setTimeout(() => navigate("/dashboard"), 2000);
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
          {step === "signup" && (
            <>
              <h1 className="text-3xl font-bold mb-2">Create account</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Start your free 14-day trial
              </p>

              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    <AlertCircle size={20} />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </>
          )}

          {step === "org" && (
            <>
              <h1 className="text-3xl font-bold mb-2">
                Create your organization
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                What's your company called?
              </p>

              <form onSubmit={handleCreateOrg} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Company"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                    <AlertCircle size={20} />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Organization"}
                </Button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Welcome to Introo OS!</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting you to your dashboard...
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
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
