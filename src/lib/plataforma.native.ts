// Proporciona localStorage en el dispositivo para conservar la sesion al cerrar la app.
import 'expo-sqlite/localStorage/install';
import { File } from 'expo-file-system';

export async function leerBytes(uri: string): Promise<Uint8Array> {
  return new File(uri).bytes();
}
