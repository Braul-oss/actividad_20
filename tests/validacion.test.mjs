import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  detectarTipoReal,
  esClaveAdministrativa,
  TAMANO_MAXIMO_BYTES,
  validarArchivo,
  validarFormulario,
} from '../src/lib/validacion.ts';

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const WEBP = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const WAV = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45]);
const PDF = new TextEncoder().encode('%PDF-1.7 contenido');
const GIF = new TextEncoder().encode('GIF89a contenido');

function jwtConRol(role) {
  const carga = Buffer.from(JSON.stringify({ role })).toString('base64url');
  return `encabezado.${carga}.firma`;
}

test('reconoce los tres formatos permitidos por su contenido', () => {
  assert.equal(detectarTipoReal(JPEG), 'image/jpeg');
  assert.equal(detectarTipoReal(PNG), 'image/png');
  assert.equal(detectarTipoReal(WEBP), 'image/webp');
});

test('asigna la extension a partir del contenido real', () => {
  const resultado = validarArchivo(PNG);
  assert.equal(resultado.ok, true);
  assert.equal(resultado.extension, 'png');
});

test('rechaza formatos no permitidos aunque tengan una cabecera parecida', () => {
  for (const archivo of [PDF, GIF, WAV]) {
    const resultado = validarArchivo(archivo);
    assert.equal(resultado.ok, false);
    assert.match(resultado.motivo, /Formato no permitido/);
  }
});

test('rechaza archivos vacios', () => {
  assert.equal(validarArchivo(new Uint8Array()).ok, false);
});

test('aplica el limite exacto de 5 MB', () => {
  const justo = new Uint8Array(TAMANO_MAXIMO_BYTES);
  justo.set(JPEG);
  assert.equal(validarArchivo(justo).ok, true);

  const excedido = new Uint8Array(TAMANO_MAXIMO_BYTES + 1);
  excedido.set(JPEG);
  const resultado = validarArchivo(excedido);
  assert.equal(resultado.ok, false);
  assert.match(resultado.motivo, /máximo es 5 MB/);
});

test('detecta claves administrativas y acepta las publicables', () => {
  assert.equal(esClaveAdministrativa('sb_secret_abc'), true);
  assert.equal(esClaveAdministrativa(jwtConRol('service_role')), true);
  assert.equal(esClaveAdministrativa(jwtConRol('anon')), false);
  assert.equal(esClaveAdministrativa('sb_publishable_abc'), false);
});

test('valida los campos obligatorios del formulario', () => {
  assert.notEqual(validarFormulario('  a ', 'descripcion valida'), null);
  assert.notEqual(validarFormulario('Fuga', ' abc '), null);
  assert.equal(validarFormulario('Fuga', 'Hay agua en el piso'), null);
});
