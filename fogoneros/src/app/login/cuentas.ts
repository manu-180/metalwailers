// Los mails que se escriben acá no son las cuentas reales. El proyecto de Supabase es
// compartido: manunv97@gmail.com ya es un usuario de otra app, y santi@gmail.com es una
// casilla ajena cuyo dueño podría recuperar la contraseña y entrar. Las cuentas viven en
// @metalwailers.com, que nadie recibe.
const CUENTAS: Record<string, string> = {
  'santi@gmail.com': 'santi@metalwailers.com',
  'claudia@gmail.com': 'claudia@metalwailers.com',
  'manunv97@gmail.com': 'manuel@metalwailers.com',
};

export function cuentaDe(mail: string): string | null {
  return CUENTAS[mail.trim().toLowerCase()] ?? null;
}
