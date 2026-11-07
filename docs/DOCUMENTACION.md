# Documentación de la actividad

## Problema resuelto

**¿Cómo administrar archivos multimedia desde una aplicación móvil sin guardar las imágenes en la base de datos?**

La fotografía se sube a un servicio de almacenamiento en la nube y la base de datos conserva solo su referencia (`foto_path`). Cuando la app necesita mostrar la imagen, usa esa referencia para pedir una URL firmada temporal.

## Parte 1. Servicio de almacenamiento

Se eligió **Supabase Storage** porque combina buckets privados, reglas de acceso y una base de datos para relacionar cada imagen con su incidencia.

| Dato | Configuración |
| --- | --- |
| Nombre del servicio | Supabase Storage |
| Espacio de almacenamiento | Bucket privado `incidencias-fotos` |
| Tipos de archivo permitidos | `image/jpeg`, `image/png`, `image/webp` |
| Tamaño máximo | 5 MB por archivo en el bucket. El plan gratuito admite hasta 50 MB como límite global |
| Mecanismo de carga | Carga estándar con `@supabase/supabase-js`, sobre HTTPS, con el token de sesión del usuario |
| Condiciones de acceso | Bucket no público. Reglas RLS que limitan a cada usuario a su carpeta. Lectura mediante URLs firmadas de 15 minutos |

Supabase recomienda la carga estándar para archivos de hasta 6 MB, por lo que es adecuada para el límite de 5 MB.

## Parte 2. Funcionalidad móvil

| Requisito | Dónde se cumple |
| --- | --- |
| Pantalla para registrar una incidencia | `src/app/nueva.tsx` |
| Selección desde galería o cámara | `elegirDeGaleria` y `tomarFoto` en `src/app/nueva.tsx` |
| Vista previa | `src/app/nueva.tsx`, se muestra después de validar el archivo |
| Carga a la nube | `crearIncidencia` en `src/lib/incidencias.ts` |
| Resultado de la transferencia | Etapas de progreso, mensaje de éxito o de error en `src/app/nueva.tsx` |
| Dirección o referencia del archivo | `foto_path` y URL firmada, visibles en la pantalla de resultado |

La opción **Archivos** usa el selector de documentos. Permite elegir cualquier tipo de archivo, lo que sirve para probar el rechazo de formatos no permitidos.

## Parte 3. Consulta y visualización

1. **URL o referencia:** `foto_path` se guarda en la base de datos. La URL firmada se genera cuando se necesita.
2. **Imagen remota:** las pantallas de lista y detalle cargan la imagen desde la URL firmada.
3. **Después de reabrir la app:** la sesión se conserva en el dispositivo y la lista se vuelve a consultar en la nube, por lo que las imágenes siguen disponibles.
4. **Información en la base de datos (tabla `incidencias`):**

| Columna | Para qué sirve |
| --- | --- |
| `id` | Identifica la incidencia |
| `usuario_id` | Relaciona la incidencia con su propietario y permite aplicar las reglas de acceso |
| `titulo`, `descripcion`, `ubicacion` | Datos del reporte |
| `foto_path` | Referencia del archivo en el bucket; es el dato que une la imagen con la incidencia |
| `foto_mime`, `foto_tamano_bytes` | Tipo y tamaño, útiles para consultas y auditoría sin abrir el archivo |
| `creado_en` | Fecha de registro |

**No se guarda la URL firmada** porque caduca. Tampoco se guarda la imagen ni su contenido en Base64.

## Parte 4. Mecanismos de seguridad

| Mecanismo | Qué protege | Dónde se aplica |
| --- | --- | --- |
| Clave publicable en la app | No se incluye ninguna clave administrativa. La clave publicable está sujeta a las reglas RLS | `.env`, `src/lib/supabase.ts` |
| Bloqueo de claves administrativas | La app no inicia si se configura una clave secreta o `service_role` | `esClaveAdministrativa` |
| `.env` fuera del repositorio | Los datos del proyecto no se suben a Git | `.gitignore` |
| Sesión por usuario | Toda carga y consulta se asocia a un usuario autenticado | `asegurarSesion` |
| Bucket privado | Una URL pública no entrega el archivo | Migración SQL |
| Reglas RLS en Storage | Cada usuario solo lee, sube y borra en su carpeta | Migración SQL |
| Reglas RLS en la tabla | Cada usuario solo ve y registra sus incidencias, y solo puede referenciar fotos de su carpeta | Migración SQL |
| URLs firmadas de 15 minutos | El acceso a la imagen caduca | `src/lib/incidencias.ts` |
| Validación por contenido en la app | Revisa los primeros bytes del archivo, de modo que renombrar un PDF a `.jpg` no sirve para enviarlo | `src/lib/validacion.ts` |
| Límites en el servidor | El bucket rechaza tipos y tamaños no permitidos aunque se omita la validación de la app | Migración SQL |
| Nombres generados | El nombre del archivo es un UUID, no el nombre original | `crearIncidencia` |
| HTTPS | Cifra la transferencia | Supabase |

### Limitaciones del prototipo

- **Sesión anónima:** identifica a cada instalación sin pedir contraseña, pero al desinstalar la app se pierde el acceso a sus incidencias. Una versión real debe usar cuentas de usuario.
- **URL firmada:** quien tenga el enlace puede ver la imagen hasta que caduque.
- **Validación en el servidor:** el bucket comprueba el tipo declarado en la carga. La revisión del contenido real se hace en la app.
- **Cargas interrumpidas:** si se agota el tiempo de espera pero la carga termina en el servidor, puede quedar un archivo sin registro. El reintento usa otro nombre y no sobrescribe nada.

### Comprobaciones

Ejecuta `npm run verificar:seguridad` con tu `.env` configurado. Guarda una captura de la salida como evidencia. El script usa solo la clave publicable y crea dos usuarios anónimos de prueba.

| Prueba solicitada | Cómo realizarla | Resultado esperado |
| --- | --- | --- |
| Formato no permitido | En la app: **Archivos** y elige un PDF. Además, lo intenta el script | La app muestra «Formato no permitido» y no aparece la vista previa. El servicio también lo rechaza |
| Pérdida de conexión | Selecciona una foto, activa el modo avión y presiona **Enviar incidencia** | Aparece la banda «Sin conexión a internet» y un mensaje de error. El formulario conserva los datos. Al volver la conexión, **Reintentar envío** completa la carga |
| Restricciones de acceso | Script | Sin sesión u otro usuario: acceso rechazado |
| Sin claves privadas | Busca `sb_secret_` y `service_role` en `src/`. Coloca una clave secreta en `.env` para ver el bloqueo | Solo aparece en la función que las detecta. La app muestra el error de configuración |
| Reglas de almacenamiento | Supabase > Storage > Policies | Se ven las reglas `fotos_select_propias`, `fotos_insert_propias` y `fotos_delete_propias` |
| Archivos privados sin autorización | Script y, además, abre la URL pública en el navegador | La URL pública devuelve error. La URL firmada deja de funcionar al caducar |

Durante la prueba de conexión no recargues la app en Expo Go, porque el código se descarga de tu computadora y también necesita red.

## Parte 5. Evidencias

Guarda las capturas en `docs/evidencias/` con estos nombres:

| Entregable | Archivo sugerido | Qué debe verse |
| --- | --- | --- |
| Imagen seleccionada | `01-vista-previa.png` | Formulario con la vista previa |
| Carga exitosa | `02-carga-exitosa.png` | Mensaje de éxito con la referencia |
| Archivo en el servicio cloud | `03-archivo-en-supabase.png` | Supabase > Storage > `incidencias-fotos` con el archivo |
| Referencia en la base de datos | `04-tabla-incidencias.png` | Supabase > Table Editor > `incidencias` |
| Imagen recuperada | `05-imagen-recuperada.png` | Lista o detalle tras cerrar y reabrir la app |
| Formato no permitido | `06-formato-rechazado.png` | Mensaje de rechazo |
| Sin conexión | `07-sin-conexion.png` | Banda y mensaje de error con el formulario conservado |
| Pruebas de seguridad | `08-verificar-seguridad.png` | Salida de `npm run verificar:seguridad` |

## Relación con los entregables

| Entregable | Ubicación |
| --- | --- |
| 1. Prototipo funcional | Este proyecto |
| 2. Código de selección y carga | `src/app/nueva.tsx`, `src/lib/incidencias.ts`, `src/lib/validacion.ts` |
| 3. Imagen seleccionada y carga exitosa | `docs/evidencias/01` y `02` |
| 4. Archivo en el servicio cloud | `docs/evidencias/03` |
| 5. Imagen recuperada | `docs/evidencias/05` |
| 6. Mecanismos de seguridad | Parte 4 de este documento |
