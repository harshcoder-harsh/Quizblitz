import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import CategoryBadge from "../components/CategoryBadge";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const FEATURES = [
  { icon: "⚡", title: "Real-time Gameplay", desc: "Questions delivered simultaneously to every player via WebSockets" },
  { icon: "🏆", title: "Speed Scoring", desc: "Faster correct answers earn more points — be quick and accurate" },
  { icon: "🧠", title: "Tech-only Questions", desc: "10+ categories from DSA to AI/ML, Web Dev to DevOps" },
  { icon: "📊", title: "Live Leaderboard", desc: "Rankings refresh after every question in real time" },
];

export default function Home() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState("join"); // "join" | "create"
  const [joinCode, setJoinCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [categories, setCategories] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [createForm, setCreateForm] = useState({ categoryId: "", difficulty: "MEDIUM", questionCount: 10, timerSeconds: 20, isPublic: true });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importName, setImportName] = useState("");

  const { loginAsGuest } = useAuthStore();

  useEffect(() => {
    axios.get(`${API}/api/questions/categories`).then((r) => setCategories(r.data.categories)).catch(() => {});
    axios.get(`${API}/api/rooms`).then((r) => setPublicRooms(r.data.rooms)).catch(() => {});
  }, []);

  async function handleJoin(e) {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code || code.length !== 6) return toast.error("Enter a valid 6-digit room code");

    if (!token) {
      if (!guestName.trim()) return toast.error("Enter a display name to play as guest");
      const res = await loginAsGuest(guestName.trim());
      if (!res.success) return toast.error(res.error);
    }
    navigate(`/lobby/${code}`);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!createForm.categoryId) return toast.error("Select a category");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/rooms`, {
        categoryId: createForm.categoryId,
        difficulty: createForm.difficulty,
        questionCount: parseInt(createForm.questionCount),
        timerSeconds: parseInt(createForm.timerSeconds),
        isPublic: createForm.isPublic,
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate(`/lobby/${data.room.code}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  async function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    if (importName.trim()) {
      formData.append("quizName", importName.trim());
    }
    
    setImporting(true);
    try {
      const { data } = await axios.post(`${API}/api/questions/import`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });
      toast.success(data.message);
      // Refresh categories
      const { data: catData } = await axios.get(`${API}/api/questions/categories`);
      setCategories(catData.categories);
      setImportName(""); // reset
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to import CSV");
    } finally {
      setImporting(false);
      e.target.value = ""; // Clear file input
    }
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-surface-700 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-xl font-black text-gradient">QuizBlitz</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/leaderboard" className="btn-ghost btn text-sm">🏆 Leaderboard</Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Hi, <span className="text-white font-semibold">{user.username}</span></span>
              <button onClick={() => useAuthStore.getState().logout()} className="btn-secondary btn text-sm">Log out</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn-ghost btn text-sm">Log in</Link>
              <Link to="/register" className="btn-primary btn text-sm">Sign up</Link>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Real-time multiplayer · Tech-only questions
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-white">Quiz</span>
            <span className="text-gradient">Blitz</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Fast-paced multiplayer tech quizzes. Compete live with developers, students & tech enthusiasts across 10 categories.
          </p>
        </motion.div>

        {/* Main CTA Panel */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
          {/* Join / Create Tabs */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
            <div className="flex rounded-xl bg-surface-900 p-1 mb-6">
              {["join", "create"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-brand-500 text-white shadow-glow-brand" : "text-gray-400 hover:text-white"}`}
                >
                  {t === "join" ? "🚪 Join Room" : "🏠 Create Room"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === "join" ? (
                <motion.form key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={handleJoin} className="space-y-4">
                  {!token && (
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Your display name</label>
                      <input className="input" placeholder="e.g. devguru42" value={guestName}
                        onChange={(e) => setGuestName(e.target.value)} maxLength={20} />
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Room code</label>
                    <input className="input text-2xl tracking-widest font-mono text-center" placeholder="123456"
                      value={joinCode} onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6} />
                  </div>
                  <button type="submit" className="btn-primary btn w-full text-base py-3">
                    Join Game →
                  </button>
                </motion.form>
              ) : (
                <motion.form key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={handleCreate} className="space-y-4">
                  {!token && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                      ⚠️ You need to be logged in to create a room.{" "}
                      <Link to="/login" className="underline">Log in</Link> or{" "}
                      <Link to="/register" className="underline">Sign up</Link>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Select Quiz Library</label>
                    <select className="input" value={createForm.categoryId}
                      onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}>
                        <option value="">Select a library...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Difficulty</label>
                      <select className="input" value={createForm.difficulty}
                        onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value })}>
                        <option value="EASY">🟢 Easy</option>
                        <option value="MEDIUM">🟡 Medium</option>
                        <option value="HARD">🔴 Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block">Questions</label>
                      <select className="input" value={createForm.questionCount}
                        onChange={(e) => setCreateForm({ ...createForm, questionCount: e.target.value })}>
                        {[5, 8, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Timer per question</label>
                    <select className="input" value={createForm.timerSeconds}
                      onChange={(e) => setCreateForm({ ...createForm, timerSeconds: e.target.value })}>
                        {[10, 15, 20, 25, 30].map((n) => <option key={n} value={n}>{n} seconds</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={loading || !token} className="btn-primary btn w-full text-base py-3">
                    {loading ? "Creating..." : "Create Room 🏠"}
                  </button>

                  {/* Bulk Import UI */}
                  {token && (
                    <div className="mt-4 pt-4 border-t border-surface-700 bg-surface-800/50 -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-white">📚 Add New Quiz Library</p>
                        <a href="/quiz-template.csv" download className="text-xs text-brand-400 hover:text-brand-300 underline font-medium">Download CSV Template</a>
                      </div>
                      <div className="space-y-3">
                        <input className="input py-2 text-sm" placeholder="Name of your quiz (e.g. History 101)" value={importName} onChange={(e) => setImportName(e.target.value)} />
                        <label className={`btn-secondary btn w-full text-sm py-2 ${importing ? "opacity-50 cursor-wait" : "cursor-pointer"}`}>
                          {importing ? "Importing..." : "📥 Upload CSV File"}
                          <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={importing} />
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-3 text-center">Format: question, difficulty, optionA, optionB, optionC, optionD, correctOption, explanation</p>
                    </div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Features */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="card p-4 flex items-start gap-4">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-white text-sm">{f.title}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Public Rooms */}
        {publicRooms.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">🌍 Public Rooms</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicRooms.map((room) => (
                <div key={room.id} className="card p-4 hover:border-brand-500/50 transition-all group cursor-pointer"
                  onClick={() => { setJoinCode(room.code); setTab("join"); }}>
                  <div className="flex items-start justify-between mb-3">
                    {room.category && <CategoryBadge icon={room.category.icon} name={room.category.name} color={room.category.color} />}
                    <span className={room.difficulty === "HARD" ? "badge-hard" : room.difficulty === "EASY" ? "badge-easy" : "badge-medium"}>
                      {room.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 font-mono">#{room.code}</span>
                    <span className="text-xs text-gray-400">👥 {room.playerCount}/{room.maxPlayers}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{room.questionCount} questions · {room.timerSeconds}s timer</div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Categories showcase */}
        {categories.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="max-w-5xl mx-auto mt-16">
            <h2 className="text-xl font-bold text-white mb-4">🗂️ Question Categories</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <CategoryBadge key={c.id} icon={c.icon} name={`${c.name} (${c._count?.questions ?? 0})`} color={c.color} size="lg" />
              ))}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
