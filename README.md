# Reporte de Incidencias

Prototipo con React Native y Expo para registrar incidencias con una fotografía. La imagen se guarda en Supabase Storage y la base de datos conserva solo su referencia.

La documentación de la actividad (servicio, seguridad, pruebas y evidencias) está en [docs/DOCUMENTACION.md](docs/DOCUMENTACION.md).

## Flujo

Aplicación móvil → Seleccionar imagen → Validar el archivo → Servicio de almacenamiento → Guardar archivo → Obtener URL o referencia → Mostrar imagen en la app

## Puesta en marcha

### 1. Configura Supabase

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. Abre **SQL Editor**, pega el contenido de `supabase/migrations/20261107000000_incidencias.sql` y ejecútalo. Esto crea el bucket privado, la tabla y las reglas de acceso.
3. En **Authentication > Sign In / Providers**, activa **Allow anonymous sign-ins**.

### 2. Configura la app

Copia la plantilla y completa los dos valores, que están en **Project Settings > API Keys**:

```bash
cp .env.example .env
```

Usa únicamente la clave publicable (`sb_publishable_...`). La app se niega a iniciar si detecta una clave secreta.

### 3. Ejecuta

```bash
npm install
npx expo start
```

Escanea el código QR con **Expo Go** (compatible con SDK 58) o presiona `a` para abrir un emulador de Android.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npx expo start` | Inicia la app |
| `npm test` | Ejecuta las pruebas de validación |
| `npm run verificar:seguridad` | Comprueba las reglas de acceso contra tu proyecto de Supabase |
| `npx expo lint` | Revisa el estilo del código |
| `npx tsc --noEmit` | Revisa los tipos |

## Estructura

```text
src/app/                 Pantallas (Expo Router)
  index.tsx              Mis incidencias
  nueva.tsx              Registro, selección, vista previa y carga
  incidencia/[id].tsx    Detalle con la imagen remota
src/lib/
  validacion.ts          Formato, tamaño y detección de claves administrativas
  incidencias.ts         Carga, registro, consulta y URLs firmadas
  supabase.ts            Cliente y sesión
supabase/migrations/     Bucket, tabla y reglas de acceso
scripts/                 Verificación de seguridad
tests/                   Pruebas de validación
```
