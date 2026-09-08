import { Link, useLocation } from 'wouter';
import { Bell, BriefcaseBusiness, ChevronRight, CircleUserRound, LayoutDashboard, ListChecks, Menu, Search, Sparkles, UserRound, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Command center', icon: LayoutDashboard },
  { href: '/opportunities', label: 'Opportunities', icon: Search },
  { href: '/applications', label: 'Applications', icon: ListChecks },
  { href: '/profile', label: 'My profile', icon: UserRound },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="noise min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground lg:flex">
        <Brand />
        <div className="mt-12 mb-4 px-3 font-mono-app text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/45">Workspace</div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = location === item.href;
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} data-testid={`link-${item.label.toLowerCase().replaceAll(' ', '-')}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-all ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_8px_22px_rgba(233,103,83,.22)]' : 'text-sidebar-foreground/63 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}><Icon size={17} strokeWidth={active ? 2.5 : 1.8} /><span>{item.label}</span>{active && <ChevronRight size={14} className="ml-auto opacity-65" />}</Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/65 p-4">
          <div className="mb-3 flex items-center justify-between"><span className="font-mono-app text-[10px] uppercase tracking-widest text-sidebar-foreground/50">Sprint status</span><span className="h-2 w-2 rounded-full bg-[#f4c84e] shadow-[0_0_0_4px_rgba(244,200,78,.12)]" /></div>
          <div className="font-display text-2xl font-bold">Day 01 <span className="text-sm font-medium text-sidebar-foreground/45">/ 30</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sidebar-foreground/10"><div className="h-full w-[27%] rounded-full bg-[#f4c84e]" /></div>
          <p className="mt-3 text-xs leading-relaxed text-sidebar-foreground/50">Every focused application compounds.</p>
        </div>
        <div className="mt-5 flex items-center gap-3 px-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#d6e8db] font-display text-sm font-bold text-sidebar">AS</div><div className="min-w-0"><div className="truncate text-sm font-semibold">Aarav Shah</div><div className="truncate text-[11px] text-sidebar-foreground/45">B.Tech IT · Year 3</div></div><button data-testid="button-profile-menu" className="ml-auto text-sidebar-foreground/45 hover:text-sidebar-foreground"><CircleUserRound size={17} /></button></div>
      </aside>
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8 lg:px-10">
          <button data-testid="button-open-menu" className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><BriefcaseBusiness size={14} className="text-primary" /><span>30-day internship sprint</span><span className="mx-1 text-border">/</span><span className="font-mono-app text-[11px]">INDIA · 2026</span></div>
          <div className="ml-auto flex items-center gap-3"><button data-testid="button-notifications" className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" /></button><Link href="/profile" data-testid="link-header-profile" className="grid h-9 w-9 place-items-center rounded-full bg-[#d6e8db] font-display text-xs font-bold text-sidebar">AS</Link></div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
      {mobileOpen && <div className="fixed inset-0 z-50 bg-sidebar lg:hidden"><div className="flex items-center justify-between px-5 py-6"><Brand /><button data-testid="button-close-menu" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-sidebar-foreground/70"><X /></button></div><nav className="mt-8 space-y-2 px-5">{navItems.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-4 text-base font-semibold text-sidebar-foreground/75 hover:bg-sidebar-accent"><Icon size={19} />{item.label}</Link>; })}</nav></div>}
    </div>
  );
}

function Brand() {
  return <Link href="/" data-testid="link-brand" className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Sparkles size={18} fill="currentColor" /></div><div><div className="font-display text-[15px] font-bold tracking-tight">Internship<span className="text-sidebar-primary">/</span>Bot</div><div className="font-mono-app text-[8px] uppercase tracking-[.2em] text-sidebar-foreground/40">search assistant</div></div></Link>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: React.ReactNode; description?: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 font-mono-app text-[10px] uppercase tracking-[.2em] text-primary">{eyebrow}</div><h1 className="font-display text-3xl font-bold tracking-[-.04em] text-balance sm:text-[40px]">{title}</h1>{description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>}</div>{action}</div>;
}

export function LoadingBlocks({ count = 3 }: { count?: number }) {
  return <div className="space-y-3" data-testid="status-loading">{Array.from({ length: count }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div data-testid="status-error" className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"><p className="font-display text-lg font-bold">Could not load this workspace</p><p className="mt-1 text-sm text-muted-foreground">The signal dropped. Try once more.</p>{onRetry && <button data-testid="button-retry" onClick={onRetry} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button>}</div>;
}
