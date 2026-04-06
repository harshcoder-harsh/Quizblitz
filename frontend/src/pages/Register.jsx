import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    const res = await register(form.username, form.email, form.password);
    if (res.success) {
      toast.success("Account created! Welcome to QuizBlitz 🎉");
      navigate("/");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">⚡</span>
            <span className="text-2xl font-black text-gradient">QuizBlitz</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 mt-2">Join thousands of developers competing live</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input id="reg-username" type="text" className="input" placeholder="devguru42"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                required minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" />
              <p className="text-xs text-gray-500 mt-1">Letters, numbers, and underscores only</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input id="reg-email" type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input id="reg-password" type="password" className="input" placeholder="Min. 6 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required minLength={6} />
            </div>
            <button type="submit" id="reg-submit" disabled={isLoading} className="btn-primary btn w-full py-3 text-base">
              {isLoading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">Log in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
