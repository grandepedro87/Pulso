import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Compass, House, LogOut, Settings, ShieldCheck, SquarePlus, User } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { signOut, useAuth, useIsAdmin, useMyProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";

const navLinkBase =
  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const navLinkActive = "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-primary";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: isAdmin } = useIsAdmin();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const uid = user?.id ?? "";

  async function handleSignOut() {
    await signOut(qc);
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/inicio" className="mb-8 px-2">
          <Logo />
        </Link>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Navegação principal">
          <Link to="/inicio" className={navLinkBase} activeProps={{ className: navLinkActive }}>
            <House className="size-5" /> Início
          </Link>
          <Link to="/explorar" className={navLinkBase} activeProps={{ className: navLinkActive }}>
            <Compass className="size-5" /> Explorar
          </Link>
          <Link to="/registrar" className={navLinkBase} activeProps={{ className: navLinkActive }}>
            <SquarePlus className="size-5" /> Registrar atividade
          </Link>
          <Link
            to="/perfil/$userId"
            params={{ userId: uid }}
            className={navLinkBase}
            activeProps={{ className: navLinkActive }}
          >
            <User className="size-5" /> Meu perfil
          </Link>
          <Link to="/configuracoes" className={navLinkBase} activeProps={{ className: navLinkActive }}>
            <Settings className="size-5" /> Configurações
          </Link>
          {isAdmin ? (
            <Link to="/admin" className={cn(navLinkBase, "mt-4")} activeProps={{ className: navLinkActive }}>
              <ShieldCheck className="size-5" /> Painel admin
            </Link>
          ) : null}
        </nav>
        <Link
          to="/registrar"
          className="mb-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-lime text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110"
        >
          <SquarePlus className="size-4" /> Nova atividade
        </Link>
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2.5">
          <UserAvatar name={profile?.display_name} path={profile?.avatar_url} className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.display_name ?? "…"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-lg lg:hidden">
        <Link to="/inicio">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          {isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Painel admin"
            >
              <ShieldCheck className="size-5" />
            </Link>
          ) : null}
          <Link
            to="/configuracoes"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Configurações"
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </header>

      <main className="pb-safe lg:pb-10 lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
        aria-label="Navegação principal"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          <MobileLink to="/inicio" icon={House} label="Início" />
          <MobileLink to="/explorar" icon={Compass} label="Explorar" />
          <Link
            to="/registrar"
            className="mx-auto -mt-6 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-lime text-primary-foreground shadow-glow"
            aria-label="Registrar atividade"
          >
            <SquarePlus className="size-6" />
          </Link>
          <Link
            to="/perfil/$userId"
            params={{ userId: uid }}
            className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <User className="size-5" />
            Perfil
          </Link>
          <MobileLink to="/configuracoes" icon={Settings} label="Ajustes" />
        </div>
      </nav>
    </div>
  );
}

function MobileLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/inicio" | "/explorar" | "/configuracoes";
  icon: typeof House;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground"
      activeProps={{ className: "text-primary" }}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
