import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { BotaoTema } from "@/components/BotaoTema";
import { IconButton } from "@/components/IconButton";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/boletos", label: "Boletos", icon: FileText },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
];

const itemNav =
  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-ink-600 transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

export function AppLayout() {
  const { email, signOut } = useAuth();
  const [colapsada, setColapsada] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const usuario = email?.split("@")[0] ?? "";

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {menuAberto && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMenuAberto(false)} aria-hidden />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-62 flex-col border-r bg-card transition-[width,translate] duration-200 md:static md:translate-x-0",
          menuAberto ? "translate-x-0" : "-translate-x-full",
          colapsada && "md:w-18",
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center gap-2.5 px-4", colapsada && "md:h-auto md:flex-col md:py-4")}>
          <img src={logo} alt="" className="h-7 w-auto" />
          <span className={cn("font-display text-[21px] font-extrabold tracking-tight", colapsada && "md:hidden")}>
            BillWatch
          </span>
          <IconButton
            label={colapsada ? "Expandir menu" : "Recolher menu"}
            onClick={() => setColapsada(!colapsada)}
            className={cn("hidden size-8 border md:grid [&_svg]:size-4", !colapsada && "ml-auto")}
          >
            {colapsada ? <ChevronsRight /> : <ChevronsLeft />}
          </IconButton>
          <IconButton label="Fechar menu" onClick={() => setMenuAberto(false)} className="ml-auto size-11 md:hidden">
            <X />
          </IconButton>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2" aria-label="Principal">
          {NAV.map(({ to, label, icon: Icone }) => (
            <NavLink
              key={to}
              to={to}
              viewTransition
              title={colapsada ? label : undefined}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                cn(
                  itemNav,
                  isActive && "bg-brand-50 text-brand-700 hover:bg-brand-50 hover:text-brand-700",
                  colapsada && "md:justify-center md:px-0",
                )
              }
            >
              <Icone className="size-5 shrink-0" aria-hidden />
              <span className={cn(colapsada && "md:sr-only")}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t p-3">
          <div className={cn("flex items-center gap-3 px-1 py-2", colapsada && "md:justify-center")}>
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700"
            >
              {usuario.slice(0, 2).toUpperCase()}
            </span>
            <div className={cn("min-w-0", colapsada && "md:hidden")}>
              <p className="truncate text-sm font-semibold capitalize">{usuario}</p>
              <p className="truncate text-xs text-ink-600">{email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            title={colapsada ? "Sair" : undefined}
            className={cn("mt-1 w-full cursor-pointer", itemNav, colapsada && "md:justify-center md:px-0")}
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            <span className={cn(colapsada && "md:sr-only")}>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4 md:px-6">
          <IconButton label="Abrir menu" onClick={() => setMenuAberto(true)} className="size-11 md:hidden">
            <Menu />
          </IconButton>
          <div className="ml-auto flex gap-2">
            {/* ponytail: notificações ainda não existem no backend; botão fica desabilitado até lá. */}
            <IconButton label="Notificações (em breve)" disabled className="size-10 border">
              <Bell />
            </IconButton>
            <BotaoTema />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
