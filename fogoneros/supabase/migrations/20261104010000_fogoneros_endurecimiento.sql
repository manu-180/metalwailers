-- Hasta qué mensaje del cliente ya se hizo cargo el bot o Claudia. La fila del bot se
-- inserta antes del delay de Evolution, así que mirar quién habló último pierde lo
-- que el cliente escribe mientras sale el saludo.
alter table public.fg_chats add column atendido_hasta timestamptz;
update public.fg_chats set atendido_hasta = ultimo_at where not pendiente;

-- Distinto de wa_estado_at, que también cambia en cada reconexión: sólo después de un
-- QR nuevo lo atrasado es historial y no mensajes de clientes que esperaron.
alter table public.fg_config add column vinculado_at timestamptz;
update public.fg_config set vinculado_at = wa_estado_at where wa_estado = 'conectado';

-- Topes de gasto. No se cuenta por filas del bot: un turno puede mandar varias partes o
-- quedarse callado, y cada llamada al modelo se paga igual.
create table public.fg_turnos_llm (
  id bigint generated always as identity primary key,
  chat_id uuid references public.fg_chats (id) on delete set null,
  creado timestamptz not null default now()
);

create index fg_turnos_llm_creado_idx on public.fg_turnos_llm (creado desc);
create index fg_turnos_llm_chat_idx on public.fg_turnos_llm (chat_id, creado desc);

alter table public.fg_turnos_llm enable row level security;
alter table public.fg_turnos_llm force row level security;
revoke all on public.fg_turnos_llm from anon, authenticated;

revoke truncate, trigger, references on public.fg_equipo, public.fg_config, public.fg_contexto,
  public.fg_chats, public.fg_mensajes, public.fg_notas from authenticated;

-- Con media.ts guardando como application/octet-stream todo documento que no sea PDF,
-- un .docx o un .zip entran igual y un HTML no queda servible como HTML.
update storage.buckets
   set allowed_mime_types = array['audio/*', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/*',
                                  'application/pdf', 'application/octet-stream']
 where id = 'fogoneros';
