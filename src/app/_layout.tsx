import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useNetworkState } from 'expo-network';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Boton, colores, Mensaje } from '../components/ui';
import { asegurarSesion, mensajeDeError } from '../lib/incidencias';
import { errorDeConfiguracion } from '../lib/supabase';

export default function Layout() {
  const [lista, setLista] = useState(false);
  const [error, setError] = useState<string | null>(errorDeConfiguracion);
  const [intento, setIntento] = useState(0);
  const red = useNetworkState();
  const sinConexion = red.isConnected === false || red.isInternetReachable === false;

  useEffect(() => {
    if (errorDeConfiguracion) return;
    let vigente = true;
    asegurarSesion().then(
      () => { if (vigente) setLista(true); },
      (e) => { if (vigente) setError(mensajeDeError(e)); },
    );
    return () => { vigente = false; };
  }, [intento]);

  if (!lista) {
    return (
      <View style={estilos.centrado}>
        {error ? (
          <>
            <Mensaje tipo="error">{error}</Mensaje>
            {!errorDeConfiguracion && (
              <Boton
                titulo="Reintentar"
                onPress={() => {
                  setError(null);
                  setIntento((n) => n + 1);
                }}
              />
            )}
          </>
        ) : (
          <>
            <ActivityIndicator color={colores.primario} size="large" />
            <Text style={estilos.texto}>Iniciando sesión segura…</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={estilos.raiz}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.superficie },
          headerTintColor: colores.texto,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Mis incidencias' }} />
        <Stack.Screen name="nueva" options={{ title: 'Nueva incidencia' }} />
        <Stack.Screen name="incidencia/[id]" options={{ title: 'Detalle de incidencia' }} />
      </Stack>
      {sinConexion && (
        <View style={estilos.bandaSinConexion}>
          <Text style={estilos.bandaTexto}>Sin conexión a internet</Text>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colores.fondo },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 16,
    padding: 24,
    backgroundColor: colores.fondo,
  },
  texto: { textAlign: 'center', color: colores.secundario, fontSize: 15 },
  bandaSinConexion: { backgroundColor: colores.avisoFondo, paddingVertical: 10, paddingBottom: 18 },
  bandaTexto: { color: colores.aviso, textAlign: 'center', fontWeight: '600' },
});
