-- Dueño de la capa (nullable para no romper filas existentes)
alter table capas
add column if not exists user_id uuid
references auth.users(id) on delete set null
default auth.uid();

-- Relación zona <-> capa
create table if not exists zona_capas (
  zona_id uuid not null references zonas(id) on delete cascade,
  capa_id uuid not null references capas(id) on delete cascade,
  total_features integer default 0,
  primary key (zona_id, capa_id)
);

alter table zona_capas enable row level security;

create policy "zona_capas select propias" on zona_capas
for select using (
  exists (select 1 from zonas z where z.id = zona_id and z.user_id = auth.uid())
);

create policy "zona_capas insert propias" on zona_capas
for insert with check (
  exists (select 1 from zonas z where z.id = zona_id and z.user_id = auth.uid())
);

create policy "zona_capas delete propias" on zona_capas
for delete using (
  exists (select 1 from zonas z where z.id = zona_id and z.user_id = auth.uid())
);