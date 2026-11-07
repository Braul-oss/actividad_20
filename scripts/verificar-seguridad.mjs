// Comprueba las reglas contra el servicio real, usando solo la clave publicable.
// Uso: npm run verificar:seguridad
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const URL_SERVICIO = process.env.EXPO_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = 'incidencias-fotos';
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]);

if (!URL_SERVICIO || !CLAVE) {
  console.error('Falta el archivo .env. Copia .env.example como .env y complétalo.');
  process.exit(1);
}

const crearCliente = () => createClient(URL_SERVICIO, CLAVE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function crearUsuario() {
  const cliente = crearCliente();
  const { data, error } = await cliente.auth.signInAnonymously();
  if (error) throw new Error(`No se pudo crear un usuario anónimo: ${error.message}`);
  return { cliente, id: data.user.id };
}

let fallos = 0;
function comprobar(nombre, correcto, detalle) {
  if (!correcto) fallos += 1;
  console.log(`${correcto ? 'OK   ' : 'FALLA'} ${nombre}\n      ${detalle}`);
}

const autorA = await crearUsuario();
const intruso = await crearUsuario();
const sinSesion = crearCliente();
const storageA = autorA.cliente.storage.from(BUCKET);

console.log('\nCarga autorizada');
const path = `${autorA.id}/${randomUUID()}.jpg`;
const cargaValida = await storageA.upload(path, JPEG, { contentType: 'image/jpeg' });
comprobar(
  'El propietario puede subir un JPG a su carpeta',
  !cargaValida.error,
  cargaValida.error?.message ?? path,
);
const propia = await storageA.download(path);
comprobar('El propietario puede descargar su archivo', !propia.error, propia.error?.message ?? 'descarga correcta');

console.log('\nRestricciones de carga');
const pdf = await storageA.upload(`${autorA.id}/${randomUUID()}.pdf`, new TextEncoder().encode('%PDF-1.7'), {
  contentType: 'application/pdf',
});
comprobar('Rechaza un PDF', Boolean(pdf.error), pdf.error?.message ?? 'el PDF fue aceptado');

const grande = await storageA.upload(
  `${autorA.id}/${randomUUID()}.jpg`,
  new Uint8Array(5 * 1024 * 1024 + 1),
  { contentType: 'image/jpeg' },
);
comprobar('Rechaza un archivo mayor a 5 MB', Boolean(grande.error), grande.error?.message ?? 'el archivo fue aceptado');

const ajena = await intruso.cliente.storage
  .from(BUCKET)
  .upload(`${autorA.id}/${randomUUID()}.jpg`, JPEG, { contentType: 'image/jpeg' });
comprobar('Impide subir a la carpeta de otro usuario', Boolean(ajena.error), ajena.error?.message ?? 'la carga fue aceptada');

const sinAutenticar = await sinSesion.storage
  .from(BUCKET)
  .upload(`${autorA.id}/${randomUUID()}.jpg`, JPEG, { contentType: 'image/jpeg' });
comprobar('Impide subir sin sesión', Boolean(sinAutenticar.error), sinAutenticar.error?.message ?? 'la carga fue aceptada');

console.log('\nAcceso a archivos privados');
const { data: { publicUrl } } = storageA.getPublicUrl(path);
const publica = await fetch(publicUrl);
comprobar('La URL pública no entrega el archivo', !publica.ok, `HTTP ${publica.status}`);

const descargaSinSesion = await sinSesion.storage.from(BUCKET).download(path);
comprobar('Sin sesión no se puede descargar', Boolean(descargaSinSesion.error), descargaSinSesion.error?.message ?? 'descarga permitida');

const descargaIntruso = await intruso.cliente.storage.from(BUCKET).download(path);
comprobar('Otro usuario no puede descargar', Boolean(descargaIntruso.error), descargaIntruso.error?.message ?? 'descarga permitida');

const firmaIntruso = await intruso.cliente.storage.from(BUCKET).createSignedUrl(path, 60);
comprobar('Otro usuario no puede generar una URL firmada', Boolean(firmaIntruso.error), firmaIntruso.error?.message ?? 'URL generada');

const borradoIntruso = await intruso.cliente.storage.from(BUCKET).remove([path]);
const sigueExistiendo = await storageA.download(path);
comprobar('Otro usuario no puede borrar el archivo', !sigueExistiendo.error, `${borradoIntruso.data?.length ?? 0} archivos borrados por el intruso`);

console.log('\nURL firmada');
const firma = await storageA.createSignedUrl(path, 2);
const vigente = await fetch(firma.data.signedUrl);
comprobar('Funciona mientras está vigente', vigente.ok, `HTTP ${vigente.status}`);
await new Promise((resolver) => setTimeout(resolver, 4000));
const vencida = await fetch(firma.data.signedUrl);
comprobar('Deja de funcionar al vencer', !vencida.ok, `HTTP ${vencida.status}`);

console.log('\nBase de datos');
const fila = {
  titulo: 'Prueba de seguridad',
  descripcion: 'Registro creado por el script',
  foto_path: path,
  foto_mime: 'image/jpeg',
  foto_tamano_bytes: JPEG.length,
};
const registro = await autorA.cliente.from('incidencias').insert(fila).select().single();
comprobar('El propietario puede registrar su incidencia', !registro.error, registro.error?.message ?? registro.data.id);

const lecturaIntruso = await intruso.cliente.from('incidencias').select('*').eq('foto_path', path);
comprobar('Otro usuario no ve la incidencia', lecturaIntruso.data?.length === 0, `${lecturaIntruso.data?.length ?? 0} filas visibles`);

const lecturaSinSesion = await sinSesion.from('incidencias').select('*').eq('foto_path', path);
comprobar(
  'Sin sesión no se ve la incidencia',
  Boolean(lecturaSinSesion.error) || lecturaSinSesion.data?.length === 0,
  lecturaSinSesion.error?.message ?? `${lecturaSinSesion.data?.length ?? 0} filas visibles`,
);

const robo = await intruso.cliente.from('incidencias').insert({ ...fila, foto_path: `${autorA.id}/${randomUUID()}.jpg` });
comprobar('Impide registrar una foto de otro usuario', Boolean(robo.error), robo.error?.message ?? 'registro aceptado');

// El usuario de prueba es desechable: su fila no aparece en la app de ningun otro usuario.
await storageA.remove([path]);

console.log(`\n${fallos === 0 ? 'Todas las comprobaciones pasaron.' : `${fallos} comprobaciones fallaron.`}\n`);
process.exit(fallos === 0 ? 0 : 1);
