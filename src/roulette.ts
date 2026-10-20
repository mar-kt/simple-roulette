import confetti from 'canvas-confetti';
import { playDiscardSound, playTickSound, playWinnerSound } from './audio';
import { store } from './state';
import { RouletteItem } from './types';

export interface RouletteEngineOptions {
  containerElement: HTMLElement;
  itemHeight: number; // Altura en píxeles de cada elemento en el carrete (ej: 64)
  visibleItemsCount: number; // Cuántos elementos son visibles en la ventana (ej: 5)
}

export class RouletteEngine {
  private container: HTMLElement;
  private itemHeight: number;
  private visibleItemsCount: number;
  private isSpinning: boolean = false;
  private currentAnimationId: number | null = null;
  private timerIntervalId: number | null = null;

  constructor(options: RouletteEngineOptions) {
    this.container = options.containerElement;
    this.itemHeight = options.itemHeight;
    this.visibleItemsCount = options.visibleItemsCount;
  }

  get spinning(): boolean {
    return this.isSpinning;
  }

  /**
   * Renderiza el estado estático inicial del carrete.
   */
  renderInitial(items: RouletteItem[], showSubtitle: boolean) {
    this.container.innerHTML = '';
    this.container.style.transform = 'translateY(0px)';

    if (items.length === 0) return;

    // Llenar con items repetidos para que la ventana nunca esté vacía
    const count = Math.max(items.length, 12);
    for (let i = 0; i < count; i++) {
      const item = items[i % items.length];
      const el = this.createItemElement(item, showSubtitle);
      this.container.appendChild(el);
    }
  }

  /**
   * Ejecuta el giro inercial con desaceleración natural.
   */
  spin(): Promise<RouletteItem | null> {
    const state = store.getState();
    const pool = state.remainingItems;

    if (pool.length === 0 || this.isSpinning) {
      return Promise.resolve(null);
    }

    this.isSpinning = true;
    store.setPhase('spinning');

    // 1. Elegir ganador aleatoriamente
    const chosenIndex = Math.floor(Math.random() * pool.length);
    const chosenItem = pool[chosenIndex];

    // 2. Construir la secuencia de elementos para la animación como una cinta continua:
    // Evita que aparezcan elementos duplicados pegados uno al lado del otro.
    const spinSteps = 38 + Math.floor(Math.random() * 8);
    const sequence: RouletteItem[] = [];

    let lastItem: RouletteItem | null = null;
    let poolIndex = chosenIndex;

    for (let i = 0; i < spinSteps; i++) {
      let nextItem: RouletteItem;
      if (pool.length > 1) {
        do {
          poolIndex = (poolIndex + 1) % pool.length;
          nextItem = pool[poolIndex];
        } while (nextItem.id === lastItem?.id);
      } else {
        nextItem = pool[0];
      }
      sequence.push(nextItem);
      lastItem = nextItem;
    }

    // Asegurar que el elemento inmediatamente anterior al ganador NO sea el mismo ganador
    if (pool.length > 1 && sequence[sequence.length - 1].id === chosenItem.id) {
      const alternate = pool.find((item) => item.id !== chosenItem.id) || pool[0];
      sequence[sequence.length - 1] = alternate;
    }

    // El elemento en el que se frena es exactamente el elegido
    sequence.push(chosenItem);

    // Padding inferior para que no quede espacio en blanco abajo
    let padIndex = pool.findIndex((item) => item.id === chosenItem.id);
    let lastPadItem = chosenItem;

    for (let i = 0; i < this.visibleItemsCount + 2; i++) {
      if (pool.length > 1) {
        do {
          padIndex = (padIndex + 1) % pool.length;
        } while (pool[padIndex].id === lastPadItem.id);
      }
      const padItem = pool[padIndex];
      sequence.push(padItem);
      lastPadItem = padItem;
    }

    // 3. Montar los elementos en el DOM del carrete
    this.container.innerHTML = '';
    for (const item of sequence) {
      this.container.appendChild(this.createItemElement(item, state.config.showSubtitle));
    }

    // Centrar la selección en la ranura activa entre las dos marcas:
    // La ventana tiene 5 elementos visibles (0, 1, 2, 3, 4). La ranura central es la 2.
    const centerSlotOffset = Math.floor(this.visibleItemsCount / 2);
    const targetY = -((spinSteps - centerSlotOffset) * this.itemHeight);
    const duration = 4200; // 4.2 segundos de animación
    const startTime = performance.now();

    let lastTickStep = -1;

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Curva de desaceleración suave cúbica / inercial (ease-out-cubic modificado)
        // Comienza rápido y frena progresivamente con gran naturalidad
        const easedProgress = 1 - Math.pow(1 - progress, 3.5);
        const currentY = targetY * easedProgress;

        this.container.style.transform = `translate3d(0, ${currentY}px, 0)`;

        // Reproducir sonido de clic mecánico al pasar cada elemento
        const currentStep = Math.floor(Math.abs(currentY) / this.itemHeight);
        if (currentStep !== lastTickStep) {
          lastTickStep = currentStep;
          playTickSound(500 + (currentStep % 4) * 50);
        }

        if (progress < 1) {
          this.currentAnimationId = requestAnimationFrame(animate);
        } else {
          // Animación completada
          this.container.style.transform = `translate3d(0, ${targetY}px, 0)`;
          this.isSpinning = false;
          this.handleSpinCompleted(chosenItem);
          resolve(chosenItem);
        }
      };

      this.currentAnimationId = requestAnimationFrame(animate);
    });
  }

  private handleSpinCompleted(item: RouletteItem) {
    const state = store.getState();
    const { toDiscard } = state.config;
    const isDiscard = state.discarded.length < toDiscard;

    if (isDiscard) {
      playDiscardSound();
      store.recordDiscarded(item);
    } else {
      playWinnerSound();
      this.triggerConfetti();
      store.recordWinner(item);

      // Si tiene temporizador activo, iniciar cuenta atrás
      if (state.config.enableTimer) {
        this.startCountdown();
      }
    }
  }

  private startCountdown() {
    this.stopCountdown();
    let currentSeconds = store.getState().config.timerDuration;
    store.setCountdown(currentSeconds);

    this.timerIntervalId = window.setInterval(() => {
      currentSeconds -= 1;
      store.setCountdown(currentSeconds);

      if (currentSeconds <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  private triggerConfetti() {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#0f172a', '#475569', '#94a3b8', '#0284c7', '#10b981'],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignorar si falla
    }
  }

  private createItemElement(item: RouletteItem, showSubtitle: boolean): HTMLElement {
    const el = document.createElement('div');
    el.className = 'slot-item';

    const label = document.createElement('div');
    label.className = 'slot-item-label';
    label.textContent = item.label;
    el.appendChild(label);

    if (showSubtitle && item.subtitle) {
      const sub = document.createElement('div');
      sub.className = 'slot-item-subtitle';
      const prefix = store.getState().config.subtitlePrefix || '';
      const text = prefix && !item.subtitle.startsWith(prefix) ? `${prefix}${item.subtitle}` : item.subtitle;
      sub.textContent = text;
      el.appendChild(sub);
    }

    return el;
  }

  destroy() {
    if (this.currentAnimationId !== null) {
      cancelAnimationFrame(this.currentAnimationId);
    }
    this.stopCountdown();
  }
}
