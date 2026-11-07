# Origen de estas evidencias

Todas se tomaron el 7 de noviembre de 2026 contra el proyecto `reporte-incidencias` en Supabase (nube).

## App en el teléfono

- **Dispositivo:** Xiaomi Redmi Note 12S con Android 13, con la app abierta en Expo Go 58.
- **Método:** las capturas se tomaron desde la computadora por USB con `adb`.
- **Fotografía:** foto real de un cargador dañado, tomada con la cámara desde la app (captura 01). Para la prueba sin conexión se usó la misma foto, recortada de la captura 05 y elegida con "Archivos", para no abrir la galería personal del teléfono.

| Archivo | Qué muestra |
| --- | --- |
| `01-vista-previa.png` | Formulario con la foto validada (image/jpeg, 317 KB) |
| `02-carga-exitosa.png` | Carga exitosa, imagen recuperada de la nube, referencia en la base de datos y URL firmada |
| `05-imagen-recuperada.png` | Lista "Mis incidencias" después de cerrar Expo Go por completo y volver a abrir la app |
| `06-formato-rechazado.png` | Un PDF elegido con "Archivos" es rechazado: "Formato no permitido" |
| `07-sin-conexion.png` | En modo avión: banda "Sin conexión a internet", mensaje de error y formulario conservado |
| `07b-reintento-exitoso.png` | Al quitar el modo avión, "Reintentar envío" sube la misma incidencia sin volver a llenar el formulario |

## Terminal

- `08-verificar-seguridad-inicio.png` y `08-verificar-seguridad.png`: inicio y final de una misma ejecución de `npm run verificar:seguridad` en una ventana de la terminal. Se ven el servicio en la nube y las 17 comprobaciones aprobadas.
- `08-salida-nube.txt`: salida en texto de una ejecución anterior, también con 17 de 17 aprobadas.

## Panel de Supabase

- `03-archivo-en-supabase.png`: Storage > `incidencias-fotos`, con la carpeta del usuario, los dos archivos `.jpg` y la vista previa del cargador. Se recortaron la barra de pestañas del navegador y la barra de tareas.

## Pendientes

- `04-tabla-incidencias.png`: panel de Supabase > Table Editor > `incidencias`, con las filas "Cargador dañado" y "Cargador con cable pelado".
