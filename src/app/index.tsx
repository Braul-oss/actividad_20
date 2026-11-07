import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton, colores, FotoRemota, Mensaje } from '../components/ui';
import { IncidenciaConFoto, listarIncidencias, mensajeDeError } from '../lib/incidencias';

export default function MisIncidencias() {
  const router = useRouter();
  const margenes = useSafeAreaInsets();
  const [incidencias, setIncidencias] = useState<IncidenciaConFoto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);

  const cargar = useCallback(async () => {
    setActualizando(true);
    try {
      setIncidencias(await listarIncidencias());
      setError(null);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setActualizando(false);
    }
  }, []);

  // Se consulta al abrir la pantalla: asi los datos vienen de la nube tras reabrir la app.
  useFocusEffect(useCallback(() => { void cargar(); }, [cargar]));

  return (
    <View style={estilos.raiz}>
      {error && <View style={estilos.error}><Mensaje tipo="error">{error}</Mensaje></View>}
      {incidencias === null && !error ? (
        <ActivityIndicator color={colores.primario} size="large" style={estilos.cargando} />
      ) : (
        <FlatList
          contentContainerStyle={estilos.lista}
          data={incidencias ?? []}
          keyExtractor={(i) => i.id}
          ListEmptyComponent={
            incidencias === null ? undefined : (
              <View style={estilos.vacio}>
                <Text style={estilos.vacioTitulo}>Aún no hay incidencias</Text>
                <Text style={estilos.secundario}>Registra la primera y adjunta una fotografía del problema.</Text>
              </View>
            )
          }
          refreshControl={<RefreshControl onRefresh={cargar} refreshing={actualizando} />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/incidencia/[id]', params: { id: item.id } })}
              style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}
            >
              <FotoRemota alto={170} url={item.foto_url} />
              <Text style={estilos.titulo}>{item.titulo}</Text>
              <Text numberOfLines={2} style={estilos.secundario}>{item.descripcion}</Text>
              <Text style={estilos.meta}>
                {[item.ubicacion, new Date(item.creado_en).toLocaleString('es-MX')].filter(Boolean).join(' · ')}
              </Text>
            </Pressable>
          )}
        />
      )}
      <View style={[estilos.pie, { paddingBottom: margenes.bottom + 12 }]}>
        <Boton titulo="Nueva incidencia" onPress={() => router.push('/nueva')} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  error: { paddingHorizontal: 16, paddingTop: 16 },
  cargando: { flex: 1 },
  lista: { padding: 16, gap: 16, flexGrow: 1 },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  vacioTitulo: { fontSize: 18, fontWeight: '600', color: colores.texto },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  presionada: { opacity: 0.85 },
  titulo: { fontSize: 17, fontWeight: '600', color: colores.texto, marginTop: 4 },
  secundario: { fontSize: 15, color: colores.secundario, lineHeight: 21, textAlign: 'left' },
  meta: { fontSize: 13, color: colores.secundario },
  pie: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colores.superficie,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },
});
