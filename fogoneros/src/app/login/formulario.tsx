'use client';

import { useActionState, useState } from 'react';
import { Boton } from '@/components/ui/boton';
import { Campo } from '@/components/ui/campo';
import { entrar, type EstadoLogin } from './acciones';

const INICIAL: EstadoLogin = {};

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(entrar, INICIAL);
  const [ver, setVer] = useState(false);

  return (
    <form action={accion} className="flex flex-col gap-4" noValidate>
      <Campo
        etiqueta="Mail"
        name="usuario"
        type="email"
        inputMode="email"
        defaultValue={estado.usuario}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        error={estado.errores?.usuario}
      />
      <div>
        <Campo
          etiqueta="Contraseña"
          name="contrasena"
          type={ver ? 'text' : 'password'}
          autoComplete="current-password"
          enterKeyHint="go"
          error={estado.errores?.contrasena}
        />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          aria-pressed={ver}
          className="mt-2 min-h-11 rounded-lg px-1 font-semibold text-brasa-texto"
        >
          {ver ? 'Ocultar contraseña' : 'Ver contraseña'}
        </button>
      </div>
      {estado.error && (
        <p role="alert" className="rounded-xl border border-peligro/40 bg-peligro-fondo px-3.5 py-2.5">
          {estado.error}
        </p>
      )}
      <Boton type="submit" grande disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </Boton>
    </form>
  );
}
