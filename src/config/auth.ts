/**
 * Secreto usado para firmar y verificar los JWT de sesión.
 * Centralizado acá para no repetir el mismo fallback hardcodeado
 * en varios archivos (authenticate.ts, UsersService.ts).
 */
export const JWT_SECRET = process.env.TOKEN || "PROGRAMOVIL";
