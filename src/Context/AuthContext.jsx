import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Rehydrate from localStorage on first load ──────────
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("hms_token");
      const storedUser  = localStorage.getItem("hms_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      }
    } catch {
      localStorage.removeItem("hms_token");
      localStorage.removeItem("hms_user");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────
  // Do NOT send a hardcoded role — the backend determines the role from the DB.
  // Sending role: "admin" would cause non-admin logins to fail or be misidentified.
  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });

    const { token: newToken, user: newUser } = data;

    localStorage.setItem("hms_token", newToken);
    localStorage.setItem("hms_user",  JSON.stringify(newUser));

    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    setToken(newToken);
    setUser(newUser);

    return newUser;
  }, []);

  // ── Logout ─────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_user");
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  }, []);

  // ── Role booleans ──────────────────────────────────────
  const isAdmin        = user?.role === "admin";
  const isDoctor       = user?.role === "doctor";
  const isNurse        = user?.role === "nurse";
  const isReceptionist = user?.role === "receptionist";
  const isPatient      = user?.role === "patient";

  // ── Permission helpers (real-world hospital rules) ─────

  // Create / edit patients, appointments
  const canWrite = ["admin", "receptionist"].includes(user?.role);

  // Delete any record — admin only
  const canDelete = user?.role === "admin";

  // Write clinical content: diagnoses, prescriptions, doctor notes
  // Receptionist cannot write clinical notes — only doctors and admin can
  const canEditMedical = ["admin", "doctor"].includes(user?.role);

  // Create the medical record shell (not clinical content)
  // Receptionist registers patients so they should be able to create the record
  const canCreateMedicalRecord = ["admin", "receptionist", "doctor"].includes(user?.role);

  // Update vitals — nurses do this bedside
  const canEditVitals = ["admin", "doctor", "nurse"].includes(user?.role);

  // Manage ward beds: admit, discharge, maintenance
  // Receptionist handles admissions at the front desk; nurses manage beds on the floor
  const canManageWards = ["admin", "receptionist", "nurse"].includes(user?.role);

  // View billing — receptionist, doctor (to see what was billed), admin
  const canViewBilling = ["admin", "receptionist", "doctor"].includes(user?.role);

  // Create / edit bills and record payments — receptionist and admin
  const canEditBilling = ["admin", "receptionist"].includes(user?.role);

  // Route-level access
  const canAccess = useCallback((route) => {
    if (!user) return false;
    const { role } = user;

    const rules = {
      "/":                true,
      "/patients":        ["admin", "doctor", "receptionist", "nurse"].includes(role),
      "/doctors":         ["admin", "doctor", "receptionist"].includes(role),
      "/appointments":    ["admin", "doctor", "receptionist", "nurse"].includes(role),
      "/medical-records": ["admin", "doctor", "receptionist", "nurse"].includes(role),
      "/wards":           ["admin", "receptionist", "nurse"].includes(role),
      "/billing":         ["admin", "receptionist", "doctor"].includes(role),
    };

    return rules[route] ?? role === "admin";
  }, [user]);

  const value = {
    // State
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,

    // Actions
    login,
    logout,

    // Role booleans
    isAdmin,
    isDoctor,
    isNurse,
    isReceptionist,
    isPatient,

    // Permission helpers
    canWrite,
    canDelete,
    canEditMedical,
    canCreateMedicalRecord,
    canEditVitals,
    canManageWards,
    canViewBilling,
    canEditBilling,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
