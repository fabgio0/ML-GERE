import React, { useState } from "react";
import {
  ArrowLeftRight,
  FileText,
  LayoutDashboard,
  Menu,
  Receipt,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useFinance, financeActions } from "@/lib/finance-store";
import { AppRoute, Link, useRouter } from "@/lib/router";

interface NavItem {
  to: AppRoute;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter();
  const { boletos, notas, servicos } = useFinance();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const vencidosCount = boletos.filter((b) => b.status === "vencido").length;
  const pendentesNotas = notas.filter((n) => n.status === "pendente").length;
  const aguardandoServicos = servicos.filter((s) => s.status === "aguardando").length;

  const navItems: NavItem[] = [
    { to: "/", label: "Painel", icon: LayoutDashboard },
    {
      to: "/boletos",
      label: "Boletos",
      icon: Receipt,
      badge: vencidosCount > 0 ? vencidosCount : undefined,
    },
    {
      to: "/notas",
      label: "Notas fiscais",
      icon: FileText,
      badge: pendentesNotas > 0 ? pendentesNotas : undefined,
    },
    {
      to: "/servicos",
      label: "Entradas e saídas",
      icon: ArrowLeftRight,
      badge: aguardandoServicos > 0 ? aguardandoServicos : undefined,
    },
  ];

  const renderSidebarContent = (closeOnNav?: boolean) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
        <Link
          to="/"
          onClick={() => closeOnNav && setMobileOpen(false)}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-slate-950 font-bold text-sm">
            F
          </span>
          <span>Fluxa</span>
        </Link>
        {closeOnNav && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="grid size-9 place-items-center rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Navegação principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => closeOnNav && setMobileOpen(false)}
              className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                active
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`size-4 shrink-0 ${
                    active ? "text-sidebar-primary" : "text-sidebar-muted"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge !== undefined && (
                <span
                  className={`num text-xs font-semibold ${
                    active ? "text-sidebar-primary" : "text-sidebar-muted"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-accent text-sm font-semibold text-sidebar-primary">
              M
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                Marina
              </p>
              <p className="truncate text-xs text-sidebar-muted">
                Gestão Financeira
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            title="Restaurar dados iniciais"
            aria-label="Restaurar dados iniciais"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64 lg:border-r lg:border-sidebar-border">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Top Bar (compact <= 56px, well within 15% mobile sticky cap) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur-sm lg:hidden">
        <Link
          to="/"
          className="flex items-center gap-2 text-base font-bold tracking-tight whitespace-nowrap shrink-0"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-sidebar text-sidebar-primary font-bold text-xs">
            F
          </span>
          <span>Fluxa</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-accent cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="size-4" />
          <span>Menu</span>
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] shadow-2xl">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          financeActions.restaurarDados();
          toast.success("Dados de demonstração restaurados");
        }}
        title="Restaurar dados iniciais?"
        description="Todas as alterações locais em boletos, notas fiscais e serviços serão revertidas para o estado inicial."
        confirmLabel="Restaurar"
        destructive
      />
    </div>
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
}

export function StatCard({ label, value, icon, hint }: StatCardProps) {
  return (
    <div className="surface flex flex-col justify-between p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            {icon}
          </span>
        )}
      </div>
      <p className="num mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
