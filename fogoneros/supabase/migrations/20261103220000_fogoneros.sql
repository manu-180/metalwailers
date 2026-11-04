-- Fogoneros MW comparte el proyecto ktmbtpuhqqofdkisqseq con otros productos:
-- todo lleva prefijo fg_ y ningún usuario de otra app entra (fg_es_equipo).

create table public.fg_equipo (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  creado timestamptz not null default now()
);

create table public.fg_config (
  id smallint primary key default 1 check (id = 1),
  bot_activo boolean not null default true,
  instancia text not null default 'fogoneros-mw',
  saludo text not null default '',
  audio_path text,
  audio_mime text,
  audio_nombre text,
  wa_estado text not null default 'sin_vincular'
    check (wa_estado in ('sin_vincular', 'conectando', 'conectado', 'desconectado')),
  wa_numero text,
  wa_estado_at timestamptz,
  actualizado timestamptz not null default now()
);

create table public.fg_contexto (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 120),
  contenido text not null default '' check (char_length(contenido) <= 8000),
  orden int not null default 0,
  activo boolean not null default true,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table public.fg_chats (
  id uuid primary key default gen_random_uuid(),
  jid text not null unique,
  lid text unique,
  telefono text,
  nombre text,
  bot_activo boolean not null default true,
  atencion boolean not null default false,
  atencion_motivo text,
  saludo_enviado boolean not null default false,
  origen text,
  no_leidos int not null default 0,
  pendiente boolean not null default false,
  pendiente_desde timestamptz,
  procesando_hasta timestamptz,
  ultimo_at timestamptz,
  ultimo_preview text,
  ultimo_autor text,
  creado timestamptz not null default now()
);

create index fg_chats_ultimo_idx on public.fg_chats (ultimo_at desc nulls last);
create index fg_chats_atencion_idx on public.fg_chats (atencion) where atencion;
create index fg_chats_pendiente_idx on public.fg_chats (pendiente_desde) where pendiente;

create table public.fg_mensajes (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.fg_chats (id) on delete cascade,
  wa_id text unique,
  autor text not null check (autor in ('cliente', 'bot', 'humano')),
  tipo text not null default 'texto'
    check (tipo in ('texto', 'audio', 'imagen', 'documento', 'video', 'sticker', 'otro')),
  texto text,
  transcripcion text,
  media_path text,
  media_mime text,
  media_nombre text,
  estado text not null default 'ok' check (estado in ('ok', 'enviando', 'error')),
  error text,
  creado timestamptz not null default now()
);

create index fg_mensajes_chat_idx on public.fg_mensajes (chat_id, creado desc);
create index fg_mensajes_autor_idx on public.fg_mensajes (autor, creado desc);

create table public.fg_notas (
  id uuid primary key default gen_random_uuid(),
  mensaje_id uuid references public.fg_mensajes (id) on delete set null,
  chat_id uuid references public.fg_chats (id) on delete set null,
  respuesta text not null,
  por_que text not null check (char_length(por_que) between 1 and 1500),
  como text check (char_length(como) <= 2000),
  activa boolean not null default true,
  autor text,
  creado timestamptz not null default now(),
  desactivada timestamptz
);

create index fg_notas_activas_idx on public.fg_notas (creado desc) where activa;
create index fg_notas_chat_idx on public.fg_notas (chat_id);
create index fg_notas_mensaje_idx on public.fg_notas (mensaje_id);

create function public.fg_es_equipo() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.fg_equipo where user_id = (select auth.uid())) $$;

revoke all on function public.fg_es_equipo() from public, anon;
grant execute on function public.fg_es_equipo() to authenticated;

-- El resumen del chat vive en la base: lo escriben el webhook, el bot y el panel,
-- y ninguno se puede olvidar de actualizarlo. `pendiente` es lo que despierta al
-- cron si la función que iba a responder murió a mitad de camino.
create function public.fg_mensaje_insertado() returns trigger
language plpgsql set search_path = ''
as $$
begin
  update public.fg_chats set
    ultimo_at = new.creado,
    ultimo_autor = new.autor,
    ultimo_preview = left(coalesce(nullif(new.texto, ''), new.transcripcion, case new.tipo
      when 'audio' then 'Audio' when 'imagen' then 'Foto' when 'documento' then 'Documento'
      when 'video' then 'Video' when 'sticker' then 'Sticker' else 'Mensaje' end), 160),
    no_leidos = case when new.autor = 'cliente' then no_leidos + 1 else no_leidos end,
    pendiente = case when new.autor = 'cliente' then true else pendiente end,
    pendiente_desde = case when new.autor = 'cliente' then coalesce(pendiente_desde, new.creado)
      else pendiente_desde end
  where id = new.chat_id;
  return new;
end $$;

create trigger fg_mensaje_insertado after insert on public.fg_mensajes
  for each row execute function public.fg_mensaje_insertado();

-- Un solo turno del bot por chat: dos mensajes seguidos, o el cron y el webhook a
-- la vez, no pueden contestar dos veces.
create function public.fg_tomar_turno(p_chat uuid, p_segundos int default 90) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare tomado boolean;
begin
  update public.fg_chats
     set procesando_hasta = now() + make_interval(secs => p_segundos)
   where id = p_chat and (procesando_hasta is null or procesando_hasta < now())
  returning true into tomado;
  return coalesce(tomado, false);
end $$;

revoke all on function public.fg_tomar_turno(uuid, int) from public, anon, authenticated;
grant execute on function public.fg_tomar_turno(uuid, int) to service_role;

create function public.fg_metricas() returns jsonb
language sql stable security invoker set search_path = ''
as $$
  with hoy as (
    select (now() at time zone 'America/Argentina/Buenos_Aires')::date as d
  ), dias as (
    select generate_series((select d from hoy) - 13, (select d from hoy), interval '1 day')::date as d
  ), porDia as (
    select (m.creado at time zone 'America/Argentina/Buenos_Aires')::date as d,
           count(distinct m.chat_id) filter (where m.autor = 'cliente') as charlas,
           count(*) filter (where m.autor = 'bot') as respuestas
      from public.fg_mensajes m
     where m.creado >= now() - interval '15 days'
     group by 1
  )
  select jsonb_build_object(
    'charlas_hoy', coalesce((select charlas from porDia, hoy where porDia.d = hoy.d), 0),
    'charlas_7d', (select count(distinct chat_id) from public.fg_mensajes
                    where autor = 'cliente' and creado >= now() - interval '7 days'),
    'respuestas_7d', (select count(*) from public.fg_mensajes
                       where autor = 'bot' and creado >= now() - interval '7 days'),
    'contactos', (select count(*) from public.fg_chats),
    'atencion', (select count(*) from public.fg_chats where atencion),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object(
                   'dia', dias.d, 'charlas', coalesce(p.charlas, 0), 'respuestas', coalesce(p.respuestas, 0))
                   order by dias.d), '[]'::jsonb)
                  from dias left join porDia p on p.d = dias.d)
  );
$$;

revoke all on function public.fg_metricas() from public, anon;
grant execute on function public.fg_metricas() to authenticated, service_role;

alter table public.fg_equipo enable row level security;
alter table public.fg_config enable row level security;
alter table public.fg_contexto enable row level security;
alter table public.fg_chats enable row level security;
alter table public.fg_mensajes enable row level security;
alter table public.fg_notas enable row level security;
alter table public.fg_equipo force row level security;
alter table public.fg_config force row level security;
alter table public.fg_contexto force row level security;
alter table public.fg_chats force row level security;
alter table public.fg_mensajes force row level security;
alter table public.fg_notas force row level security;

revoke all on public.fg_equipo, public.fg_config, public.fg_contexto, public.fg_chats,
  public.fg_mensajes, public.fg_notas from anon;

create policy fg_equipo_propio on public.fg_equipo for select to authenticated
  using (user_id = (select auth.uid()));

create policy fg_config_lee on public.fg_config for select to authenticated
  using ((select public.fg_es_equipo()));
create policy fg_config_cambia on public.fg_config for update to authenticated
  using ((select public.fg_es_equipo())) with check ((select public.fg_es_equipo()));

create policy fg_contexto_todo on public.fg_contexto for all to authenticated
  using ((select public.fg_es_equipo())) with check ((select public.fg_es_equipo()));

create policy fg_chats_lee on public.fg_chats for select to authenticated
  using ((select public.fg_es_equipo()));
create policy fg_chats_cambia on public.fg_chats for update to authenticated
  using ((select public.fg_es_equipo())) with check ((select public.fg_es_equipo()));

create policy fg_mensajes_lee on public.fg_mensajes for select to authenticated
  using ((select public.fg_es_equipo()));

create policy fg_notas_todo on public.fg_notas for all to authenticated
  using ((select public.fg_es_equipo())) with check ((select public.fg_es_equipo()));

alter publication supabase_realtime add table public.fg_chats, public.fg_mensajes, public.fg_config;

insert into storage.buckets (id, name, public, file_size_limit)
values ('fogoneros', 'fogoneros', false, 26214400);

insert into public.fg_config (id, saludo) values (1,
  'Hola {nombre}, como estas? Gracias por comunicarte con Fogoneros MW. Te mando un audio cortito con lo importante a tener en cuenta sobre los fogoneros y despues me contas que estas buscando.');

insert into public.fg_contexto (titulo, contenido, orden, activo) values
('Qué son nuestros fogoneros',
 'Están hechos íntegramente con chapa de 3,2 milímetros. Pintura de alta temperatura, hasta 650 grados. Tienen 3 años de garantía. Doble altura de parrilla. La parrilla está pensada para quemarla directamente en el fuego: no se deforma ni se desuelda.',
 10, true),
('Cómo vendemos',
 'Los clientes llegan por la publicidad de Instagram. No tenemos página web. El producto se retira o se organiza la entrega. Los envíos a zona norte se coordinan con Claudia.',
 20, true),
('Modelos, medidas y precios', '', 30, false),
('Formas de pago', '', 40, false);
