const t = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
const chat = (id: string, nombre: string | null, prev: string, h: number, o = {}) => ({ id, telefono: '5491134272488', nombre, bot_activo: true, atencion: false, atencion_motivo: null, no_leidos: 0, ultimo_at: t(h), ultimo_preview: prev, ultimo_autor: 'cliente' as const, ...o });
export const chats = [
  chat('a', 'Marcela Gutierrez', 'Hola quería saber si hacen envíos a zona norte y cuánto sale el fogonero grande con parrilla doble', 0.2, { no_leidos: 2, atencion: true, atencion_motivo: 'Pide coordinar un envío a zona norte' }),
  chat('b', null, 'Audio', 3, { ultimo_autor: 'bot' }),
  chat('c', 'Jorge', 'Dale gracias', 30),
  chat('d', 'Hernán Rodríguez Peña', 'Lo paso a buscar el sábado', 200, { ultimo_autor: 'humano' }),
];
const m = (id: string, autor: 'cliente' | 'bot' | 'humano', texto: string | null, h: number, o = {}) => ({ id, chat_id: 'a', autor, tipo: 'texto' as const, texto, transcripcion: null, media_path: null, media_mime: null, media_nombre: null, estado: 'ok' as const, creado: t(h), ...o });
export const mensajes = [
  m('1', 'cliente', 'Hola! vi la publicidad de Instagram', 27),
  m('2', 'bot', 'Hola Marcela, como estas? Gracias por comunicarte con Fogoneros MW. Te mando un audio cortito con lo importante.', 26.9),
  m('3', 'bot', null, 26.8, { tipo: 'audio', media_path: 'x' }),
  m('4', 'cliente', null, 1, { tipo: 'audio', media_path: 'y', transcripcion: 'Quería saber si hacen envíos a zona norte y cuánto sale el grande' }),
  m('5', 'bot', 'Los envíos a zona norte los coordina Claudia. Te paso con ella así te confirma el costo.', 0.9),
  m('6', 'humano', 'Hola Marcela! Te lo llevo el jueves.', 0.5),
  m('7', 'humano', 'Te paso el link de pago', 0.4, { estado: 'error' }),
];
export const config = { id: 1, bot_activo: true, saludo: 'Hola {nombre}, como estas?', audio_path: null, audio_mime: null, audio_nombre: null, wa_estado: 'sin_vincular' as const, wa_numero: null };
const contexto = [
  { id: '1', titulo: 'Qué son nuestros fogoneros', contenido: 'Están hechos íntegramente con chapa de 3,2 milímetros. Pintura de alta temperatura, hasta 650 grados.', orden: 10, activo: true },
  { id: '2', titulo: 'Cómo vendemos', contenido: 'Los clientes llegan por la publicidad de Instagram.', orden: 20, activo: true },
  { id: '3', titulo: 'Modelos, medidas y precios', contenido: '', orden: 30, activo: false },
  { id: '4', titulo: 'Formas de pago', contenido: '', orden: 40, activo: false },
];
export const notas = [{ id: 'n', mensaje_id: '5', chat_id: 'a', respuesta: 'Los envíos a zona norte los coordina Claudia.', por_que: 'Sonó cortante, primero tiene que preguntar la localidad', como: 'Decime en qué localidad estás y te paso con Claudia', activa: true, autor: 'Santi', creado: t(3) }];
const dias = Array.from({ length: 14 }, (_, i) => ({ dia: new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10), charlas: [2, 5, 3, 8, 0, 4, 6, 9, 12, 7, 3, 5, 14, 6][i], respuestas: 3 }));
