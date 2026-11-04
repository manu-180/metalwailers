// Doble en memoria de lo que el bot usa de supabase-js. Reproduce el trigger de
// fg_mensajes y el lock de fg_tomar_turno, que es donde vivían los bugs de orden.

type Fila = Record<string, unknown>;
type Filtro = (f: Fila) => boolean;

export type Doble = ReturnType<typeof crearDoble>;

let reloj = 0;
const ahora = () => new Date(Date.now() + reloj++).toISOString();

function compatible(valor: unknown, esperado: unknown): boolean {
  return valor === esperado || (valor === undefined && esperado === null);
}

class Consulta {
  private filtros: Filtro[] = [];
  private orden: { col: string; asc: boolean }[] = [];
  private tope: number | null = null;
  private accion: 'select' | 'update' | 'insert' | 'upsert' = 'select';
  private datos: Fila | Fila[] | null = null;
  private opciones: { onConflict?: string; ignoreDuplicates?: boolean } = {};
  private uno: 'single' | 'maybe' | null = null;
  private soloCuenta = false;

  constructor(
    private doble: Doble,
    private tabla: string,
  ) {}

  select(_col?: string, op?: { count?: string; head?: boolean }) {
    if (op?.head) this.soloCuenta = true;
    return this;
  }
  update(datos: Fila) {
    this.accion = 'update';
    this.datos = datos;
    return this;
  }
  insert(datos: Fila) {
    this.accion = 'insert';
    this.datos = datos;
    return this;
  }
  upsert(datos: Fila, opciones: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.accion = 'upsert';
    this.datos = datos;
    this.opciones = opciones;
    return this;
  }
  eq(col: string, valor: unknown) {
    this.filtros.push((f) => f[col] === valor);
    return this;
  }
  neq(col: string, valor: unknown) {
    this.filtros.push((f) => f[col] !== valor);
    return this;
  }
  is(col: string, valor: unknown) {
    this.filtros.push((f) => compatible(f[col], valor));
    return this;
  }
  in(col: string, valores: unknown[]) {
    this.filtros.push((f) => valores.includes(f[col]));
    return this;
  }
  gte(col: string, valor: string) {
    this.filtros.push((f) => String(f[col]) >= valor);
    return this;
  }
  lt(col: string, valor: string) {
    this.filtros.push((f) => f[col] != null && String(f[col]) < valor);
    return this;
  }
  or(expresion: string) {
    const partes = expresion.split(',').map((p) => /^(\w+)\.eq\."(.*)"$/.exec(p)!);
    this.filtros.push((f) => partes.some((m) => f[m[1]] === m[2]));
    return this;
  }
  order(col: string, op?: { ascending?: boolean }) {
    this.orden.push({ col, asc: op?.ascending ?? true });
    return this;
  }
  limit(n: number) {
    this.tope = n;
    return this;
  }
  single() {
    this.uno = 'single';
    return this;
  }
  maybeSingle() {
    this.uno = 'maybe';
    return this;
  }

  then<T>(resolver: (valor: { data: unknown; error: { code: string } | null; count?: number }) => T) {
    return Promise.resolve().then(() => resolver(this.ejecutar()));
  }

  private ejecutar() {
    const falla = this.doble.fallas[this.tabla]?.[this.accion];
    if (falla) return { data: null, error: { code: falla } };

    const filas = (this.doble.tablas[this.tabla] ??= []);
    let afectadas: Fila[];
    if (this.accion === 'insert' || this.accion === 'upsert') {
      const nueva = this.datos as Fila;
      const repetida = this.opciones.onConflict && filas.some((f) => f[this.opciones.onConflict!] === nueva[this.opciones.onConflict!]);
      if (repetida) return { data: [], error: null };
      const fila = { id: `${this.tabla}-${filas.length + 1}`, creado: ahora(), ...this.doble.defaults[this.tabla], ...nueva };
      filas.push(fila);
      this.doble.alInsertar(this.tabla, fila);
      afectadas = [fila];
    } else {
      afectadas = filas.filter((f) => this.filtros.every((filtro) => filtro(f)));
      if (this.accion === 'update') afectadas.forEach((f) => Object.assign(f, this.datos));
    }

    for (const { col, asc } of [...this.orden].reverse()) {
      afectadas = [...afectadas].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0) * (asc ? 1 : -1));
    }
    if (this.soloCuenta) return { data: null, error: null, count: afectadas.length };
    if (this.tope !== null) afectadas = afectadas.slice(0, this.tope);
    afectadas = afectadas.map((f) => ({ ...f }));
    if (this.uno) return { data: afectadas[0] ?? null, error: afectadas[0] || this.uno === 'maybe' ? null : { code: 'PGRST116' } };
    return { data: afectadas, error: null };
  }
}

export function crearDoble() {
  const doble = {
    tablas: {
      fg_config: [
        {
          id: 1,
          bot_activo: true,
          saludo: 'Hola {nombre}, como estas?',
          audio_path: 'audio/bienvenida.ogg',
          audio_mime: 'audio/ogg',
          audio_nombre: 'b.ogg',
          wa_estado: 'conectado',
          wa_numero: '+549',
          vinculado_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      fg_chats: [],
      fg_mensajes: [],
      fg_contexto: [],
      fg_notas: [],
      fg_turnos_llm: [],
    } as Record<string, Fila[]>,
    defaults: {
      fg_chats: {
        lid: null,
        bot_activo: true,
        atencion: false,
        atencion_motivo: null,
        saludo_enviado: false,
        origen: null,
        pendiente: false,
        pendiente_desde: null,
        procesando_hasta: null,
        atendido_hasta: null,
      },
      fg_mensajes: {
        wa_id: null,
        estado: 'ok',
        texto: null,
        transcripcion: null,
        media_path: null,
        media_mime: null,
        media_nombre: null,
        error: null,
        tipo: 'texto',
      },
    } as Record<string, Fila>,
    fallas: {} as Record<string, Record<string, string>>,
    alInsertar(tabla: string, fila: Fila) {
      if (tabla !== 'fg_mensajes' || fila.autor !== 'cliente') return;
      const chat = doble.tablas.fg_chats.find((c) => c.id === fila.chat_id);
      if (chat) {
        chat.pendiente = true;
        chat.pendiente_desde ??= fila.creado;
      }
    },
    from(tabla: string) {
      return new Consulta(doble, tabla);
    },
    async rpc(nombre: string, args: { p_chat: string; p_segundos: number }) {
      if (nombre !== 'fg_tomar_turno') throw new Error(`rpc inesperada ${nombre}`);
      const chat = doble.tablas.fg_chats.find((c) => c.id === args.p_chat)!;
      const libre = !chat.procesando_hasta || String(chat.procesando_hasta) < new Date().toISOString();
      if (libre) chat.procesando_hasta = new Date(Date.now() + args.p_segundos * 1000).toISOString();
      return { data: libre, error: null };
    },
    storage: { from: () => ({}) },
    chat(over: Fila = {}): Fila {
      const fila: Fila = { id: `chat-${doble.tablas.fg_chats.length + 1}`, jid: '5491155550000@s.whatsapp.net', telefono: '5491155550000', nombre: 'Juan Perez', creado: ahora(), ...doble.defaults.fg_chats, ...over };
      doble.tablas.fg_chats.push(fila);
      return fila;
    },
    mensaje(chatId: string, over: Fila = {}): Fila {
      const fila: Fila = { id: `m-${doble.tablas.fg_mensajes.length + 1}`, chat_id: chatId, autor: 'cliente', creado: ahora(), ...doble.defaults.fg_mensajes, ...over };
      doble.tablas.fg_mensajes.push(fila);
      doble.alInsertar('fg_mensajes', fila);
      return fila;
    },
    delBot(chatId: string) {
      return doble.tablas.fg_mensajes.filter((m) => m.chat_id === chatId && m.autor === 'bot');
    },
    config() {
      return doble.tablas.fg_config[0];
    },
  };
  return doble;
}
