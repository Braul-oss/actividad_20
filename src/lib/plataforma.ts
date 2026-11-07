// Version web. En Android e iOS, Metro usa plataforma.native.ts.
export async function leerBytes(uri: string): Promise<Uint8Array> {
  const respuesta = await fetch(uri);
  return new Uint8Array(await respuesta.arrayBuffer());
}
