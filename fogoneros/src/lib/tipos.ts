export type Autor = 'cliente' | 'bot' | 'humano';
export type TipoMensaje = 'texto' | 'audio' | 'imagen' | 'documento' | 'video' | 'sticker' | 'otro';
export type EstadoMensaje = 'ok' | 'enviando' | 'error';
export type EstadoWhatsapp = 'sin_vincular' | 'conectando' | 'conectado' | 'desconectado';

export type Config = {
  id: number;
  bot_activo: boolean;
  instancia: string;
  saludo: string;
  audio_path: string | null;
  audio_mime: string | null;
  audio_nombre: string | null;
  wa_estado: EstadoWhatsapp;
  wa_numero: string | null;
  wa_estado_at: string | null;
  actualizado: string;
};

export type EntradaContexto = {
  id: string;
  titulo: string;
  contenido: string;
  orden: number;
  activo: boolean;
  creado: string;
  actualizado: string;
};

export type Chat = {
  id: string;
  jid: string;
  lid: string | null;
  telefono: string | null;
  nombre: string | null;
  bot_activo: boolean;
  atencion: boolean;
  atencion_motivo: string | null;
  saludo_enviado: boolean;
  origen: string | null;
  no_leidos: number;
  pendiente: boolean;
  pendiente_desde: string | null;
  procesando_hasta: string | null;
  ultimo_at: string | null;
  ultimo_preview: string | null;
  ultimo_autor: Autor | null;
  creado: string;
};

export type Mensaje = {
  id: string;
  chat_id: string;
  wa_id: string | null;
  autor: Autor;
  tipo: TipoMensaje;
  texto: string | null;
  transcripcion: string | null;
  media_path: string | null;
  media_mime: string | null;
  media_nombre: string | null;
  estado: EstadoMensaje;
  error: string | null;
  creado: string;
};

export type Nota = {
  id: string;
  mensaje_id: string | null;
  chat_id: string | null;
  respuesta: string;
  por_que: string;
  como: string | null;
  activa: boolean;
  autor: string | null;
  creado: string;
  desactivada: string | null;
};

export type Metricas = {
  charlas_hoy: number;
  charlas_7d: number;
  respuestas_7d: number;
  contactos: number;
  atencion: number;
  por_dia: { dia: string; charlas: number; respuestas: number }[];
};

export const BUCKET = 'fogoneros';
