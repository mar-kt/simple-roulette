/**
 * Tipos y modelos de datos fundamentales de la aplicación.
 * Diseño genérico y extensible con soporte para plantillas y modos personalizados.
 */

export interface RouletteItem<T = Record<string, unknown>> {
  id: string | number;
  label: string;          // Texto principal visible (ej: nombre, premio, tarea)
  subtitle?: string;      // Información secundaria opcional (ej: usuario, categoría, stock)
  url?: string;           // Enlace externo opcional (perfil social, detalle, ficha técnica)
  weight?: number;        // Peso o probabilidad relativa (por defecto: 1)
  category?: string;      // Categoría o agrupación opcional
  metadata?: T;           // Metadatos libres adicionales provenientes del Excel/JSON
}

export type AppLanguage = 'es' | 'en';

export interface ModePreset {
  id: string;
  name: string;              // Nombre del modo: "Redes Sociales", "Premios", etc.
  itemLabel: string;         // "¿Qué es el elemento?" -> "Participante", "Premio", "Opción"
  subtitleLabel: string;     // "¿Qué es el subtítulo?" -> "Usuario", "Categoría / Stock"
  subtitlePrefix: string;    // "@" para redes sociales, vacío para premios
  actionButtonText: string;  // "Ver Perfil", "Ver Ficha", "Ver Detalle"
  defaultTitle: string;      // Título sugerido
  defaultSubtitle: string;   // Subtítulo sugerido
  removeOnWin: boolean;      // Si se debe quitar al ganador por defecto
  isCustom?: boolean;        // Indica si fue creada por el usuario (permite borrarla)
}

export interface AppConfig {
  title: string;
  subtitle: string;
  language: AppLanguage;
  presetId: string;               // ID del modo activo ('social', 'prizes', 'decisions', o ID de usuario)
  itemLabelName: string;          // Nombre singular del elemento
  subtitleLabelName: string;      // Nombre del campo secundario
  subtitlePrefix: string;         // Prefijo opcional (ej: '@')
  actionButtonText: string;       // Texto del botón del enlace
  showSubtitle: boolean;          // Mostrar u ocultar el texto secundario en el carrete
  toDiscard: number;              // Cantidad de elementos a descartar antes del ganador
  enableTimer: boolean;           // Temporizador de cuenta regresiva
  timerDuration: number;          // Segundos del temporizador
  soundEnabled: boolean;          // Efectos de sonido sintéticos
  removeOnWin: boolean;           // Remover automáticamente de la lista al salir ganador
}

export type SpinPhase = 'idle' | 'spinning' | 'winner' | 'discarded';

export interface AppState {
  items: RouletteItem[];          // Lista completa original
  remainingItems: RouletteItem[]; // Elementos aún en juego
  winners: RouletteItem[];        // Historial de ganadores
  discarded: RouletteItem[];      // Historial de descartados
  currentItem: RouletteItem | null; // Elemento activo en el overlay
  phase: SpinPhase;
  countdown: number;              // Segundos restantes del timer activo
  config: AppConfig;
  lastSkippedHeader?: string;     // Guarda si se ignoró un título al cargar Excel
}
