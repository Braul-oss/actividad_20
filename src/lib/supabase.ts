import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import './plataforma';
import { esClaveAdministrativa } from './validacion';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const clave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const BUCKET = 'incidencias-fotos';

export const errorDeConfiguracion: string | null = !url || !clave
  ? 'Falta configurar el archivo .env con la URL y la clave publicable de Supabase.'
  : esClaveAdministrativa(clave)
    ? 'La clave configurada es administrativa. Reemplázala por la clave publicable: una clave secreta nunca debe incluirse en la app.'
    : null;

export const supabase = createClient(
  errorDeConfiguracion ? 'https://sin-configurar.invalid' : url,
  errorDeConfiguracion ? 'sin-configurar' : clave,
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

AppState.addEventListener('change', (estado) => {
  if (estado === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
