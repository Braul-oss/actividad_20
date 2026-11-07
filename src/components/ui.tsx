import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export const colores = {
  fondo: '#F4F6F8',
  superficie: '#FFFFFF',
  texto: '#16202A',
  secundario: '#5B6875',
  borde: '#D8DEE4',
  primario: '#0B5CAD',
  exito: '#14703F',
  exitoFondo: '#E6F4EC',
  error: '#B3261E',
  errorFondo: '#FBEAE9',
  aviso: '#7A4F00',
  avisoFondo: '#FFF3D6',
};

type BotonProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
};

export function Boton({ titulo, onPress, variante = 'primario', deshabilitado }: BotonProps) {
  const primario = variante === 'primario';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        primario ? estilos.botonPrimario : estilos.botonSecundario,
        pressed && estilos.presionado,
        deshabilitado && estilos.deshabilitado,
      ]}
    >
      <Text style={[estilos.botonTexto, !primario && estilos.botonTextoSecundario]}>{titulo}</Text>
    </Pressable>
  );
}

export function Mensaje({ tipo, children }: { tipo: 'exito' | 'error' | 'aviso'; children: string }) {
  const fondo = { exito: colores.exitoFondo, error: colores.errorFondo, aviso: colores.avisoFondo }[tipo];
  const color = { exito: colores.exito, error: colores.error, aviso: colores.aviso }[tipo];
  return (
    <View accessibilityLiveRegion="polite" style={[estilos.mensaje, { backgroundColor: fondo }]}>
      <Text style={{ color, fontSize: 15, lineHeight: 21 }}>{children}</Text>
    </View>
  );
}

export function FotoRemota({ url, alto = 220 }: { url: string | null; alto?: number }) {
  const [urlFallida, setUrlFallida] = useState<string | null>(null);

  if (!url || urlFallida === url) {
    return (
      <View style={[estilos.fotoVacia, { height: alto }]}>
        <Text style={estilos.fotoVaciaTexto}>No se pudo cargar la imagen. Actualiza para generar un nuevo enlace.</Text>
      </View>
    );
  }
  return (
    <Image
      accessibilityLabel="Fotografía de la incidencia"
      onError={() => setUrlFallida(url)}
      resizeMode="cover"
      source={{ uri: url }}
      style={[estilos.foto, { height: alto }]}
    />
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPrimario: { backgroundColor: colores.primario },
  botonSecundario: { backgroundColor: colores.superficie, borderWidth: 1, borderColor: colores.borde },
  botonTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  botonTextoSecundario: { color: colores.primario },
  presionado: { opacity: 0.8 },
  deshabilitado: { opacity: 0.5 },
  mensaje: { borderRadius: 10, padding: 12 },
  foto: { width: '100%', borderRadius: 10, backgroundColor: colores.borde },
  fotoVacia: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: colores.borde,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fotoVaciaTexto: { color: colores.secundario, textAlign: 'center' },
});
