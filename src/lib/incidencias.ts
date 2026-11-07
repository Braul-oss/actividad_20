import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { BUCKET, supabase } from './supabase';
import type { TipoPermitido } from './validacion';

const SEGUNDOS_URL_FIRMADA = 15 * 60;
const TIEMPO_MAXIMO_CARGA_MS = 60 * 1000;

export type Incidencia = {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string | null;
  foto_path: string;
  foto_mime: string;
  foto_tamano_bytes: number;
  creado_en: string;
};

export type IncidenciaConFoto = Incidencia & { foto_url: string | null };

export type FotoValidada = {
  bytes: Uint8Array;
  mime: TipoPermitido;
  extension: string;
  tamano: number;
};

export type DatosIncidencia = {
  titulo: string;
  descripcion: string;
  ubicacion: string;
};

export type EtapaCarga = 'subiendo' | 'registrando' | 'recuperando';

export async function asegurarSesion(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('No se pudo iniciar la sesión.');
  return data.user.id;
}

async function exigirConexion(): Promise<void> {
  const red = await Network.getNetworkStateAsync();
  if (red.isConnected === false || red.isInternetReachable === false) {
    throw new Error('Network request failed');
  }
}

function conLimiteDeTiempo<T>(promesa: PromiseLike<T>): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout>;
  const limite = new Promise<never>((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error('Tiempo de espera agotado')), TIEMPO_MAXIMO_CARGA_MS);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

async function firmarUrl(path: string, segundos = SEGUNDOS_URL_FIRMADA): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, segundos);
  if (error) throw error;
  return data.signedUrl;
}

export async function crearIncidencia(
  datos: DatosIncidencia,
  foto: FotoValidada,
  alCambiarEtapa: (etapa: EtapaCarga) => void,
): Promise<IncidenciaConFoto> {
  await exigirConexion();
  const usuarioId = await asegurarSesion();

  // El nombre lo genera la app: nunca se usa el nombre original del archivo.
  const path = `${usuarioId}/${Crypto.randomUUID()}.${foto.extension}`;

  alCambiarEtapa('subiendo');
  const carga = await conLimiteDeTiempo(
    supabase.storage.from(BUCKET).upload(path, foto.bytes, {
      contentType: foto.mime,
      upsert: false,
    }),
  );
  if (carga.error) throw carga.error;

  alCambiarEtapa('registrando');
  const { data: incidencia, error } = await supabase
    .from('incidencias')
    .insert({
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      ubicacion: datos.ubicacion.trim() || null,
      foto_path: path,
      foto_mime: foto.mime,
      foto_tamano_bytes: foto.tamano,
    })
    .select()
    .single<Incidencia>();

  if (error) {
    // Sin registro la foto quedaria huerfana, asi que se retira del almacenamiento.
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }

  alCambiarEtapa('recuperando');
  return { ...incidencia, foto_url: await firmarUrl(path) };
}

export async function listarIncidencias(): Promise<IncidenciaConFoto[]> {
  const { data, error } = await supabase
    .from('incidencias')
    .select('*')
    .order('creado_en', { ascending: false })
    .returns<Incidencia[]>();
  if (error) throw error;
  if (data.length === 0) return [];

  const firmas = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(data.map((i) => i.foto_path), SEGUNDOS_URL_FIRMADA);
  if (firmas.error) throw firmas.error;

  const urlPorPath = new Map(firmas.data.map((f) => [f.path, f.error ? null : f.signedUrl]));
  return data.map((i) => ({ ...i, foto_url: urlPorPath.get(i.foto_path) ?? null }));
}

export async function obtenerIncidencia(id: string): Promise<IncidenciaConFoto> {
  const { data, error } = await supabase
    .from('incidencias')
    .select('*')
    .eq('id', id)
    .single<Incidencia>();
  if (error) throw error;
  return { ...data, foto_url: await firmarUrl(data.foto_path) };
}

export function mensajeDeError(error: unknown): string {
  const texto = error instanceof Error ? error.message : String(error);
  if (/network|fetch|tiempo de espera|timed? ?out|connection|internet|retryable/i.test(texto)) {
    return 'No hay conexión con el servicio. Tus datos siguen aqui: revisa tu internet y vuelve a intentar.';
  }
  if (/mime type|invalid_mime/i.test(texto)) {
    return 'El servicio rechazó el archivo porque su formato no está permitido.';
  }
  if (/exceeded the maximum|too large|payload/i.test(texto)) {
    return 'El servicio rechazó el archivo porque supera el tamaño permitido.';
  }
  if (/row-level security|unauthorized|not authorized|jwt/i.test(texto)) {
    return 'No tienes autorización para realizar esta acción.';
  }
  if (/anonymous sign-ins are disabled/i.test(texto)) {
    return 'Activa los inicios de sesión anónimos en Supabase (Authentication > Sign In / Providers).';
  }
  return `Ocurrió un error inesperado: ${texto}`;
}
