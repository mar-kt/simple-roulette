import { AppConfig, AppState, ModePreset, RouletteItem, SpinPhase } from './types';

const STORAGE_KEY_CONFIG = 'roulette_config_v1';
const STORAGE_KEY_ITEMS = 'roulette_items_v1';

const DEFAULT_CONFIG: AppConfig = {
  title: 'Ruleta de Sorteos',
  subtitle: 'Carga tus elementos para comenzar',
  language: 'es',
  presetId: 'general',
  itemLabelName: 'Elemento',
  subtitleLabelName: 'Información secundaria',
  subtitlePrefix: '',
  actionButtonText: 'Ver Enlace',
  showSubtitle: true,
  toDiscard: 0,
  enableTimer: false,
  timerDuration: 30,
  soundEnabled: true,
  removeOnWin: true,
};

function loadStoredConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function loadStoredItems(): RouletteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

const initialSavedItems = loadStoredItems();

const initialState: AppState = {
  items: initialSavedItems,
  remainingItems: [...initialSavedItems],
  winners: [],
  discarded: [],
  currentItem: null,
  phase: 'idle',
  countdown: 0,
  config: loadStoredConfig(),
};

type Listener = (state: AppState) => void;

class Store {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor(initial: AppState) {
    this.state = initial;
  }

  getState(): Readonly<AppState> {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(patch: Partial<AppState>) {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // --- ACCIONES DE DOMINIO ---

  /**
   * Carga una nueva lista de elementos en la ruleta.
   */
  setItems(items: RouletteItem[], skippedHeader?: string) {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    this.setState({
      items,
      remainingItems: [...items],
      winners: [],
      discarded: [],
      currentItem: null,
      phase: 'idle',
      lastSkippedHeader: skippedHeader,
    });
  }

  /**
   * Agrega un nuevo elemento individual a la lista en juego.
   */
  addItem(label: string, subtitle?: string, url?: string) {
    const trimmed = label.trim();
    if (!trimmed) return;

    const newItem: RouletteItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      label: trimmed,
      subtitle: subtitle?.trim() || undefined,
      url: url?.trim() || undefined,
    };

    const updatedItems = [...this.state.items, newItem];
    const updatedRemaining = [...this.state.remainingItems, newItem];

    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updatedItems));
    this.setState({
      items: updatedItems,
      remainingItems: updatedRemaining,
    });
  }

  /**
   * Elimina un elemento de la lista activa y de la ruleta.
   */
  removeItem(id: string | number) {
    const updatedItems = this.state.items.filter((item) => item.id !== id);
    const updatedRemaining = this.state.remainingItems.filter((item) => item.id !== id);

    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updatedItems));
    this.setState({
      items: updatedItems,
      remainingItems: updatedRemaining,
    });
  }

  /**
   * Si se ignoró una primera fila como título (ej: "Nombre"), permite recuperarla e incluirla.
   */
  includeSkippedHeader() {
    if (!this.state.lastSkippedHeader) return;
    const headerLabel = this.state.lastSkippedHeader;
    this.addItem(headerLabel);
    this.setState({ lastSkippedHeader: undefined });
  }

  updateConfig(patch: Partial<AppConfig>) {
    const newConfig: AppConfig = { ...this.state.config, ...patch };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
    this.setState({ config: newConfig });
  }

  /**
   * Aplica una plantilla de modo (Preset), actualizando títulos, nombres y comportamiento.
   */
  applyPreset(preset: ModePreset) {
    this.updateConfig({
      presetId: preset.id,
      title: preset.defaultTitle,
      subtitle: preset.defaultSubtitle,
      itemLabelName: preset.itemLabel,
      subtitleLabelName: preset.subtitleLabel,
      subtitlePrefix: preset.subtitlePrefix,
      actionButtonText: preset.actionButtonText,
      removeOnWin: preset.removeOnWin,
    });
  }

  setPhase(phase: SpinPhase, currentItem: RouletteItem | null = null) {
    this.setState({ phase, currentItem });
  }

  recordDiscarded(item: RouletteItem) {
    const updatedDiscarded = [item, ...this.state.discarded];
    const updatedRemaining = this.state.remainingItems.filter((i) => i.id !== item.id);
    this.setState({
      discarded: updatedDiscarded,
      remainingItems: updatedRemaining,
      currentItem: item,
      phase: 'discarded',
    });
  }

  recordWinner(item: RouletteItem) {
    const updatedWinners = [item, ...this.state.winners];
    let updatedRemaining = this.state.remainingItems;

    if (this.state.config.removeOnWin) {
      updatedRemaining = updatedRemaining.filter((i) => i.id !== item.id);
    }

    this.setState({
      winners: updatedWinners,
      remainingItems: updatedRemaining,
      currentItem: item,
      phase: 'winner',
      countdown: this.state.config.enableTimer ? this.state.config.timerDuration : 0,
    });
  }

  removeWinner(id: string | number) {
    const winnerToRemove = this.state.winners.find((w) => w.id === id);
    if (!winnerToRemove) return;

    const winners = this.state.winners.filter((w) => w.id !== id);
    const alreadyInRemaining = this.state.remainingItems.some((i) => i.id === id);
    const remainingItems = alreadyInRemaining
      ? this.state.remainingItems
      : [...this.state.remainingItems, winnerToRemove];

    this.setState({ winners, remainingItems });
  }

  removeDiscarded(id: string | number) {
    const discardedToRemove = this.state.discarded.find((d) => d.id === id);
    if (!discardedToRemove) return;

    const discarded = this.state.discarded.filter((d) => d.id !== id);
    const alreadyInRemaining = this.state.remainingItems.some((i) => i.id === id);
    const remainingItems = alreadyInRemaining
      ? this.state.remainingItems
      : [...this.state.remainingItems, discardedToRemove];

    this.setState({ discarded, remainingItems });
  }

  setCountdown(countdown: number) {
    this.setState({ countdown });
  }

  resetGame() {
    this.setState({
      remainingItems: [...this.state.items],
      winners: [],
      discarded: [],
      currentItem: null,
      phase: 'idle',
      countdown: 0,
    });
  }
}

export const store = new Store(initialState);
