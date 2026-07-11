/**
 * Configuração de ambiente — Intranet HBP.
 *
 * Variáveis injetadas pelo Vite no build:
 *   VITE_INTRANET_URL  — URL base da intranet  (ex: http://localhost:8082)
 *   VITE_PORTAL_URL    — URL base do portal    (ex: http://localhost:8080)
 *
 * O ambiente corrente é detectado comparando window.location.origin
 * com os valores dessas variáveis. Fallback: porta 8082 = intranet.
 */

export const INTRANET_URL = import.meta.env.VITE_INTRANET_URL ?? "";
export const PORTAL_URL   = import.meta.env.VITE_PORTAL_URL   ?? "";

/**
 * Retorna true se a URL/origem atual corresponde à Intranet.
 */
export function isIntranet() {
  if (typeof window === "undefined") return true;
  const origin = window.location.origin;

  if (INTRANET_URL) {
    try {
      const intranetOrigin = new URL(INTRANET_URL).origin;
      if (origin === intranetOrigin) return true;
    } catch {
      // URL inválida — ignora e cai no fallback
    }
  }

  // Fallback: porta 8082 = intranet
  return window.location.port === "8082";
}

export function isPortal() {
  return !isIntranet();
}

/** URL para onde o botão de alternância deve navegar */
export function getSwitchUrl() {
  return PORTAL_URL || "#";
}

/** Rótulo do botão de alternância */
export function getSwitchLabel() {
  return "Ir para o Portal";
}
