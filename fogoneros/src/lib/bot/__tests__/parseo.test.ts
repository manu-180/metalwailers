import { describe, expect, it } from 'vitest';
import { esFromMe, interpretarEvento } from '../parseo';

const AHORA = 1_800_000_000_000;
const SEG = Math.floor(AHORA / 1000);

function evento(data: unknown, extra: Record<string, unknown> = {}) {
  return { event: 'messages.upsert', instance: 'fogoneros-mw', data, ...extra };
}

function mensaje(over: Record<string, unknown> = {}, key: Record<string, unknown> = {}) {
  return {
    key: { id: 'ABC', remoteJid: '5491155550000@s.whatsapp.net', fromMe: false, ...key },
    pushName: 'Juan Perez',
    message: { conversation: 'hola' },
    messageType: 'conversation',
    messageTimestamp: SEG,
    ...over,
  };
}

function uno(body: unknown) {
  const r = interpretarEvento(body, 'fogoneros-mw', AHORA);
  if (r.tipo !== 'mensajes') throw new Error(`esperaba mensajes: ${JSON.stringify(r)}`);
  expect(r.mensajes).toHaveLength(1);
  return r.mensajes[0];
}

describe('interpretarEvento', () => {
  it.each(['messages.upsert', 'MESSAGES_UPSERT', 'messages_upsert'])('acepta la grafía %s', (ev) => {
    expect(uno(evento(mensaje(), { event: ev })).waId).toBe('ABC');
  });

  it('toma jid, teléfono, nombre y texto de un mensaje común', () => {
    const m = uno(evento(mensaje()));
    expect(m).toMatchObject({
      jid: '5491155550000@s.whatsapp.net',
      telefono: '5491155550000',
      lid: null,
      nombre: 'Juan Perez',
      tipo: 'texto',
      texto: 'hola',
      fromMe: false,
      origen: null,
    });
  });

  it('acepta data como array', () => {
    const r = interpretarEvento(evento([mensaje(), mensaje({}, { id: 'DEF' })]), 'fogoneros-mw', AHORA);
    expect(r.tipo === 'mensajes' && r.mensajes.map((m) => m.waId)).toEqual(['ABC', 'DEF']);
  });

  it('ignora otra instancia', () => {
    expect(interpretarEvento(evento(mensaje(), { instance: 'otra' }), 'fogoneros-mw', AHORA).tipo).toBe('ignorar');
  });

  it('ignora eventos que no le interesan', () => {
    expect(interpretarEvento(evento(mensaje(), { event: 'messages.update' }), 'fogoneros-mw', AHORA).tipo).toBe('ignorar');
  });

  it('entiende connection.update en cualquier grafía', () => {
    const r = interpretarEvento(
      { event: 'CONNECTION_UPDATE', instance: 'fogoneros-mw', data: { state: 'open', wuid: '5491133334444@s.whatsapp.net' } },
      'fogoneros-mw',
      AHORA,
    );
    expect(r).toEqual({ tipo: 'conexion', estado: 'open', numero: '+5491133334444' });
  });

  it.each([
    ['grupo', '120363000000000000@g.us'],
    ['estados', 'status@broadcast'],
    ['newsletter', '120363000000000000@newsletter'],
  ])('ignora %s', (_, remoteJid) => {
    expect(interpretarEvento(evento(mensaje({}, { remoteJid })), 'fogoneros-mw', AHORA).tipo).toBe('ignorar');
  });

  it('ignora lo que no es notify cuando el tipo viene', () => {
    expect(interpretarEvento(evento(mensaje({ type: 'append' })), 'fogoneros-mw', AHORA).tipo).toBe('ignorar');
    expect(uno(evento(mensaje({ type: 'notify' }))).waId).toBe('ABC');
  });

  it('ignora mensajes de más de 10 minutos, también con timestamp string o Long', () => {
    const viejo = SEG - 601;
    for (const messageTimestamp of [viejo, String(viejo), { low: viejo, high: 0 }]) {
      expect(interpretarEvento(evento(mensaje({ messageTimestamp })), 'fogoneros-mw', AHORA).tipo).toBe('ignorar');
    }
    expect(uno(evento(mensaje({ messageTimestamp: SEG - 500 }))).waId).toBe('ABC');
  });

  it('resuelve @lid con el teléfono de remoteJidAlt', () => {
    const m = uno(evento(mensaje({}, { remoteJid: '111222333@lid', remoteJidAlt: '5491155550000@s.whatsapp.net' })));
    expect(m).toMatchObject({ jid: '5491155550000@s.whatsapp.net', lid: '111222333@lid', telefono: '5491155550000' });
  });

  it('resuelve @lid con senderPn en la key o en el item', () => {
    expect(uno(evento(mensaje({}, { remoteJid: '111@lid', senderPn: '5491155550000@s.whatsapp.net' }))).telefono).toBe('5491155550000');
    expect(uno(evento(mensaje({ senderPn: '5491155550000@s.whatsapp.net' }, { remoteJid: '111@lid' }))).telefono).toBe('5491155550000');
  });

  it('un @lid sin número real queda con el lid como jid', () => {
    const m = uno(evento(mensaje({}, { remoteJid: '111@lid' })));
    expect(m).toMatchObject({ jid: '111@lid', lid: '111@lid', telefono: null });
  });

  it('guarda el lid que llega aparte cuando Evolution ya cambió remoteJid por el teléfono', () => {
    const m = uno(evento(mensaje({}, { senderLid: '111@lid' })));
    expect(m).toMatchObject({ jid: '5491155550000@s.whatsapp.net', lid: '111@lid' });
  });

  it('saca el sufijo de dispositivo del jid', () => {
    expect(uno(evento(mensaje({}, { remoteJid: '5491155550000:12@s.whatsapp.net' }))).jid).toBe('5491155550000@s.whatsapp.net');
  });

  it('ignora un jid con forma inesperada', () => {
    expect(interpretarEvento(evento(mensaje({}, { remoteJid: 'x",telefono.eq.1@s.whatsapp.net' })), 'fogoneros-mw', AHORA).tipo).toBe('ignorar');
  });

  it('no toma el nombre de los fromMe', () => {
    expect(uno(evento(mensaje({ pushName: 'Claudia' }, { fromMe: 'true' })))).toMatchObject({ fromMe: true, nombre: null });
  });

  it('marca instagram por externalAdReply, conversionSource o ctwa', () => {
    const casos = [
      { contextInfo: { externalAdReply: { title: 'x' } } },
      { contextInfo: { conversionSource: 'FB_Ads' } },
      { contextInfo: { ctwaClid: 'abc' } },
      { message: { extendedTextMessage: { text: 'hola', contextInfo: { externalAdReply: {} } } } },
    ];
    for (const over of casos) expect(uno(evento(mensaje(over))).origen).toBe('instagram');
  });

  it('clasifica los tipos de media y toma el pie', () => {
    expect(uno(evento(mensaje({ message: { audioMessage: { mimetype: 'audio/ogg; codecs=opus', ptt: true } } })))).toMatchObject({
      tipo: 'audio',
      texto: null,
      mime: 'audio/ogg; codecs=opus',
    });
    expect(uno(evento(mensaje({ message: { imageMessage: { caption: 'mira', mimetype: 'image/jpeg' } } })))).toMatchObject({
      tipo: 'imagen',
      texto: 'mira',
    });
    expect(
      uno(evento(mensaje({ message: { documentMessage: { fileName: 'plano.pdf', mimetype: 'application/pdf', fileLength: '1024' } } }))),
    ).toMatchObject({ tipo: 'documento', nombreArchivo: 'plano.pdf', tamano: 1024 });
    expect(uno(evento(mensaje({ message: { videoMessage: {} } }))).tipo).toBe('video');
    expect(uno(evento(mensaje({ message: { stickerMessage: {} } }))).tipo).toBe('sticker');
  });

  it('desenvuelve efímeros, de una vez y documentos con pie', () => {
    expect(uno(evento(mensaje({ message: { ephemeralMessage: { message: { conversation: 'chau' } } } }))).texto).toBe('chau');
    expect(uno(evento(mensaje({ message: { viewOnceMessageV2: { message: { imageMessage: {} } } } }))).tipo).toBe('imagen');
    expect(
      uno(evento(mensaje({ message: { documentWithCaptionMessage: { message: { documentMessage: { caption: 'va', fileName: 'a.pdf' } } } } }))),
    ).toMatchObject({ tipo: 'documento', texto: 'va' });
  });

  it('ignora reacciones y protocolo', () => {
    for (const message of [{ reactionMessage: { text: 'x' } }, { protocolMessage: { type: 0 } }]) {
      expect(interpretarEvento(evento(mensaje({ message })), 'fogoneros-mw', AHORA).tipo).toBe('ignorar');
    }
  });

  it('no pierde lo que no sabe leer: queda como otro', () => {
    expect(uno(evento(mensaje({ message: { locationMessage: {} } }))).tipo).toBe('otro');
  });

  it('no revienta con basura', () => {
    for (const body of [null, 'x', 3, {}, { event: 'messages.upsert' }, { event: 'messages.upsert', instance: 'fogoneros-mw', data: [null, {}] }]) {
      expect(interpretarEvento(body, 'fogoneros-mw', AHORA).tipo).toBe('ignorar');
    }
  });
});

describe('esFromMe', () => {
  it.each([[true, true], ['true', true], [1, true], ['1', true], [false, false], ['false', false], [0, false], [undefined, false]])(
    '%s es %s',
    (v, esperado) => {
      expect(esFromMe(v)).toBe(esperado);
    },
  );
});
