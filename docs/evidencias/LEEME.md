# Origen de estas evidencias

## Contra el proyecto en la nube

- `08-salida-nube.txt`: salida real de `npm run verificar:seguridad` contra el proyecto `reporte-incidencias` en Supabase, el 7 de noviembre de 2026. Pasaron las 17 comprobaciones.

## Capturas del prototipo local

Las capturas en PNG se tomaron de forma automatizada el 7 de noviembre de 2026, antes de conectar el proyecto a la nube:

- **App:** versión web del proyecto en Microsoft Edge, con tamaño de teléfono. No es la app en un dispositivo Android.
- **Servicio:** Supabase ejecutado localmente en Docker (`http://127.0.0.1:54321`). No es el proyecto en la nube.
- **Imagen:** archivo de prueba generado por un script, no una fotografía real.
- **Captura 05:** se cerró la pestaña y se abrió otra con la misma sesión guardada.
- **Captura 08 (`08-verificar-seguridad.png`):** es una imagen generada con la salida del script contra el servicio local, no una captura de la terminal.

## Pendientes

La actividad pide una app móvil y un servicio en la nube, así que conviene sustituir las capturas locales antes de entregarlas:

- **Capturas 01, 02, 05, 06 y 07:** repetirlas con la app en el teléfono (Expo Go) conectada al proyecto en la nube.
- **Capturas 03 y 04 (`03-archivo-en-supabase.png`, `04-tabla-incidencias.png`):** tomarlas del panel de Supabase. Muestran el archivo en Storage > `incidencias-fotos` y la fila en Table Editor > `incidencias`.
- **Captura 08:** tomar una captura real de la terminal al ejecutar `npm run verificar:seguridad`.
