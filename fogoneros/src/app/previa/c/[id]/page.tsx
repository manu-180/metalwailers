import { Conversacion } from '@/components/chats/conversacion';
import { chats, mensajes, notas } from '../../datos';

export default function P() {
  return <Conversacion chat={chats[0]} mensajes={mensajes} urls={{}} notas={notas} hayAnteriores />;
}
