import type { Metadata } from 'next';
import { PaginaLegal } from '@/components/panel/legal';

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Qué datos guarda Fogoneros MW de quienes escriben por WhatsApp, para qué y cómo pedir la baja.',
  alternates: { canonical: '/privacidad' },
  robots: { index: true, follow: true },
};

export default function PaginaPrivacidad() {
  return (
    <PaginaLegal titulo="Privacidad">
      <p>Actualizado el 3 de noviembre de 2026.</p>
      <h2>Qué guardamos</h2>
      <p>
        Cuando le escribís a Fogoneros MW por WhatsApp guardamos la charla (textos, audios, fotos y archivos) y tu
        número de teléfono, junto con el nombre que tengas en WhatsApp.
      </p>
      <h2>Para qué</h2>
      <p>
        Usamos la charla para responderte y tu teléfono para contactarte por tu consulta o tu pedido. Parte de las
        respuestas las escribe un asistente automático, y el equipo de Fogoneros MW puede leer la charla y contestarte.
        No vendemos tus datos.
      </p>
      <h2>Con quién trabajamos</h2>
      <p>Para que esto funcione, tus datos pasan por estos servicios externos:</p>
      <ul>
        <li>WhatsApp, a través de Evolution API, para enviar y recibir mensajes.</li>
        <li>Anthropic, para escribir las respuestas automáticas.</li>
        <li>Groq, para pasar los audios a texto.</li>
        <li>Supabase, donde se guardan las charlas.</li>
        <li>Vercel, donde funciona este sistema.</li>
      </ul>
      <h2>Cómo pedir la baja</h2>
      <p>
        Escribinos por el mismo WhatsApp de Fogoneros MW y pedinos que borremos tus datos. También podés pedir ver qué
        tenemos guardado o corregirlo.
      </p>
    </PaginaLegal>
  );
}
