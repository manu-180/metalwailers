'use client';

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabaseNavegador } from '@/lib/supabase/cliente';

export function useCanal(nombre: string, armar: (canal: RealtimeChannel) => RealtimeChannel, alVolver?: () => void) {
  const armarRef = useRef(armar);
  const volverRef = useRef(alVolver);
  const yaConectoRef = useRef(false);

  useEffect(() => {
    armarRef.current = armar;
    volverRef.current = alVolver;
  });

  useEffect(() => {
    const supabase = supabaseNavegador();
    // Un SUBSCRIBED que no es el primero viene de una reconexión o de volver a la
    // pantalla: lo que pasó en el medio no llegó por el canal y hay que reconciliarlo.
    const canal = armarRef.current(supabase.channel(nombre)).subscribe((estado) => {
      if (estado !== 'SUBSCRIBED') return;
      if (yaConectoRef.current) volverRef.current?.();
      yaConectoRef.current = true;
    });
    return () => {
      supabase.removeChannel(canal);
    };
  }, [nombre]);
}
