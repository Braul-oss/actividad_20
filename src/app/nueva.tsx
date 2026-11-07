import { ComponentRef, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, colores, FotoRemota, Mensaje } from '../components/ui';
import {
  crearIncidencia,
  EtapaCarga,
  FotoValidada,
  IncidenciaConFoto,
  mensajeDeError,
} from '../lib/incidencias';
import { leerBytes } from '../lib/plataforma';
import { excedeTamano, formatearTamano, validarArchivo, validarFormulario } from '../lib/validacion';

type FotoSeleccionada = FotoValidada & { uri: string };

const TEXTO_ETAPA: Record<EtapaCarga, string> = {
  subiendo: 'Transfiriendo la fotografía a la nube…',
  registrando: 'Guardando la referencia de la incidencia…',
  recuperando: 'Recuperando el enlace de la imagen…',
};

export default function NuevaIncidencia() {
  const router = useRouter();
  const margenes = useSafeAreaInsets();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [foto, setFoto] = useState<FotoSeleccionada | null>(null);
  const [etapa, setEtapa] = useState<EtapaCarga | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<IncidenciaConFoto | null>(null);
  const desplazamiento = useRef<ComponentRef<typeof ScrollView>>(null);
  const mostrarFinal = useRef(false);

  function alCambiarContenido() {
    // La vista previa, los errores y el progreso aparecen al final del formulario.
    if (mostrarFinal.current) {
      mostrarFinal.current = false;
      desplazamiento.current?.scrollToEnd({ animated: true });
    }
  }

  async function procesarArchivo(uri: string, tamanoDeclarado?: number | null) {
    mostrarFinal.current = true;
    setError(null);
    setFoto(null);
    if (excedeTamano(tamanoDeclarado)) {
      setError(`La imagen pesa ${formatearTamano(tamanoDeclarado as number)}. El máximo es 5 MB.`);
      return;
    }
    try {
      const bytes = await leerBytes(uri);
      const validacion = validarArchivo(bytes);
      if (!validacion.ok) {
        setError(validacion.motivo);
        return;
      }
      setFoto({
        uri,
        bytes,
        mime: validacion.mime,
        extension: validacion.extension,
        tamano: validacion.tamano,
      });
    } catch {
      setError('No se pudo leer el archivo seleccionado.');
    }
  }

  async function elegirDeGaleria() {
    const seleccion = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!seleccion.canceled) {
      await procesarArchivo(seleccion.assets[0].uri, seleccion.assets[0].fileSize);
    }
  }

  async function tomarFoto() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      setError('Sin permiso de cámara. Puedes activarlo en los ajustes del dispositivo.');
      return;
    }
    const captura = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!captura.canceled) {
      await procesarArchivo(captura.assets[0].uri, captura.assets[0].fileSize);
    }
  }

  async function elegirArchivo() {
    const seleccion = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!seleccion.canceled) {
      await procesarArchivo(seleccion.assets[0].uri, seleccion.assets[0].size);
    }
  }

  async function enviar() {
    const errorFormulario = validarFormulario(titulo, descripcion);
    if (errorFormulario || !foto) {
      mostrarFinal.current = true;
      setError(errorFormulario ?? 'Selecciona una fotografía antes de enviar.');
      return;
    }
    mostrarFinal.current = true;
    setError(null);
    try {
      setResultado(await crearIncidencia({ titulo, descripcion, ubicacion }, foto, setEtapa));
    } catch (e) {
      mostrarFinal.current = true;
      setError(mensajeDeError(e));
    } finally {
      setEtapa(null);
    }
  }

  if (resultado) {
    return (
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingBottom: margenes.bottom + 24 }]}>
        <Mensaje tipo="exito">Carga exitosa. La fotografía ya está en la nube.</Mensaje>
        <Text style={estilos.seccion}>Imagen recuperada de la nube</Text>
        <FotoRemota url={resultado.foto_url} />
        <Text style={estilos.etiqueta}>Referencia guardada en la base de datos</Text>
        <Text selectable style={estilos.valor}>{resultado.foto_path}</Text>
        <Text style={estilos.etiqueta}>Tipo y tamaño</Text>
        <Text style={estilos.valor}>{resultado.foto_mime} · {formatearTamano(resultado.foto_tamano_bytes)}</Text>
        <Text style={estilos.etiqueta}>URL firmada temporal (vence en 15 minutos)</Text>
        <Text numberOfLines={3} selectable style={estilos.valor}>{resultado.foto_url}</Text>
        <Boton titulo="Ver mis incidencias" onPress={() => router.dismissTo('/')} />
      </ScrollView>
    );
  }

  const cargando = etapa !== null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.raiz}>
      <ScrollView
        contentContainerStyle={[estilos.contenido, { paddingBottom: margenes.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={alCambiarContenido}
        ref={desplazamiento}
      >
        <Text style={estilos.etiqueta}>Título</Text>
        <TextInput
          editable={!cargando}
          maxLength={120}
          onChangeText={setTitulo}
          placeholder="Ej. Fuga de agua en el pasillo"
          placeholderTextColor={colores.secundario}
          style={estilos.campo}
          value={titulo}
        />

        <Text style={estilos.etiqueta}>Descripción</Text>
        <TextInput
          editable={!cargando}
          maxLength={2000}
          multiline
          onChangeText={setDescripcion}
          placeholder="Qué ocurrió y desde cuándo"
          placeholderTextColor={colores.secundario}
          style={[estilos.campo, estilos.campoLargo]}
          textAlignVertical="top"
          value={descripcion}
        />

        <Text style={estilos.etiqueta}>Ubicación (opcional)</Text>
        <TextInput
          editable={!cargando}
          maxLength={120}
          onChangeText={setUbicacion}
          placeholder="Ej. Edificio B, planta 2"
          placeholderTextColor={colores.secundario}
          style={estilos.campo}
          value={ubicacion}
        />

        <Text style={estilos.seccion}>Fotografía</Text>
        <Text style={estilos.ayuda}>JPG, PNG o WEBP. Máximo 5 MB.</Text>
        <View style={estilos.fila}>
          <View style={estilos.celda}>
            <Boton deshabilitado={cargando} onPress={elegirDeGaleria} titulo="Galería" variante="secundario" />
          </View>
          <View style={estilos.celda}>
            <Boton deshabilitado={cargando} onPress={tomarFoto} titulo="Cámara" variante="secundario" />
          </View>
          <View style={estilos.celda}>
            <Boton deshabilitado={cargando} onPress={elegirArchivo} titulo="Archivos" variante="secundario" />
          </View>
        </View>

        {foto && (
          <View style={estilos.vistaPrevia}>
            <Image
              accessibilityLabel="Vista previa de la fotografía"
              resizeMode="cover"
              source={{ uri: foto.uri }}
              style={estilos.imagen}
            />
            <Text style={estilos.ayuda}>
              Vista previa · Archivo válido: {foto.mime} · {formatearTamano(foto.tamano)}
            </Text>
          </View>
        )}

        {error && <Mensaje tipo="error">{error}</Mensaje>}

        {cargando ? (
          <View style={estilos.progreso}>
            <ActivityIndicator color={colores.primario} />
            <Text style={estilos.progresoTexto}>{TEXTO_ETAPA[etapa]}</Text>
          </View>
        ) : (
          <Boton onPress={enviar} titulo={error && foto ? 'Reintentar envío' : 'Enviar incidencia'} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: { padding: 16, gap: 10 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginTop: 4 },
  seccion: { fontSize: 17, fontWeight: '600', color: colores.texto, marginTop: 10 },
  ayuda: { fontSize: 14, color: colores.secundario },
  valor: { fontSize: 14, color: colores.secundario },
  campo: {
    minHeight: 48,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colores.texto,
  },
  campoLargo: { minHeight: 100 },
  fila: { flexDirection: 'row', gap: 8 },
  celda: { flex: 1 },
  vistaPrevia: { gap: 6 },
  imagen: { width: '100%', height: 220, borderRadius: 10, backgroundColor: colores.borde },
  progreso: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  progresoTexto: { flex: 1, fontSize: 15, color: colores.texto },
});
