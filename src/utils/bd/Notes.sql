-- Table NOTES
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references public.eleves(id) on delete cascade,
  matiere_id uuid not null references public.matieres(id) on delete restrict,
  trimestre smallint not null check (trimestre in (1,2,3)),
  note numeric(5,2) not null check (note >= 0 and note <= 100),
  observation text,
  decision_de_fin_annee text,
  date_ajout date not null default (now()::date),
  annee_scolaire_id uuid not null references public.annees_scolaires(id) on delete restrict,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unicité logique: une note par (élève, matière, trimestre, année) quand non supprimée
create unique index if not exists uq_notes_eleve_matiere_tri_annee
on public.notes(eleve_id, matiere_id, trimestre, annee_scolaire_id)
where deleted = false;

-- Index utiles pour la consultation/filtrage
create index if not exists idx_notes_eleve on public.notes(eleve_id) where deleted = false;
create index if not exists idx_notes_matiere on public.notes(matiere_id) where deleted = false;
create index if not exists idx_notes_tri on public.notes(trimestre) where deleted = false;
create index if not exists idx_notes_annee on public.notes(annee_scolaire_id) where deleted = false;

-- Trigger updated_at (optionnel)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_notes_set_updated_at') then
    create trigger trg_notes_set_updated_at
    before update on public.notes
    for each row execute function public.set_updated_at();
  end if;
end $$;