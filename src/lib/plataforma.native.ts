// Proporciona localStorage en el dispositivo para conservar la sesion al cerrar la app.
import 'expo-sqlite/localStorage/install';
import { File } from 'expo-file-system';

export async function leerBytes(uri: string): Promise<Uint8Array> {
  try {
    return await new File(uri).bytes();
  } catch (error) {
    // Expo Go no permite a expo-file-system leer la copia que hace el selector de documentos.
    // React Native si puede leerla con fetch.
    const respuesta = await fetch(uri).catch(() => {
      throw error;
    });
    return new Uint8Array(await respuesta.arrayBuffer());
  }
}
