import Link from 'next/link';
import { claseBoton } from '@/components/ui/boton';

export default function ChatNoEncontrado() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-14">
      <h1 className="text-5xl font-bold">No encontramos este chat</h1>
      <p className="text-tinta-2">Puede que el link esté mal copiado.</p>
      <Link href="/chats" className={`${claseBoton()} self-start`}>
        Volver a los chats
      </Link>
    </div>
  );
}
