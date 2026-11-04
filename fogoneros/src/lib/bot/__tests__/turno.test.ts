import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearDoble, type Doble } from './doble-supabase';

const h = vi.hoisted(() => ({
  doble: null as unknown,
  enviarTexto: vi.fn(),
  enviarAudio: vi.fn(),
  pedirRespuesta: vi.fn(),
  esErrorPermanente: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: () => h.doble }));
vi.mock('@/lib/evolution', async (original) => ({
  ...(await original<typeof import('@/lib/evolution')>()),
  enviarTexto: h.enviarTexto,
  enviarAudio: h.enviarAudio,
}));
vi.mock('@/lib/anthropic', () => ({ pedirRespuesta: h.pedirRespuesta, esErrorPermanente: h.esErrorPermanente }));
vi.mock('@/lib/media', () => ({
  leerDelBucket: async () => Buffer.from('audio'),
  leerAdjunto: async () => null,
}));

import { procesarChat } from '../turno';

let d: Doble;
const texto = (t: string) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: t }] });
const pasar = (t: string | null, motivo: string) => ({
  stop_reason: 'tool_use',
  content: [...(t ? [{ type: 'text', text: t }] : []), { type: 'tool_use', name: 'pasar_a_claudia', input: { motivo } }],
});
const mensajesDelModelo = (llamada = 0) => h.pedirRespuesta.mock.calls[llamada][0].messages as { role: string; content: { text?: string }[] }[];

beforeEach(() => {
  vi.clearAllMocks();
  d = crearDoble();
  h.doble = d;
  let n = 0;
  h.enviarTexto.mockImplementation(async () => `wa-${++n}`);
  h.enviarAudio.mockImplementation(async () => `wa-a${++n}`);
  h.pedirRespuesta.mockResolvedValue(texto('Para donde lo queres?'));
  h.esErrorPermanente.mockReturnValue(false);
});

describe('primer contacto', () => {
  it('manda saludo y audio una sola vez y le avisa al modelo', async () => {
    const chat = d.chat();
    d.mensaje(chat.id as string, { texto: 'cuanto pesa?' });
    await procesarChat(chat.id as string);

    expect(h.enviarTexto.mock.calls[0][1]).toBe('Hola Juan, como estas?');
    expect(h.enviarAudio).toHaveBeenCalledTimes(1);
    const { system } = h.pedirRespuesta.mock.calls[0][0];
    expect(system.at(-1).text).toContain('Hola Juan, como estas?');
    expect(chat.saludo_enviado).toBe(true);
  });

  it('un mensaje que entra durante el saludo no se pierde', async () => {
    const chat = d.chat();
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.enviarTexto.mockImplementationOnce(async () => {
      d.mensaje(chat.id as string, { texto: 'quiero uno grande' });
      return 'wa-saludo';
    });
    await procesarChat(chat.id as string);

    const ultimo = mensajesDelModelo().at(-1)!;
    expect(ultimo.role).toBe('user');
    expect(ultimo.content.map((b) => b.text)).toEqual(['hola', 'quiero uno grande']);
  });

  it('si Claude falla después del saludo, el reintento responde y no vuelve a saludar', async () => {
    const chat = d.chat();
    d.mensaje(chat.id as string, { texto: 'cuanto pesa?' });
    h.pedirRespuesta.mockRejectedValueOnce(new Error('caido'));
    await procesarChat(chat.id as string);
    expect(chat.pendiente).toBe(true);

    await procesarChat(chat.id as string);
    expect(h.pedirRespuesta).toHaveBeenCalledTimes(2);
    expect(h.enviarTexto.mock.calls.filter((c) => c[1].startsWith('Hola'))).toHaveLength(1);
    expect(h.enviarAudio).toHaveBeenCalledTimes(1);
    expect(h.pedirRespuesta.mock.calls[1][0].system.at(-1).text).toContain('Hola Juan');
    expect(chat.pendiente).toBe(false);
  });

  it('si la función murió entre reclamar el saludo y enviarlo, el reintento lo manda', async () => {
    const chat = d.chat({ saludo_enviado: true });
    d.mensaje(chat.id as string, { texto: 'hola' });
    await procesarChat(chat.id as string);
    expect(h.enviarTexto.mock.calls[0][1]).toBe('Hola Juan, como estas?');
    expect(h.enviarAudio).toHaveBeenCalledTimes(1);
  });

  it('si murió después del texto, sólo falta el audio', async () => {
    const chat = d.chat({ saludo_enviado: true });
    d.mensaje(chat.id as string, { texto: 'hola' });
    d.mensaje(chat.id as string, { autor: 'bot', texto: 'Hola Juan, como estas?', estado: 'enviando' });
    await procesarChat(chat.id as string);
    expect(h.enviarTexto.mock.calls.filter((c) => c[1].startsWith('Hola'))).toHaveLength(0);
    expect(h.enviarAudio).toHaveBeenCalledTimes(1);
  });

  it('si Claudia entra entre el saludo y el audio, el audio no sale', async () => {
    const chat = d.chat();
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.enviarTexto.mockImplementationOnce(async () => {
      chat.bot_activo = false;
      return 'wa-saludo';
    });
    await procesarChat(chat.id as string);
    expect(h.enviarAudio).not.toHaveBeenCalled();
    expect(h.pedirRespuesta).not.toHaveBeenCalled();
    expect(chat.atencion).toBe(false);
  });
});

describe('notas', () => {
  it('al modelo le llega el porqué, nunca la respuesta marcada', async () => {
    d.tablas.fg_notas.push({ activa: true, respuesta: 'TEXTO DE OTRO CLIENTE', por_que: 'fue seco', como: 'mas calido', creado: '2026-01-01T00:00:00Z' });
    const chat = d.chat();
    d.mensaje(chat.id as string, { texto: 'hola' });
    await procesarChat(chat.id as string);
    const system = JSON.stringify(h.pedirRespuesta.mock.calls[0][0].system);
    expect(system).toContain('fue seco');
    expect(system).not.toContain('TEXTO DE OTRO CLIENTE');
  });
});

describe('qué se considera atendido', () => {
  const yaSaludado = () => d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });

  it('no llama al modelo si no hay nada sin atender', async () => {
    const chat = yaSaludado();
    chat.pendiente = true;
    await procesarChat(chat.id as string);
    expect(h.pedirRespuesta).not.toHaveBeenCalled();
    expect(chat.pendiente).toBe(false);
  });

  it('un cliente que escribe después de una fila del bot en enviando cuenta como sin atender', async () => {
    const chat = yaSaludado();
    d.mensaje(chat.id as string, { autor: 'bot', texto: 'dale', estado: 'enviando' });
    d.mensaje(chat.id as string, { texto: 'genial' });
    await procesarChat(chat.id as string);
    expect(h.pedirRespuesta).toHaveBeenCalledTimes(1);
  });

  it('lo que el cliente escribe entre partes queda para otro turno', async () => {
    const chat = yaSaludado();
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.pedirRespuesta.mockResolvedValueOnce(texto('uno\n\ndos'));
    h.enviarTexto.mockImplementationOnce(async () => {
      d.mensaje(chat.id as string, { texto: 'y envian?' });
      return 'wa-1';
    });
    await procesarChat(chat.id as string);
    expect(h.pedirRespuesta).toHaveBeenCalledTimes(2);
    const ultimo = mensajesDelModelo(1).at(-1)!;
    expect(ultimo.role).toBe('user');
    expect(ultimo.content.at(-1)!.text).toBe('y envian?');
  });

  it('descarta la respuesta vieja si entró algo mientras pensaba', async () => {
    const chat = yaSaludado();
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.pedirRespuesta.mockImplementationOnce(async () => {
      d.mensaje(chat.id as string, { texto: 'otra cosa' });
      return texto('respuesta vieja');
    });
    await procesarChat(chat.id as string);
    expect(h.enviarTexto.mock.calls.map((c) => c[1])).toEqual(['Para donde lo queres?']);
  });

  it('una falla en el medio de las partes no repite lo ya enviado', async () => {
    const chat = yaSaludado();
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.pedirRespuesta.mockResolvedValueOnce(texto('uno\n\ndos'));
    h.enviarTexto.mockResolvedValueOnce('wa-1').mockRejectedValueOnce(new Error('caido'));
    await procesarChat(chat.id as string);
    expect(chat.atencion).toBe(true);
    await procesarChat(chat.id as string);
    expect(h.pedirRespuesta).toHaveBeenCalledTimes(1);
  });
});

describe('Claudia y el bot apagado', () => {
  it('si Claudia entró mientras pensaba no manda nada ni toca atencion', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.pedirRespuesta.mockImplementationOnce(async () => {
      chat.bot_activo = false;
      return pasar('Te escribe Claudia', 'pide precio');
    });
    await procesarChat(chat.id as string);
    expect(h.enviarTexto).not.toHaveBeenCalled();
    expect(chat.atencion).toBe(false);
  });

  it('corta entre partes si Claudia entró', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.pedirRespuesta.mockResolvedValueOnce(texto('uno\n\ndos'));
    h.enviarTexto.mockImplementationOnce(async () => {
      chat.bot_activo = false;
      return 'wa-1';
    });
    await procesarChat(chat.id as string);
    expect(h.enviarTexto).toHaveBeenCalledTimes(1);
  });

  it('pasar_a_claudia manda la frase y recién después apaga el bot', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'cuanto sale?' });
    h.pedirRespuesta.mockResolvedValueOnce(pasar(null, 'pide precio'));
    await procesarChat(chat.id as string);
    expect(h.enviarTexto.mock.calls[0][1]).toBe('Eso te lo confirma Claudia, ya te escribe');
    expect(chat).toMatchObject({ atencion: true, atencion_motivo: 'pide precio', bot_activo: false });
  });

  it('si el mensaje de pase no sale, la charla igual queda en manos de Claudia', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'cuanto sale?' });
    h.pedirRespuesta.mockResolvedValueOnce(pasar('ya te escribe', 'pide precio'));
    h.enviarTexto.mockRejectedValueOnce(new Error('caido'));
    await procesarChat(chat.id as string);
    expect(chat).toMatchObject({ atencion: true, bot_activo: false });
  });

  it('texto que no se puede mandar pasa a Claudia', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.pedirRespuesta.mockResolvedValueOnce(texto('<interno>no va</interno>'));
    await procesarChat(chat.id as string);
    expect(chat).toMatchObject({ atencion: true, bot_activo: false });
  });

  it('con el bot apagado a propósito limpia pendiente', async () => {
    const chat = d.chat({ bot_activo: false });
    d.mensaje(chat.id as string, { texto: 'hola' });
    await procesarChat(chat.id as string);
    expect(chat.pendiente).toBe(false);

    d.config().bot_activo = false;
    const otro = d.chat({ telefono: '1', jid: '1@s.whatsapp.net' });
    d.mensaje(otro.id as string, { texto: 'hola' });
    await procesarChat(otro.id as string);
    expect(otro.pendiente).toBe(false);
  });

  it('con WhatsApp caído deja pendiente intacto', async () => {
    d.config().wa_estado = 'desconectado';
    const chat = d.chat();
    d.mensaje(chat.id as string, { texto: 'hola' });
    await procesarChat(chat.id as string);
    expect(chat.pendiente).toBe(true);
    expect(h.pedirRespuesta).not.toHaveBeenCalled();
  });

  it('si WhatsApp se cae en medio del turno, también', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.pedirRespuesta.mockImplementationOnce(async () => {
      d.config().wa_estado = 'desconectado';
      return texto('respuesta');
    });
    await procesarChat(chat.id as string);
    expect(h.enviarTexto).not.toHaveBeenCalled();
    expect(chat.pendiente).toBe(true);
  });
});

describe('plazo y errores', () => {
  it('no empieza a enviar pasados 80 s y queda para el cron', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'hola' });
    await procesarChat(chat.id as string, Date.now() - 81_000);
    expect(h.enviarTexto).not.toHaveBeenCalled();
    expect(chat.pendiente).toBe(true);
    expect(chat.procesando_hasta).toBeNull();
  });

  it('un error permanente marca atencion y libera', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.pedirRespuesta.mockRejectedValueOnce(new Error('400'));
    h.esErrorPermanente.mockReturnValue(true);
    await procesarChat(chat.id as string);
    expect(chat).toMatchObject({ atencion: true, pendiente: false, procesando_hasta: null });
  });

  it('refusal pasa a Claudia sin mandar nada', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'hola' });
    h.pedirRespuesta.mockResolvedValueOnce({ stop_reason: 'refusal', content: [] });
    await procesarChat(chat.id as string);
    expect(h.enviarTexto).not.toHaveBeenCalled();
    expect(chat).toMatchObject({ atencion: true, bot_activo: false });
  });

  it('sin lock no hace nada', async () => {
    const chat = d.chat({ procesando_hasta: new Date(Date.now() + 60_000).toISOString() });
    d.mensaje(chat.id as string, { texto: 'hola' });
    await procesarChat(chat.id as string);
    expect(h.pedirRespuesta).not.toHaveBeenCalled();
  });
});

describe('topes de gasto', () => {
  it('pasados 15 turnos en la hora pasa a Claudia sin llamar al modelo', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.tablas.fg_turnos_llm.push(...Array.from({ length: 15 }, () => ({ chat_id: chat.id, creado: new Date().toISOString() })));
    d.mensaje(chat.id as string, { texto: 'hola' });
    await procesarChat(chat.id as string);
    expect(h.pedirRespuesta).not.toHaveBeenCalled();
    expect(chat).toMatchObject({ atencion: true, atencion_motivo: 'Muchos mensajes seguidos', bot_activo: false });
  });

  it('pasados 500 turnos en el día marca atencion sin llamar al modelo', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.tablas.fg_turnos_llm.push(...Array.from({ length: 500 }, () => ({ chat_id: 'otro', creado: new Date().toISOString() })));
    d.mensaje(chat.id as string, { texto: 'hola' });
    await procesarChat(chat.id as string);
    expect(h.pedirRespuesta).not.toHaveBeenCalled();
    expect(chat.atencion).toBe(true);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('cada llamada al modelo queda contada', async () => {
    const chat = d.chat({ saludo_enviado: true, atendido_hasta: '2020-01-01T00:00:00.000Z' });
    d.mensaje(chat.id as string, { texto: 'hola' });
    await procesarChat(chat.id as string);
    expect(d.tablas.fg_turnos_llm).toHaveLength(1);
  });
});
