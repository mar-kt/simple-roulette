import { ModePreset } from './types';

const STORAGE_KEY_PRESETS = 'roulette_custom_presets_v1';

export const DEFAULT_PRESETS: ModePreset[] = [
  {
    id: 'social',
    name: 'Redes Sociales (Instagram, Twitch, X)',
    itemLabel: 'Participante',
    subtitleLabel: 'Usuario de red social',
    subtitlePrefix: '@',
    actionButtonText: 'Ver Perfil',
    defaultTitle: 'Sorteo en Vivo',
    defaultSubtitle: 'Gira la ruleta para elegir al ganador',
    removeOnWin: true, // El ganador se retira para no ganar dos veces
    isCustom: false,
  },
  {
    id: 'prizes',
    name: 'Sorteo de Premios / Regalos',
    itemLabel: 'Premio',
    subtitleLabel: 'Categoría o Stock',
    subtitlePrefix: '',
    actionButtonText: 'Ver Ficha de Premio',
    defaultTitle: 'Ruleta de Premios',
    defaultSubtitle: 'Descubre qué premio sale hoy',
    removeOnWin: true, // El premio que sale se agota
    isCustom: false,
  },
  {
    id: 'decisions',
    name: 'Toma de Decisiones / Juegos',
    itemLabel: 'Opción',
    subtitleLabel: 'Detalle',
    subtitlePrefix: '',
    actionButtonText: 'Ver Detalle',
    defaultTitle: '¿Qué elegimos hoy?',
    defaultSubtitle: 'La suerte decide por ti',
    removeOnWin: false, // Las opciones de decisión se pueden repetir
    isCustom: false,
  },
  {
    id: 'general',
    name: 'General / Personalizado',
    itemLabel: 'Elemento',
    subtitleLabel: 'Información secundaria',
    subtitlePrefix: '',
    actionButtonText: 'Ver Enlace',
    defaultTitle: 'Ruleta de Sorteos',
    defaultSubtitle: 'Carga tus elementos para comenzar',
    removeOnWin: true,
    isCustom: false,
  },
];

function loadCustomPresets(): ModePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRESETS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: ModePreset[]) {
  localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
}

/**
 * Devuelve todas las plantillas disponibles (las de fábrica + las creadas por el usuario).
 */
export function getAllPresets(): ModePreset[] {
  const custom = loadCustomPresets();
  return [...DEFAULT_PRESETS, ...custom];
}

/**
 * Busca una plantilla por su ID, o devuelve la general como respaldo.
 */
export function getPresetById(id: string): ModePreset {
  const all = getAllPresets();
  return all.find((p) => p.id === id) || DEFAULT_PRESETS[3]; // 'general'
}

/**
 * Guarda una nueva plantilla personalizada creada por el usuario.
 */
export function createCustomPreset(data: Omit<ModePreset, 'id' | 'isCustom'>): ModePreset {
  const newPreset: ModePreset = {
    ...data,
    id: `custom_${Date.now()}`,
    isCustom: true,
  };

  const custom = loadCustomPresets();
  custom.push(newPreset);
  saveCustomPresets(custom);

  return newPreset;
}

/**
 * Elimina una plantilla personalizada creada por el usuario.
 */
export function deleteCustomPreset(id: string): boolean {
  const custom = loadCustomPresets();
  const filtered = custom.filter((p) => p.id !== id);
  if (filtered.length !== custom.length) {
    saveCustomPresets(filtered);
    return true;
  }
  return false;
}
