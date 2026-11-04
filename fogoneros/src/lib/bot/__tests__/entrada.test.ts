import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearDoble, type Doble } from './doble-supabase';
import type { MensajeEntrante } from '../parseo';

const h = vi.hoisted(() => ({ doble: null as unknown, procesarMedia: vi.fn(), programarTurno: vi.fn() }));

vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: () => h.doble }));
vi.mock('@/lib/media', () => ({
  esMedia: (t: string) => t !== 'texto' && t !== 'otro',
  procesarMedia: h.procesarMedia,
}));
vi.mock('../turno', () => ({ programarTurno: h.programarTurno }));

import { ejecutarTarea, registrarEntrante } from '../entrada';

let d: Doble;

function entrante(over: Partial<MensajeEntrante> = {}): MensajeEntrante {
  return {
    waId: 'W1',
    fromMe: false,
    jid: '5491155550000@s.whatsapp.net',
    lid: null,
    telefono: '5491155550000',
    nombre: 'Juan',
    tipo: 'texto',
    texto: 'hola',
    mime: null,
    nombreArchivo: null,
    tamano: null,
    origen: null,
    atrasado: false,
    crudo: {},
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  d = crearDoble();
  h.doble = d;
});

describe('mensajes del cliente', () => {
  it('guarda antes de responder y deja el turno para después', async () => {
    const tarea = await registrarEntrante(entrante(), 1000);
    expect(d.tablas.fg_mensajes).toHaveLength(1);
    expect(tarea?.tipo).toBe('cliente');
    await ejecutarTarea(tarea!);
    expect(h.programarTurno).toHaveBeenCalledWith(d.tablas.fg_chats[0].id, d.tablas.fg_mensajes[0].id, 1000);
  });

  it('el mismo wa_id no se guarda dos veces', async () => {
    await registrarEntrante(entrante(), 0);
    expect(await registrarEntrante(entrante(), 0)).toBeNull();
    expect(d.tablas.fg_mensajes).toHaveLength(1);
  });

  it('un lid conocido no duplica el chat', async () => {
    await registrarEntrante(entrante({ lid: '111@lid' }), 0);
    await registrarEntrante(entrante({ waId: 'W2', jid: '111@lid', lid: '111@lid', telefono: null }), 0);
    expect(d.tablas.fg_chats).toHaveLength(1);
  });

  it('la media queda en enviando hasta procesarse y después va el turno', async () => {
    const tarea = await registrarEntrante(entrante({ tipo: 'audio', texto: null }), 0);
    expect(d.tablas.fg_mensajes[0].estado).toBe('enviando');
    await ejecutarTarea(tarea!);
    expect(h.procesarMedia).toHaveBeenCalledTimes(1);
    expect(h.programarTurno).toHaveBeenCalledTimes(1);
  });
});

describe('fromMe', () => {
  it('con wa_id desconocido apaga el bot antes de devolver y sin esperar', async () => {
    const chat = d.chat({ atencion: true });
    await registrarEntrante(entrante({ fromMe: true, nombre: null, texto: 'te llamo' }), 0);
    expect(chat).toMatchObject({ bot_activo: false, atencion: false, pendiente: false });
    expect(chat.atendido_hasta).not.toBeNull();
    expect(d.tablas.fg_mensajes[0]).toMatchObject({ autor: 'humano', texto: 'te llamo' });
  });

  it('aunque el texto coincida con uno del bot es Claudia: sólo cuenta el wa_id', async () => {
    const chat = d.chat();
    d.mensaje(chat.id as string, { autor: 'bot', texto: 'hola', wa_id: null });
    await registrarEntrante(entrante({ fromMe: true, nombre: null }), 0);
    expect(chat.bot_activo).toBe(false);
  });

  it('con wa_id propio no hace nada', async () => {
    const chat = d.chat();
    d.mensaje(chat.id as string, { autor: 'bot', texto: 'hola', wa_id: 'W1' });
    expect(await registrarEntrante(entrante({ fromMe: true, nombre: null }), 0)).toBeNull();
    expect(chat.bot_activo).toBe(true);
  });

  it('si no puede apagar el bot, tira para que Evolution reintente', async () => {
    d.chat();
    d.fallas.fg_chats = { update: '500' };
    await expect(registrarEntrante(entrante({ fromMe: true, nombre: null }), 0)).rejects.toThrow();
    expect(d.tablas.fg_mensajes).toHaveLength(0);
  });

  it('crea el chat apagado si Claudia escribió primero', async () => {
    await registrarEntrante(entrante({ fromMe: true, nombre: null }), 0);
    expect(d.tablas.fg_chats[0].bot_activo).toBe(false);
  });

  it('su foto se procesa y no dispara turno', async () => {
    const tarea = await registrarEntrante(entrante({ fromMe: true, nombre: null, tipo: 'imagen', texto: null }), 0);
    await ejecutarTarea(tarea!);
    expect(h.procesarMedia).toHaveBeenCalledTimes(1);
    expect(h.programarTurno).not.toHaveBeenCalled();
  });
});

describe('mensajes atrasados', () => {
  it('los guarda para Claudia sin disparar turno', async () => {
    const tarea = await registrarEntrante(entrante({ atrasado: true }), 0);
    expect(d.tablas.fg_mensajes).toHaveLength(1);
    expect(d.tablas.fg_chats[0]).toMatchObject({
      atencion: true,
      atencion_motivo: 'Llegó mientras el WhatsApp estaba cortado',
      pendiente: false,
    });
    expect(tarea).toBeNull();
    expect(h.programarTurno).not.toHaveBeenCalled();
  });

  it('no le pisa el pendiente a un chat que ya esperaba respuesta', async () => {
    const chat = d.chat();
    d.mensaje(chat.id as string, { texto: 'previo' });
    await registrarEntrante(entrante({ atrasado: true }), 0);
    expect(chat.pendiente).toBe(true);
  });

  it('procesa la media pero no dispara turno', async () => {
    const tarea = await registrarEntrante(entrante({ atrasado: true, tipo: 'audio', texto: null }), 0);
    await ejecutarTarea(tarea!);
    expect(h.procesarMedia).toHaveBeenCalledTimes(1);
    expect(h.programarTurno).not.toHaveBeenCalled();
  });

  it('en los 5 minutos después de vincular es historial y se ignora', async () => {
    d.config().vinculado_at = new Date(Date.now() - 60_000).toISOString();
    expect(await registrarEntrante(entrante({ atrasado: true }), 0)).toBeNull();
    expect(d.tablas.fg_mensajes).toHaveLength(0);
    expect(d.tablas.fg_chats).toHaveLength(0);
  });

  it('mientras se está vinculando también se ignora', async () => {
    d.config().wa_estado = 'conectando';
    await registrarEntrante(entrante({ atrasado: true }), 0);
    expect(d.tablas.fg_mensajes).toHaveLength(0);
  });

  it('un fromMe atrasado no apaga el bot', async () => {
    const chat = d.chat();
    await registrarEntrante(entrante({ fromMe: true, nombre: null, atrasado: true }), 0);
    expect(chat.bot_activo).toBe(true);
  });
});
