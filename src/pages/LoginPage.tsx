import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AuthLayout: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "#e5e7eb",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#0f172a",
          padding: 24,
          borderRadius: 16,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 10px 25px rgba(15,23,42,0.9)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>FinanzApp</h1>
        <h2 style={{ marginTop: 0, fontSize: 18, color: "#9ca3af" }}>{title}</h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 16,
          }}
        >
          {children}
        </div>
        <style>{`
          label {
            font-size: 0.8rem;
            color: #9ca3af;
          }
          input {
            width: 100%;
            padding: 8px 10px;
            border-radius: 10px;
            border: 1px solid #1f2937;
            background: #020617;
            color: #e5e7eb;
          }
          button {
            margin-top: 8px;
            width: 100%;
            border: none;
            padding: 10px 12px;
            border-radius: 999px;
            background: #22c55e;
            color: #022c22;
            font-weight: 600;
            cursor: pointer;
          }
          button:disabled {
            opacity: 0.6;
            cursor: wait;
          }
          .error {
            margin-top: 4px;
            font-size: 0.8rem;
            color: #f97373;
          }
          a {
            color: #38bdf8;
          }
        `}</style>
      </div>
    </div>
  );
};

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("david@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Iniciar sesion">
      <form onSubmit={handleSubmit}>
        <label>Correo</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Contrasena</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p style={{ marginTop: 12, fontSize: 14 }}>
        No tienes cuenta? <Link to="/register">Registrate aqui</Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
