-- 025: tabla de usos del suelo desde fuentes OFICIALES. Tabla NUEVA: no toca ninguna existente.

create table if not exists public.usos_suelo (
  id bigserial primary key,
  municipio text not null,
  fuente text not null,
  capa_origen text not null,
  acuerdo text,
  fecha_adopcion date,
  fecha_actualizacion date,
  area_general text,
  subcategoria text,
  cod_cat_uso integer,
  cod_subcat_uso integer,
  atributos jsonb,
  geom geometry(MultiPolygon, 4326) not null,
  creado_en timestamptz not null default now()
);

create index if not exists usos_suelo_geom_idx on public.usos_suelo using gist (geom);
create index if not exists usos_suelo_municipio_area_idx on public.usos_suelo (municipio, area_general);

-- Solo lectura pública: la web puede consultar, pero nadie puede insertar ni modificar desde el navegador
alter table public.usos_suelo enable row level security;
create policy "Lectura publica de usos_suelo" on public.usos_suelo for select using (true);

-- REVERSA (por si algo sale mal):
-- drop table public.usos_suelo;