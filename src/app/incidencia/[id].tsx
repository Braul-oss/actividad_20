import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, FotoRemota, Mensaje } from '../../components/ui';
import { IncidenciaConFoto, mensajeDeError, obtenerIncidencia } from '../../lib/incidencias';
import { formatearTamano } from '../../lib/validacion';

export default function DetalleIncidencia() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const margenes = useSafeAreaInsets();
  const [incidencia, setIncidencia] = useState<IncidenciaConFoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerIncidencia(id)
      .then(
        (datos) => {
          if (!vigente) return;
          setIncidencia(datos);
          setError(null);
        },
        (e) => { if (vigente) setError(mensajeDeError(e)); },
      )
      .finally(() => { if (vigente) setActualizando(false); });
    return () => { vigente = false; };
  }, [id, version]);

  function actualizar() {
    setActualizando(true);
    setVersion((v) => v + 1);
  }

  return (
    <ScrollView
      contentContainerStyle={[estilos.contenido, { paddingBottom: margenes.bottom + 24 }]}
      refreshControl={<RefreshControl onRefresh={actualizar} refreshing={actualizando} />}
    >
      {error && <Mensaje tipo="error">{error}</Mensaje>}
      {!incidencia && !error && <ActivityIndicator color={colores.primario} size="large" />}
      {incidencia && (
        <>
          <FotoRemota alto={280} url={incidencia.foto_url} />
          <Text style={estilos.titulo}>{incidencia.titulo}</Text>
          <Text style={estilos.descripcion}>{incidencia.descripcion}</Text>
          {incidencia.ubicacion && <Text style={estilos.valor}>Ubicación: {incidencia.ubicacion}</Text>}
          <Text style={estilos.valor}>Registrada: {new Date(incidencia.creado_en).toLocaleString('es-MX')}</Text>

          <Text style={estilos.seccion}>Datos guardados en la base de datos</Text>
          <Text style={estilos.etiqueta}>Identificador</Text>
          <Text selectable style={estilos.valor}>{incidencia.id}</Text>
          <Text style={estilos.etiqueta}>Referencia del archivo</Text>
          <Text selectable style={estilos.valor}>{incidencia.foto_path}</Text>
          <Text style={estilos.etiqueta}>Tipo y tamaño</Text>
          <Text style={estilos.valor}>{incidencia.foto_mime} · {formatearTamano(incidencia.foto_tamano_bytes)}</Text>
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, gap: 8 },
  titulo: { fontSize: 21, fontWeight: '700', color: colores.texto, marginTop: 8 },
  descripcion: { fontSize: 16, lineHeight: 23, color: colores.texto },
  seccion: { fontSize: 17, fontWeight: '600', color: colores.texto, marginTop: 16 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: colores.texto, marginTop: 4 },
  valor: { fontSize: 14, color: colores.secundario },
});
