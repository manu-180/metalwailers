import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearDoble, type Doble } from '@/lib/bot/__tests__/doble-supabase';

const h = vi.hoisted(() => ({ doble: null as unknown, bajarMedia: vi.fn(), transcribirAudio: vi.fn(), upload: vi.fn() }));

vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: () => h.doble }));
vi.mock('@/lib/evolution', () => ({ bajarMedia: h.bajarMedia, detalleError: () => ({ nombre: 'x' }) }));
vi.mock('@/lib/transcribir', () => ({ transcribirAudio: h.transcribirAudio }));

import { procesarMedia, repararMedia, tipoParaBucket } from '../media';

let d: Doble;
const origen = { crudo: {}, texto: null, mime: 'audio/ogg', nombreArchivo: null, tamano: null };
const fila = (over = {}) => d.mensaje('chat-1', { tipo: 'audio', estado: 'enviando', ...over });
const destino = (f: Record<string, unknown>) => ({ id: f.id as string, chat_id: 'chat-1', tipo: f.tipo as 'audio' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  d = crearDoble();
  h.doble = d;
  d.chat();
  d.storage = { from: () => ({ upload: h.upload }) } as never;
  h.upload.mockResolvedValue({ error: null });
  h.transcribirAudio.mockResolvedValue('hola');
  h.bajarMedia.mockResolvedValue({ base64: Buffer.from('audio').toString('base64'), mimetype: 'audio/ogg; codecs=opus' });
});

describe('tipoParaBucket', () => {
  it.each([
    ['audio/ogg; codecs=opus', 'audio/ogg'],
    ['image/jpeg', 'image/jpeg'],
    ['video/mp4', 'video/mp4'],
    ['application/pdf', 'application/pdf'],
  ])('%s se sirve como %s', (entrada, esperado) => {
    expect(tipoParaBucket(entrada)).toBe(esperado);
  });

  it.each(['text/html', 'image/svg+xml', 'application/zip', 'application/vnd.ms-excel', ''])('%s queda como binario', (entrada) => {
    expect(tipoParaBucket(entrada)).toBe('application/octet-stream');
  });
});

describe('procesarMedia', () => {
  it('sube con el tipo normalizado y conserva el real en la fila', async () => {
    const f = fila({ tipo: 'documento' });
    h.bajarMedia.mockResolvedValue({ base64: 'QUJD', mimetype: 'text/html' });
    await procesarMedia(destino(f), origen);
    expect(h.upload.mock.calls[0][2].contentType).toBe('application/octet-stream');
    expect(f).toMatchObject({ media_mime: 'text/html', estado: 'ok' });
  });

  it('un audio de más de 16 MB no va a Groq y le avisa a Claudia', async () => {
    const f = fila();
    h.bajarMedia.mockResolvedValue({ base64: Buffer.alloc(16 * 1024 * 1024 + 1).toString('base64'), mimetype: 'audio/ogg' });
    await procesarMedia(destino(f), origen);
    expect(h.transcribirAudio).not.toHaveBeenCalled();
    expect(f).toMatchObject({ estado: 'ok', error: 'Audio demasiado largo para transcribir' });
    expect(d.tablas.fg_chats[0].atencion).toBe(true);
  });

  it('si la descarga falla el mensaje queda con aviso y no colgado', async () => {
    const f = fila();
    h.bajarMedia.mockRejectedValue(new Error('x'));
    await procesarMedia(destino(f), origen);
    expect(f).toMatchObject({ estado: 'ok', texto: 'No se pudo descargar el audio' });
  });

  it('el aviso no pisa el pie que escribió el cliente', async () => {
    const f = fila({ tipo: 'imagen', texto: 'mira' });
    h.bajarMedia.mockResolvedValue(null);
    await procesarMedia(destino(f), { ...origen, texto: 'mira' });
    expect(f).toMatchObject({ texto: 'mira', error: 'No se pudo descargar la foto' });
  });
});

describe('repararMedia', () => {
  const colgada = (f: Record<string, unknown>) => ({ id: f.id as string, chat_id: 'chat-1', wa_id: f.wa_id as string | null, tipo: 'audio' as const, texto: null, media_mime: null, media_nombre: null });

  it('le pide el archivo a Evolution por la key', async () => {
    const f = fila({ wa_id: 'W1' });
    await repararMedia(colgada(f));
    expect(h.bajarMedia.mock.calls[0][0]).toEqual({ key: { id: 'W1' } });
    expect(f.estado).toBe('ok');
  });

  it('si no se puede la deja ok con aviso', async () => {
    const f = fila({ wa_id: 'W1' });
    h.bajarMedia.mockResolvedValue(null);
    await repararMedia(colgada(f));
    expect(f).toMatchObject({ estado: 'ok', error: 'No se pudo descargar el audio' });
  });

  it('sin wa_id no llama a Evolution', async () => {
    const f = fila({ wa_id: null });
    await repararMedia(colgada(f));
    expect(h.bajarMedia).not.toHaveBeenCalled();
    expect(f.estado).toBe('ok');
  });
});
