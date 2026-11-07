// Reglas de validacion sin dependencias de React Native, para poder probarlas con Node.

export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export type TipoPermitido = 'image/jpeg' | 'image/png' | 'image/webp';

const EXTENSIONES: Record<TipoPermitido, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export type ResultadoValidacion =
  | { ok: true; mime: TipoPermitido; extension: string; tamano: number }
  | { ok: false; motivo: string };

function empiezaCon(bytes: Uint8Array, firma: number[], desde = 0): boolean {
  return firma.every((valor, i) => bytes[desde + i] === valor);
}

// Revisa los primeros bytes del archivo: la extension o el tipo declarado se pueden falsificar.
export function detectarTipoReal(bytes: Uint8Array): TipoPermitido | null {
  if (empiezaCon(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (empiezaCon(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (empiezaCon(bytes, [0x52, 0x49, 0x46, 0x46]) && empiezaCon(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }
  return null;
}

export function excedeTamano(tamano: number | null | undefined): boolean {
  return typeof tamano === 'number' && tamano > TAMANO_MAXIMO_BYTES;
}

export function validarArchivo(bytes: Uint8Array): ResultadoValidacion {
  if (bytes.length === 0) {
    return { ok: false, motivo: 'El archivo está vacío.' };
  }
  if (excedeTamano(bytes.length)) {
    return { ok: false, motivo: `La imagen pesa ${formatearTamano(bytes.length)}. El máximo es 5 MB.` };
  }
  const mime = detectarTipoReal(bytes);
  if (!mime) {
    return { ok: false, motivo: 'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WEBP.' };
  }
  return { ok: true, mime, extension: EXTENSIONES[mime], tamano: bytes.length };
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Detecta si por error se configuro una clave administrativa en la app.
export function esClaveAdministrativa(clave: string): boolean {
  if (clave.startsWith('sb_secret_')) return true;
  const partes = clave.split('.');
  if (partes.length !== 3) return false;
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)).role === 'service_role';
  } catch {
    return false;
  }
}

export function validarFormulario(titulo: string, descripcion: string): string | null {
  if (titulo.trim().length < 3) return 'Escribe un título de al menos 3 caracteres.';
  if (descripcion.trim().length < 5) return 'Describe el problema con al menos 5 caracteres.';
  return null;
}
