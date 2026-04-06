import { create } from "zustand";
import axios from "axios";
import { connectSocket, disconnectSocket } from "../socket";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  init() {
    const token = localStorage.getItem("qb_token");
    const user  = localStorage.getItem("qb_user");
    if (token && user) {
      set({ token, user: JSON.parse(user) });
      connectSocket(token);
    }
  },

  async register(username, email, password) {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(`${API}/api/auth/register`, { username, email, password });
      get()._persist(data.user, data.token);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || "Registration failed";
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  async login(email, password) {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, { email, password });
      get()._persist(data.user, data.token);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed";
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  async loginAsGuest(username) {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(`${API}/api/auth/guest`, { username });
      get()._persist(data.user, data.token);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || "Guest login failed";
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout() {
    localStorage.removeItem("qb_token");
    localStorage.removeItem("qb_user");
    disconnectSocket();
    set({ user: null, token: null, error: null });
  },

  _persist(user, token) {
    localStorage.setItem("qb_token", token);
    localStorage.setItem("qb_user", JSON.stringify(user));
    connectSocket(token);
    set({ user, token, isLoading: false, error: null });
  },

  clearError() { set({ error: null }); },
}));

export default useAuthStore;
