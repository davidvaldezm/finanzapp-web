// src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginPage from "./LoginPage";

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("David");
  const [email, setEmail] = useState("david@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/app");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  // Reusar el mismo AuthLayout de LoginPage
  // (lo exportamos por defecto en LoginPage, así que copié la definición ahí)
  // Aquí simplemente le pedimos a Codex que copie el AuthLayout o lo duplicas.
  const AuthLayout = (LoginPage as any).AuthLayout || ((props: any) => <div>{props.children}</div>);

  return (
    <AuthLayout title="Crear cuenta">
      <form onSubmit={handleSubmit}>
        <label>Nombre</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Correo</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <p style={{ marginTop: 12, fontSize: 14 }}>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;
