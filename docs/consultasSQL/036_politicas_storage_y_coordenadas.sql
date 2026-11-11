-- 036a: Storage. Quita la subida y la lectura públicas del bucket archivos-capas
-- (la aplicación no usa el bucket).
drop policy "Subida publica de archivos" on storage.objects;
drop policy "Lectura publica de archivos" on storage.objects;

-- 036b: coordenadas_capturadas. Las tres operaciones pasan de "público" a "usuarios con sesión".
drop policy "Borrado publico de coordenadas" on public.coordenadas_capturadas;
drop policy "Insercion publica de coordenadas" on public.coordenadas_capturadas;
drop policy "Lectura publica de coordenadas" on public.coordenadas_capturadas;

create policy coordenadas_lectura_autenticada
  on public.coordenadas_capturadas for select to authenticated using (true);

create policy coordenadas_insercion_autenticada
  on public.coordenadas_capturadas for insert to authenticated with check (true);

create policy coordenadas_borrado_autenticado
  on public.coordenadas_capturadas for delete to authenticated using (true);

  