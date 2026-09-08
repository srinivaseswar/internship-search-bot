import {
  getGetDashboardSummaryQueryKey,
  getGetProfileQueryKey,
  getListApplicationsQueryKey,
  getListOpportunitiesQueryKey,
  type Application,
  type Opportunity,
  type Profile,
  useCreateApplication,
  useGetDashboardSummary,
  useGetProfile,
  useListApplications,
  useListOpportunities,
  useUpdateApplication,
  useUpdateOpportunity,
  useUpdateProfile,
} from '@workspace/api-client-react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shell, PageHeader, LoadingBlocks, ErrorState } from '@/components/shell';
import { OpportunityCard } from '@/components/opportunity-card';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useSearch } from 'wouter';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  FileText,
  Filter,
  Flame,
  GraduationCap,
  Heart,
  Layers3,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const queryClient = new QueryClient();

function Stat({ label, value, detail, tone = 'orange', icon: Icon }: { label: string; value: string | number; detail: string; tone?: 'orange' | 'green' | 'blue' | 'ink'; icon: typeof Target }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <Icon size={17} strokeWidth={1.8} />
      </div>
      <div className="mt-5 font-display text-3xl font-bold tracking-[-.05em]">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function SectionTitle({ children, href, action }: { children: ReactNode; href?: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-xl font-bold tracking-[-.03em]">{children}</h2>
      {href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">{action ?? 'View all'} <ArrowRight size={13} /></Link>}
    </div>
  );
}

function Home() {
  const summaryQuery = useGetDashboardSummary();
  const feedQuery = useListOpportunities({ sort: 'fit' });
  const applicationsQuery = useListApplications();
  const queryClientInstance = useQueryClient();
  const saveMutation = useUpdateOpportunity({
    mutation: {
      onSuccess: () => {
        queryClientInstance.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClientInstance.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
      },
    },
  });
  const createMutation = useCreateApplication({
    mutation: {
      onSuccess: () => {
        queryClientInstance.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClientInstance.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      },
    },
  });
  const summary = summaryQuery.data;
  const applications = applicationsQuery.data ?? [];
  const feed = (feedQuery.data ?? []).slice(0, 6);

  if (summaryQuery.isLoading) return <PageShell><LoadingBlocks count={5} /></PageShell>;
  if (summaryQuery.isError || !summary) return <PageShell><ErrorState onRetry={() => summaryQuery.refetch()} /></PageShell>;

  const recommendedToday = summary.recommendedToday ?? [];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Tuesday · 30-day sprint"
        title={<>Make this the week<br /><span className="text-primary">you get momentum.</span></>}
        description="Your search is not a waiting game. Pick the strongest match, tailor the story, and send the next application today."
        action={<Link href="/opportunities" className="primary-button"><Search size={16} /> Find internships</Link>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Top match" value={`${summary.topMatch}%`} detail="profile alignment" tone="orange" icon={Target} />
        <Stat label="Live opportunities" value={summary.totalOpportunities} detail={`${summary.verifiedCount} official pages checked`} tone="green" icon={Layers3} />
        <Stat label="Applications sent" value={summary.applications} detail={summary.applications ? 'Keep the cadence' : 'Send your first today'} tone="blue" icon={Send} />
        <Stat label="Days remaining" value={summary.daysLeft} detail="until your target date" tone="ink" icon={Flame} />
      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <SectionTitle href="/opportunities" action="Browse all">Recommended for you</SectionTitle>
          <div className="space-y-3">
            {recommendedToday.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onSave={(saved) => saveMutation.mutate({ id: opportunity.id, data: { saved } })}
                compact
              />
            ))}
          </div>
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold tracking-[-.03em]">Fresh today</h2>
                <p className="mt-1 text-xs text-muted-foreground">Newly checked student opportunities from hiring platforms.</p>
              </div>
              <button className="text-xs font-semibold text-primary hover:underline" onClick={() => feedQuery.refetch()}>Refresh feed</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {feed.map((opportunity) => (
                <OpportunityCard key={`feed-${opportunity.id}`} opportunity={opportunity} compact />
              ))}
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="dark-panel">
            <div className="flex items-start justify-between">
              <div><div className="eyebrow text-[#f5c65d]">Your next move</div><h3 className="mt-3 font-display text-2xl font-bold leading-tight text-white">Apply to the<br />highest-fit role.</h3></div>
              <Sparkles size={20} className="text-[#f5c65d]" />
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/60">You already have the skills. The only missing variable is a focused application sent today.</p>
            <Link href="/opportunities" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#f5c65d] px-4 py-2.5 text-sm font-bold text-[#17201d] transition hover:bg-[#ffe18c]">Open shortlist <ArrowRight size={15} /></Link>
          </div>
          <div className="soft-panel">
            <SectionTitle href="/applications" action="Open tracker">Application pulse</SectionTitle>
            {applications.length === 0 ? (
              <div className="py-4"><p className="text-sm text-muted-foreground">No applications tracked yet.</p><Link href="/opportunities" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">Start with your top match <ArrowRight size={14} /></Link></div>
            ) : (
              <div className="space-y-3">{applications.slice(0, 3).map((application) => <ApplicationRow key={application.id} application={application} />)}</div>
            )}
          </div>
          <div className="soft-panel">
            <div className="flex items-center gap-2 text-sm font-bold"><BookOpen size={16} className="text-primary" /> Today’s coaching note</div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Lead with one shipped project in every application. Your stack is broad; your proof should be specific.</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function Opportunities() {
  const [filters, setFilters] = useState({ search: '', location: '', mode: '', focus: '', minStipend: undefined as number | undefined, sort: 'fit' });
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const search = useSearch();
  const queryClientInstance = useQueryClient();
  const query = useListOpportunities(filters);
  const saveMutation = useUpdateOpportunity({
    mutation: {
      onSuccess: () => {
        queryClientInstance.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
        queryClientInstance.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
    },
  });
  const createMutation = useCreateApplication({
    mutation: {
      onSuccess: () => {
        queryClientInstance.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        queryClientInstance.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
    },
  });
  const opportunities = query.data ?? [];
  useEffect(() => {
    const id = Number(new URLSearchParams(search).get('id'));
    if (id) setSelected(opportunities.find((opportunity) => opportunity.id === id) ?? null);
  }, [search, opportunities]);
  return (
    <PageShell>
      <PageHeader eyebrow="Opportunity radar" title="Find your next opening." description="Ranked against your skills, locations, interests, and 30-day target. Verify the exact role before you apply." action={<div className="verified-pill"><BadgeCheck size={15} /> Official links only</div>} />
      <div className="search-bar">
        <Search size={18} className="text-muted-foreground" />
        <input aria-label="Search internships" placeholder="Search roles, companies, or skills" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
        <select aria-label="Sort opportunities" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}><option value="fit">Best fit</option><option value="salary">Salary potential</option><option value="brand">Brand value</option><option value="learning">Learning upside</option></select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FilterSelect label="Location" value={filters.location} options={['', 'Chennai', 'Bangalore', 'Hyderabad', 'Pune', 'Remote', 'India']} onChange={(value) => setFilters((current) => ({ ...current, location: value }))} />
        <FilterSelect label="Work mode" value={filters.mode} options={['', 'Remote', 'Hybrid', 'On-site']} onChange={(value) => setFilters((current) => ({ ...current, mode: value }))} />
        <FilterSelect label="Focus" value={filters.focus} options={['', 'AI', 'Full Stack', 'Backend', 'Cloud', 'Cybersecurity']} onChange={(value) => setFilters((current) => ({ ...current, focus: value }))} />
        <button className={`filter-chip ${filters.minStipend ? 'active' : ''}`} onClick={() => setFilters((current) => ({ ...current, minStipend: current.minStipend ? undefined : 10000 }))}><IndianRupeeMark /> ₹10k+ stipend</button>
      </div>
      <div className="mt-8 flex items-center justify-between"><p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{opportunities.length}</span> matches in your radar</p><div className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Filter size={13} /> Updated for today</div></div>
      {query.isLoading ? <LoadingBlocks count={5} /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} onSave={(saved) => saveMutation.mutate({ id: opportunity.id, data: { saved } })} />)}
        </div>
      )}
      {selected && <OpportunityDetail opportunity={selected} onClose={() => setSelected(null)} onApply={() => createMutation.mutate({ data: { opportunityId: selected.id, company: selected.company, role: selected.role, stage: 'Applied', nextAction: 'Check for response in 5 days' } })} />}
      {!selected && opportunities.length > 0 && <button className="sr-only" onClick={() => setSelected(opportunities[0])}>Open first opportunity</button>}
    </PageShell>
  );
}

function Applications() {
  const query = useListApplications();
  const queryClientInstance = useQueryClient();
  const updateMutation = useUpdateApplication({
    mutation: { onSuccess: () => queryClientInstance.invalidateQueries({ queryKey: getListApplicationsQueryKey() }) },
  });
  const grouped = useMemo(() => {
    const groups: Record<string, Application[]> = { Saved: [], Applied: [], Screening: [], Interview: [], Offer: [] };
    for (const app of query.data ?? []) (groups[app.stage] ??= []).push(app);
    return groups;
  }, [query.data]);
  return (
    <PageShell>
      <PageHeader eyebrow="Application tracker" title="Turn interest into follow-through." description="Every saved role deserves a next action. Keep your pipeline visible and follow up while the opportunity is still warm." action={<Link href="/opportunities" className="primary-button"><Plus size={16} /> Add application</Link>} />
      {query.isLoading ? <LoadingBlocks count={4} /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Object.entries(grouped).map(([stage, items]) => <div key={stage} className="pipeline-column"><div className="mb-3 flex items-center justify-between"><span className="eyebrow">{stage}</span><span className="count-badge">{items.length}</span></div><div className="space-y-3">{items.length === 0 ? <div className="empty-column">Nothing here yet</div> : items.map((application) => <ApplicationCard key={application.id} application={application} onStageChange={(nextStage) => updateMutation.mutate({ id: application.id, data: { stage: nextStage } })} />)}</div></div>)}
        </div>
      )}
    </PageShell>
  );
}

function Profile() {
  const query = useGetProfile();
  const updateMutation = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile | null>(null);
  if (query.isLoading) return <PageShell><LoadingBlocks count={4} /></PageShell>;
  if (query.isError || !query.data) return <PageShell><ErrorState onRetry={() => query.refetch()} /></PageShell>;
  const profile = query.data;
  const current = draft ?? profile;
  const save = () => {
    if (!draft) return;
    updateMutation.mutate({ data: { name: draft.name, degree: draft.degree, year: draft.year, locations: draft.locations, skills: draft.skills, interests: draft.interests, target: draft.target } }, { onSuccess: () => { setEditing(false); setDraft(null); queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() }); } });
  };
  return (
    <PageShell>
      <PageHeader eyebrow="Your profile" title="Make your story searchable." description="This profile powers your fit scores and gives every application a sharper starting point." action={editing ? <div className="flex gap-2"><button className="secondary-button" onClick={() => { setEditing(false); setDraft(null); }}>Cancel</button><button className="primary-button" onClick={save}><Check size={16} /> Save profile</button></div> : <button className="primary-button" onClick={() => { setDraft(profile); setEditing(true); }}><Pencil size={15} /> Edit profile</button>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="profile-card">
          <div className="profile-hero"><div className="profile-avatar">{current.name.slice(0, 2).toUpperCase()}</div><div><div className="eyebrow text-[#f5c65d]">Candidate profile</div><h2 className="mt-2 font-display text-2xl font-bold text-white">{current.name}</h2><p className="mt-1 text-sm text-white/60">{current.degree} · {current.year}</p></div></div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <ProfileField label="Name" value={current.name} editing={editing} onChange={(value) => setDraft({ ...current, name: value })} />
            <ProfileField label="Target" value={current.target} editing={editing} onChange={(value) => setDraft({ ...current, target: value })} />
            <ProfileField label="Degree" value={current.degree} editing={editing} onChange={(value) => setDraft({ ...current, degree: value })} />
            <ProfileField label="Year" value={current.year} editing={editing} onChange={(value) => setDraft({ ...current, year: value })} />
          </div>
          <div className="border-t border-border px-6 py-6"><div className="eyebrow">Preferred locations</div><div className="mt-3 flex flex-wrap gap-2">{current.locations.map((location) => <span key={location} className="tag">{location}</span>)}</div></div>
          <div className="border-t border-border px-6 py-6"><div className="eyebrow">Skills</div><div className="mt-3 flex flex-wrap gap-2">{current.skills.map((skill) => <span key={skill} className="tag dark">{skill}</span>)}</div></div>
          <div className="border-t border-border px-6 py-6"><div className="eyebrow">Interests</div><div className="mt-3 flex flex-wrap gap-2">{current.interests.map((interest) => <span key={interest} className="tag">{interest}</span>)}</div></div>
        </section>
        <aside className="space-y-4">
          <div className="soft-panel"><div className="flex items-center gap-2 font-display font-bold"><FileText size={17} className="text-primary" /> ATS-ready summary</div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Third-year B.Tech Information Technology student with hands-on experience across Java, Python, JavaScript, React, Node.js, Express.js, MongoDB, SQL, REST APIs, and Git. Seeking a paid software engineering internship where I can build reliable full-stack and backend systems while contributing to practical product work.</p><button className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"><CopyMark /> Copy summary</button></div>
          <div className="soft-panel"><div className="flex items-center gap-2 font-display font-bold"><Sparkles size={17} className="text-primary" /> Fastest skill lift</div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Add one deployed React + Node project with a clear README, tests, and a live link. It will strengthen your proof for the highest-fit roles.</p><Link href="/opportunities" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">See roles that reward it <ArrowRight size={13} /></Link></div>
          <div className="soft-panel"><div className="flex items-center gap-2 font-display font-bold"><GraduationCap size={17} className="text-primary" /> Application answer bank</div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Your profile is ready to generate tailored answers for “Why this role?”, “Tell us about yourself”, and project deep-dives as you apply.</p></div>
        </aside>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="filter-chip"><span className="text-muted-foreground">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option || `All ${label.toLowerCase()}`}</option>)}</select><ChevronDown size={13} /></label>;
}

function ApplicationRow({ application }: { application: Application }) {
  return <div className="flex items-center gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0"><div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-xs font-bold">{application.company.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{application.company}</div><div className="truncate text-xs text-muted-foreground">{application.role}</div></div><span className="stage-pill">{application.stage}</span></div>;
}

function ApplicationCard({ application, onStageChange }: { application: Application; onStageChange: (stage: string) => void }) {
  return <div className="application-card"><div className="flex items-start justify-between gap-2"><div><div className="font-display font-bold">{application.company}</div><div className="mt-1 text-xs leading-relaxed text-muted-foreground">{application.role}</div></div><BriefcaseBusiness size={15} className="text-muted-foreground" /></div><div className="mt-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">Next: <span className="font-medium text-foreground">{application.nextAction}</span></div><select aria-label={`Move ${application.company}`} className="mt-3 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs" value={application.stage} onChange={(event) => onStageChange(event.target.value)}><option>Saved</option><option>Applied</option><option>Screening</option><option>Interview</option><option>Offer</option></select></div>;
}

function OpportunityDetail({ opportunity, onClose, onApply }: { opportunity: Opportunity; onClose: () => void; onApply: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17201d]/45 p-0 sm:items-center sm:p-6"><div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl"><div className="flex items-start justify-between gap-4"><div><div className="eyebrow">{opportunity.source}</div><h2 className="mt-2 font-display text-2xl font-bold">{opportunity.role}</h2><p className="mt-1 text-sm text-muted-foreground">{opportunity.company} · {opportunity.location}</p></div><button aria-label="Close opportunity detail" onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X size={18} /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="detail-stat"><span>Fit</span><strong>{opportunity.fitScore}%</strong></div><div className="detail-stat"><span>Stipend</span><strong>{opportunity.stipend}</strong></div><div className="detail-stat"><span>Deadline</span><strong>{opportunity.deadline}</strong></div></div><p className="mt-6 text-sm leading-relaxed text-muted-foreground">{opportunity.eligibility}</p><div className="mt-4 flex flex-wrap gap-2">{opportunity.skills.map((skill) => <span className="tag dark" key={skill}>{skill}</span>)}</div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><a href={opportunity.applyUrl} target="_blank" rel="noreferrer" className="primary-button flex-1"><ExternalLink size={16} /> Open official application</a><button onClick={onApply} className="secondary-button"><ListChecks size={16} /> Mark as applied</button></div><p className="mt-4 text-xs text-muted-foreground">{opportunity.note}</p></div></div>;
}

function ProfileField({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (value: string) => void }) {
  return <label className="block"><span className="eyebrow">{label}</span>{editing ? <input className="field mt-2" value={value} onChange={(event) => onChange(event.target.value)} /> : <div className="mt-2 text-sm font-semibold">{value}</div>}</label>;
}

function IndianRupeeMark() { return <span className="font-display text-sm font-bold">₹</span>; }
function CopyMark() { return <span className="grid h-4 w-4 place-items-center rounded border border-current text-[9px]">2</span>; }

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/opportunities" component={Opportunities} /><Route path="/applications" component={Applications} /><Route path="/profile" component={Profile} /><Route><NotFoundInline /></Route></Switch>;
}

function NotFoundInline() {
  const [, navigate] = useLocation();
  return <PageShell><div className="mx-auto max-w-lg py-20 text-center"><CircleAlert className="mx-auto text-primary" size={32} /><h1 className="mt-4 font-display text-3xl font-bold">That page moved.</h1><button className="primary-button mt-6" onClick={() => navigate('/')}>Back to command center</button></div></PageShell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
