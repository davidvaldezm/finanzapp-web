import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: "#020617",
          color: "#e5e7eb",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>FinanzApp</h2>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            {user?.name} - {user?.email}
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink to="/app" label="Dashboard" current={location.pathname === "/app"} />
          <NavLink
            to="/app/categories"
            label="Categorias"
            current={location.pathname.startsWith("/app/categories")}
          />
          <NavLink
            to="/app/transactions"
            label="Transacciones"
            current={location.pathname.startsWith("/app/transactions")}
          />
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: 16,
            padding: "8px 10px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: "#ef4444",
            color: "#fee2e2",
            fontWeight: 600,
          }}
        >
          Cerrar sesion
        </button>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          background: "#0f172a",
          color: "#e5e7eb",
          padding: 24,
          overflow: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

type NavLinkProps = {
  to: string;
  label: string;
  current: boolean;
};

const NavLink: React.FC<NavLinkProps> = ({ to, label, current }) => (
  <Link
    to={to}
    style={{
      display: "block",
      padding: "8px 10px",
      borderRadius: 999,
      textDecoration: "none",
      color: current ? "#22c55e" : "#e5e7eb",
      background: current ? "#022c22" : "transparent",
      fontSize: 14,
      marginBottom: 6,
    }}
  >
    {label}
  </Link>
);

export default AppLayout;
