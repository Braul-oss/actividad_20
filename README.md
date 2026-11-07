# Reporte de Incidencias

Prototipo con React Native y Expo para registrar incidencias con una fotografía. La imagen se guarda en Supabase Storage y la base de datos conserva solo su referencia.

La documentación de la actividad (servicio, seguridad, pruebas y evidencias) está en [docs/DOCUMENTACION.md](docs/DOCUMENTACION.md).

## Flujo

Aplicación móvil → Seleccionar imagen → Validar el archivo → Servicio de almacenamiento → Guardar archivo → Obtener URL o referencia → Mostrar imagen en la app

## Estado actual

- **Proyecto en la nube:** el proyecto `reporte-incidencias` ya existe en Supabase y está vinculado a esta carpeta con la CLI.
- **Base de datos:** la migración ya se aplicó, así que el bucket privado, la tabla y las reglas de acceso están creados.
- **Inicio de sesión:** el inicio de sesión anónimo está activado.
- **Seguridad:** `npm run verificar:seguridad` pasó las 17 comprobaciones contra el proyecto en la nube. La salida está en [docs/evidencias/08-salida-nube.txt](docs/evidencias/08-salida-nube.txt).

En esta computadora el `.env` ya está configurado, y puedes pasar directamente al paso 3. Los pasos 1 y 2 sirven para montar el proyecto en otra cuenta o en otra computadora.

## Puesta en marcha

### 1. Configura Supabase

Crea un proyecto gratuito en [supabase.com](https://supabase.com) y prepáralo de una de estas dos formas.

**Desde el panel web**

1. Abre **SQL Editor**, pega el contenido de `supabase/migrations/20261107000000_incidencias.sql` y ejecútalo. Esto crea el bucket privado, la tabla y las reglas de acceso.
2. En **Authentication > Sign In / Providers**, activa **Allow anonymous sign-ins**.

**Desde la terminal, con la CLI de Supabase**

```bash
npx supabase login
npx supabase link --project-ref <referencia-del-proyecto>
npx supabase db push
```

- La referencia del proyecto es la parte inicial de su URL (`https://<referencia>.supabase.co`).
- `link` y `db push` piden la contraseña de la base de datos que elegiste al crear el proyecto. Si la guardas en un archivo local, usa un nombre como `.env.db.local`, que ya está excluido de git.
- El inicio de sesión anónimo actívalo en el panel web, como en el paso 2 anterior. `npx supabase config push` también lo activaría, pero subiría toda la configuración de `supabase/config.toml`. Si lo usas, revisa antes `npx supabase config diff`.

### 2. Configura la app

Copia la plantilla y completa los dos valores, que están en **Project Settings > API Keys**:

```bash
cp .env.example .env
```

Usa únicamente la clave publicable (`sb_publishable_...`). La app se niega a iniciar si detecta una clave secreta. El `.env` está excluido de git y no debe subirse.

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
| `npm run lint` | Revisa el estilo del código |
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
supabase/config.toml     Configuración del proyecto para la CLI
supabase/migrations/     Bucket, tabla y reglas de acceso
scripts/                 Verificación de seguridad
tests/                   Pruebas de validación
docs/                    Documentación de la actividad
docs/evidencias/         Capturas y salida de las pruebas
```
