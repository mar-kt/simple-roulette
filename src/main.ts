import { exportResultsToExcel, parseExcelFile, parseTextInput } from './excel';
import { t, TranslationKey } from './i18n';
import { createCustomPreset, deleteCustomPreset, getAllPresets, getPresetById } from './presets';
import { RouletteEngine } from './roulette';
import { store } from './state';
import { AppState, RouletteItem } from './types';

// Elementos del DOM
const reelElement = document.getElementById('slot-reel') as HTMLElement;
const btnSpin = document.getElementById('btn-spin') as HTMLButtonElement;
const textBtnSpin = document.getElementById('text-btn-spin') as HTMLElement;
const appTitle = document.getElementById('app-title') as HTMLElement;
const appSubtitle = document.getElementById('app-subtitle') as HTMLElement;
const poolCount = document.getElementById('pool-count') as HTMLElement;
const discardTargetBadge = document.getElementById('discard-target-badge') as HTMLElement;
const timerBadge = document.getElementById('timer-badge') as HTMLElement;
const timerNumber = document.getElementById('timer-number') as HTMLElement;

// Overlay
const resultOverlay = document.getElementById('result-overlay') as HTMLElement;
const resultBadge = document.getElementById('result-badge') as HTMLElement;
const resultTitle = document.getElementById('result-title') as HTMLElement;
const resultSubtitle = document.getElementById('result-subtitle') as HTMLElement;
const resultLink = document.getElementById('result-link') as HTMLAnchorElement;
const btnCloseOverlay = document.getElementById('btn-close-overlay') as HTMLButtonElement;

// Paneles de listas de resultados
const winnersListEl = document.getElementById('winners-list') as HTMLElement;
const winnersCountEl = document.getElementById('winners-count') as HTMLElement;
const discardedCard = document.getElementById('discarded-card') as HTMLElement;
const discardedListEl = document.getElementById('discarded-list') as HTMLElement;
const discardedCountEl = document.getElementById('discarded-count') as HTMLElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const btnExportResults = document.getElementById('btn-export-results') as HTMLButtonElement;

// Modales y botones superiores
const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
const btnUpload = document.getElementById('btn-upload') as HTMLButtonElement;
const btnQuickText = document.getElementById('btn-quick-text') as HTMLButtonElement;
const btnSettings = document.getElementById('btn-settings') as HTMLButtonElement;

const modalSettings = document.getElementById('modal-settings') as HTMLDialogElement;
const btnCloseSettings = document.getElementById('btn-close-settings') as HTMLButtonElement;
const settingsForm = document.getElementById('settings-form') as HTMLFormElement;

const modalQuickText = document.getElementById('modal-quick-text') as HTMLDialogElement;
const btnCloseQuick = document.getElementById('btn-close-quick') as HTMLButtonElement;
const btnCancelQuick = document.getElementById('btn-cancel-quick') as HTMLButtonElement;
const btnApplyQuick = document.getElementById('btn-apply-quick') as HTMLButtonElement;
const quickTextarea = document.getElementById('quick-textarea') as HTMLTextAreaElement;

// Modal de Ver y Editar Participantes
const btnOpenList = document.getElementById('btn-open-list') as HTMLButtonElement;
const modalItemsList = document.getElementById('modal-items-list') as HTMLDialogElement;
const btnCloseItemsList = document.getElementById('btn-close-items-list') as HTMLButtonElement;
const btnCloseItemsListBottom = document.getElementById('btn-close-items-list-bottom') as HTMLButtonElement;
const modalItemsCounter = document.getElementById('modal-items-counter') as HTMLElement;
const bannerSkippedHeader = document.getElementById('banner-skipped-header') as HTMLElement;
const skippedHeaderName = document.getElementById('skipped-header-name') as HTMLElement;
const btnRestoreHeader = document.getElementById('btn-restore-header') as HTMLButtonElement;
const formAddItem = document.getElementById('form-add-item') as HTMLFormElement;
const inputNewItemLabel = document.getElementById('input-new-item-label') as HTMLInputElement;
const inputNewItemSub = document.getElementById('input-new-item-sub') as HTMLInputElement;
const inputSearchItems = document.getElementById('input-search-items') as HTMLInputElement;
const editItemsContainer = document.getElementById('edit-items-container') as HTMLElement;

// Modal y Controles de Plantillas (Presets)
const selectPreset = document.getElementById('select-preset') as HTMLSelectElement;
const btnOpenCreatePreset = document.getElementById('btn-open-create-preset') as HTMLButtonElement;
const btnDeletePreset = document.getElementById('btn-delete-preset') as HTMLButtonElement;

const modalCreatePreset = document.getElementById('modal-create-preset') as HTMLDialogElement;
const btnCloseCreatePreset = document.getElementById('btn-close-create-preset') as HTMLButtonElement;
const btnCancelCreatePreset = document.getElementById('btn-cancel-create-preset') as HTMLButtonElement;
const formCreatePreset = document.getElementById('form-create-preset') as HTMLFormElement;
const inputPresetName = document.getElementById('input-preset-name') as HTMLInputElement;
const inputPresetItemLabel = document.getElementById('input-preset-item-label') as HTMLInputElement;
const inputPresetSubLabel = document.getElementById('input-preset-sub-label') as HTMLInputElement;
const inputPresetPrefix = document.getElementById('input-preset-prefix') as HTMLInputElement;
const inputPresetAction = document.getElementById('input-preset-action') as HTMLInputElement;
const checkPresetRemove = document.getElementById('check-preset-remove') as HTMLInputElement;

// Toast de notificación
const toastNotification = document.getElementById('toast-notification') as HTMLElement;
let toastTimer: number | null = null;

function showToast(message: string, duration: number = 3600) {
  if (!toastNotification) return;
  toastNotification.textContent = message;
  toastNotification.style.display = 'block';

  if (toastTimer !== null) {
    clearTimeout(toastTimer);
  }
  toastTimer = window.setTimeout(() => {
    toastNotification.style.display = 'none';
    toastTimer = null;
  }, duration);
}

// Inputs del formulario de configuración
const inputTitle = document.getElementById('input-title') as HTMLInputElement;
const inputSubtitle = document.getElementById('input-subtitle') as HTMLInputElement;
const selectLang = document.getElementById('select-lang') as HTMLSelectElement;
const inputToDiscard = document.getElementById('input-to-discard') as HTMLInputElement;
const inputTimer = document.getElementById('input-timer') as HTMLInputElement;
const checkTimer = document.getElementById('check-timer') as HTMLInputElement;
const checkSound = document.getElementById('check-sound') as HTMLInputElement;
const checkShowSub = document.getElementById('check-show-sub') as HTMLInputElement;
const checkRemoveWin = document.getElementById('check-remove-win') as HTMLInputElement;

// Inicialización del motor de la ruleta
const engine = new RouletteEngine({
  containerElement: reelElement,
  itemHeight: 64,
  visibleItemsCount: 5,
});

let previousItemsLength = -1;

/**
 * Llena el desplegable de plantillas y muestra/oculta el botón de eliminar.
 */
function populatePresetsSelect(selectedId: string) {
  const presets = getAllPresets();
  selectPreset.innerHTML = '';

  for (const preset of presets) {
    const opt = document.createElement('option');
    opt.value = preset.id;
    opt.textContent = preset.name;
    if (preset.id === selectedId) {
      opt.selected = true;
    }
    selectPreset.appendChild(opt);
  }

  const current = getPresetById(selectedId);
  btnDeletePreset.style.display = current.isCustom ? 'inline-flex' : 'none';
}

/**
 * Traduce de forma reactiva los textos fijos del DOM según el idioma actual.
 */
function updateStaticTranslations() {
  const mapping: Record<string, TranslationKey> = {
    'text-btn-upload': 'btn_upload_excel',
    'text-btn-quick': 'btn_quick_input',
    'text-btn-settings': 'config_title',
    'text-winners-title': 'winners_label',
    'text-discarded-title': 'discarded_label',
    'btn-reset': 'btn_reset',
    'btn-export-results': 'btn_export_results',
    'modal-settings-heading': 'config_title',
    'lbl-title': 'modal_title_label',
    'lbl-subtitle': 'modal_subtitle_label',
    'lbl-language': 'modal_language_label',
    'lbl-to-discard': 'modal_to_discard_label',
    'lbl-timer-sec': 'modal_timer_duration',
    'lbl-check-timer': 'modal_timer_toggle',
    'lbl-check-sound': 'modal_sound_toggle',
    'lbl-check-show-sub': 'modal_show_subtitle',
    'lbl-check-remove-win': 'modal_remove_on_win',
    'lnk-download-template': 'btn_download_template',
    'btn-save-settings': 'btn_save',
    'modal-quick-heading': 'quick_input_title',
    'btn-cancel-quick': 'btn_cancel',
    'btn-apply-quick': 'quick_input_apply',
  };

  for (const [id, key] of Object.entries(mapping)) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }
}

/**
 * Renderiza y sincroniza toda la interfaz según el estado global.
 */
function render(state: AppState) {
  // 0. Sincronizar textos estáticos según el idioma
  updateStaticTranslations();

  // 1. Textos y títulos
  appTitle.textContent = state.config.title || t('app_title');
  appSubtitle.textContent = state.config.subtitle || t('app_subtitle');

  // 2. Contadores y badges
  poolCount.textContent = `${state.remainingItems.length} ${t('remaining_count').toLowerCase()}`;

  if (state.config.toDiscard > 0) {
    discardTargetBadge.style.display = 'inline-flex';
    discardTargetBadge.textContent = `${state.discarded.length}/${state.config.toDiscard} ${t('discarded_label').toLowerCase()}`;
    discardedCard.style.display = 'block';
  } else {
    discardTargetBadge.style.display = 'none';
    discardedCard.style.display = 'none';
  }

  // 3. Botón de tiro y temporizador
  const canSpin = state.remainingItems.length > 0 && !engine.spinning;
  btnSpin.disabled = !canSpin;
  textBtnSpin.textContent = engine.spinning ? t('spinning') : t('spin_button');

  if (state.countdown > 0) {
    timerBadge.style.display = 'inline-flex';
    timerNumber.textContent = String(state.countdown);
  } else {
    timerBadge.style.display = 'none';
  }

  // 4. Carrete estático inicial (solo cuando la ruleta está en reposo 'idle')
  if (!engine.spinning && state.phase === 'idle' && state.remainingItems.length !== previousItemsLength) {
    previousItemsLength = state.remainingItems.length;
    engine.renderInitial(state.remainingItems, state.config.showSubtitle);
  }

  // 5. Overlay de ganador o descarte
  if (state.phase === 'winner' && state.currentItem) {
    resultOverlay.style.display = 'flex';
    resultBadge.className = 'result-badge winner';
    resultBadge.textContent = t('winner_badge');
    resultTitle.textContent = state.currentItem.label;

    const prefix = state.config.subtitlePrefix || '';
    const rawSub = state.currentItem.subtitle || '';
    resultSubtitle.textContent = rawSub && prefix && !rawSub.startsWith(prefix) ? `${prefix}${rawSub}` : rawSub;

    if (state.currentItem.url) {
      resultLink.style.display = 'inline-flex';
      resultLink.href = state.currentItem.url;
      resultLink.textContent = state.config.actionButtonText || t('open_link');
    } else {
      resultLink.style.display = 'none';
    }
  } else if (state.phase === 'discarded' && state.currentItem) {
    resultOverlay.style.display = 'flex';
    resultBadge.className = 'result-badge discarded';
    resultBadge.textContent = `${t('discarded_badge')} (${state.discarded.length}/${state.config.toDiscard})`;
    resultTitle.textContent = state.currentItem.label;

    const prefix = state.config.subtitlePrefix || '';
    const rawSub = state.currentItem.subtitle || '';
    resultSubtitle.textContent = rawSub && prefix && !rawSub.startsWith(prefix) ? `${prefix}${rawSub}` : rawSub;

    if (state.currentItem.url) {
      resultLink.style.display = 'inline-flex';
      resultLink.href = state.currentItem.url;
      resultLink.textContent = state.config.actionButtonText || t('open_link');
    } else {
      resultLink.style.display = 'none';
    }
  } else {
    resultOverlay.style.display = 'none';
  }

  // 6. Listas de resultados
  winnersCountEl.textContent = String(state.winners.length);
  btnExportResults.style.display = state.winners.length > 0 ? 'inline-flex' : 'none';
  renderItemList(winnersListEl, state.winners, t('no_winners_yet'), (id) => {
    store.removeWinner(id);
  });

  discardedCountEl.textContent = String(state.discarded.length);
  renderItemList(discardedListEl, state.discarded, t('no_discarded_yet'), (id) => {
    store.removeDiscarded(id);
  });

  // 7. Si el modal de edición está abierto, actualizar su contenido
  if (modalItemsList.open) {
    updateModalItemsView(state);
  }
}

/**
 * Renderiza de forma eficiente las filas de ganadores o descartados.
 */
function renderItemList(
  container: HTMLElement,
  items: RouletteItem[],
  emptyText: string,
  onRemove: (id: string | number) => void
) {
  container.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  const prefix = store.getState().config.subtitlePrefix || '';

  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'list-row';

    const info = document.createElement('div');
    info.className = 'list-row-info';

    const label = document.createElement('span');
    label.className = 'list-row-label';
    label.textContent = item.label;
    info.appendChild(label);

    if (item.subtitle) {
      const sub = document.createElement('span');
      sub.className = 'list-row-sub';
      const text = prefix && !item.subtitle.startsWith(prefix) ? `${prefix}${item.subtitle}` : item.subtitle;
      sub.textContent = text;
      info.appendChild(sub);
    }
    row.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'list-row-actions';

    if (item.url) {
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'btn-icon';
      link.title = t('open_link');
      link.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
      actions.appendChild(link);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.title = t('delete_item');
    delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    delBtn.onclick = () => onRemove(item.id);
    actions.appendChild(delBtn);

    row.appendChild(actions);
    container.appendChild(row);
  }
}

/**
 * Actualiza la vista del modal de gestión y edición de participantes.
 */
function updateModalItemsView(state: AppState) {
  const itemWord = state.config.itemLabelName || 'elemento';
  modalItemsCounter.textContent = `${state.remainingItems.length} en total`;

  inputNewItemLabel.placeholder = `Escribir ${itemWord.toLowerCase()}...`;
  inputNewItemSub.placeholder = `Subtítulo (${state.config.subtitleLabelName || 'opcional'})...`;

  if (state.lastSkippedHeader) {
    bannerSkippedHeader.style.display = 'flex';
    skippedHeaderName.textContent = state.lastSkippedHeader;
  } else {
    bannerSkippedHeader.style.display = 'none';
  }

  const query = inputSearchItems.value.trim().toLowerCase();
  const filtered = query
    ? state.remainingItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query))
      )
    : state.remainingItems;

  editItemsContainer.innerHTML = '';
  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-hint';
    empty.textContent = query
      ? 'No se encontraron resultados con esa búsqueda.'
      : 'No hay elementos cargados en la ruleta.';
    editItemsContainer.appendChild(empty);
    return;
  }

  const prefix = state.config.subtitlePrefix || '';

  for (const item of filtered) {
    const row = document.createElement('div');
    row.className = 'list-row';

    const info = document.createElement('div');
    info.className = 'list-row-info';

    const label = document.createElement('span');
    label.className = 'list-row-label';
    label.textContent = item.label;
    info.appendChild(label);

    if (item.subtitle) {
      const sub = document.createElement('span');
      sub.className = 'list-row-sub';
      const text = prefix && !item.subtitle.startsWith(prefix) ? `${prefix}${item.subtitle}` : item.subtitle;
      sub.textContent = text;
      info.appendChild(sub);
    }
    row.appendChild(info);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon';
    delBtn.title = 'Quitar';
    delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    delBtn.onclick = () => {
      store.removeItem(item.id);
      showToast(`Se eliminó "${item.label}".`);
    };

    row.appendChild(delBtn);
    editItemsContainer.appendChild(row);
  }
}

// --- EVENT LISTENERS ---

// 1. Giro de ruleta
btnSpin.addEventListener('click', () => {
  engine.spin();
});

// 2. Cerrar overlay de resultado
btnCloseOverlay.addEventListener('click', () => {
  store.setPhase('idle');
});

// 3. Subir archivo Excel con aviso humano
btnUpload.addEventListener('click', () => {
  fileInput.value = '';
  fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  try {
    const result = await parseExcelFile(file);
    if (result.items.length === 0) {
      alert('El archivo no contiene filas con datos válidos.');
      return;
    }

    store.setItems(result.items, result.skippedHeader);

    if (result.skippedHeader) {
      showToast(
        `¡Listo! Se cargaron ${result.items.length} participantes (se ignoró el título '${result.skippedHeader}').`
      );
    } else {
      showToast(`¡Listo! Se cargaron ${result.items.length} participantes.`);
    }
  } catch (err) {
    alert(`No se pudo leer el archivo: ${err instanceof Error ? err.message : String(err)}`);
  }
});

// 4. Modal de Ver y Editar Participantes
btnOpenList.addEventListener('click', () => {
  inputSearchItems.value = '';
  updateModalItemsView(store.getState());
  modalItemsList.showModal();
});

btnCloseItemsList.addEventListener('click', () => modalItemsList.close());
btnCloseItemsListBottom.addEventListener('click', () => modalItemsList.close());

inputSearchItems.addEventListener('input', () => {
  updateModalItemsView(store.getState());
});

formAddItem.addEventListener('submit', (e) => {
  e.preventDefault();
  const label = inputNewItemLabel.value.trim();
  const sub = inputNewItemSub.value.trim();

  if (label) {
    store.addItem(label, sub);
    inputNewItemLabel.value = '';
    inputNewItemSub.value = '';
    inputNewItemLabel.focus();
    showToast(`Se agregó "${label}" a la ruleta.`);
  }
});

btnRestoreHeader.addEventListener('click', () => {
  const header = store.getState().lastSkippedHeader;
  if (header) {
    store.includeSkippedHeader();
    showToast(`Se incluyó "${header}" en la ruleta.`);
  }
});

// 5. Entrada Rápida de Texto
btnQuickText.addEventListener('click', () => {
  quickTextarea.value = '';
  modalQuickText.showModal();
});

btnCloseQuick.addEventListener('click', () => modalQuickText.close());
btnCancelQuick.addEventListener('click', () => modalQuickText.close());

btnApplyQuick.addEventListener('click', () => {
  const text = quickTextarea.value.trim();
  if (!text) {
    modalQuickText.close();
    return;
  }
  const items = parseTextInput(text);
  if (items.length > 0) {
    store.setItems(items);
    showToast(`¡Listo! Se cargaron ${items.length} elementos.`);
  }
  modalQuickText.close();
});

// 6. Configuración y Modal de Plantillas
btnSettings.addEventListener('click', () => {
  const config = store.getState().config;
  populatePresetsSelect(config.presetId || 'general');

  inputTitle.value = config.title;
  inputSubtitle.value = config.subtitle;
  selectLang.value = config.language;
  inputToDiscard.value = String(config.toDiscard);
  inputTimer.value = String(config.timerDuration);
  checkTimer.checked = config.enableTimer;
  checkSound.checked = config.soundEnabled;
  checkShowSub.checked = config.showSubtitle;
  checkRemoveWin.checked = config.removeOnWin;

  modalSettings.showModal();
});

selectPreset.addEventListener('change', () => {
  const preset = getPresetById(selectPreset.value);
  inputTitle.value = preset.defaultTitle;
  inputSubtitle.value = preset.defaultSubtitle;
  checkRemoveWin.checked = preset.removeOnWin;
  btnDeletePreset.style.display = preset.isCustom ? 'inline-flex' : 'none';
});

btnCloseSettings.addEventListener('click', () => modalSettings.close());

settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const preset = getPresetById(selectPreset.value);

  store.updateConfig({
    presetId: preset.id,
    title: inputTitle.value.trim(),
    subtitle: inputSubtitle.value.trim(),
    language: (selectLang.value as 'es' | 'en') || 'es',
    itemLabelName: preset.itemLabel,
    subtitleLabelName: preset.subtitleLabel,
    subtitlePrefix: preset.subtitlePrefix,
    actionButtonText: preset.actionButtonText,
    toDiscard: Math.max(0, parseInt(inputToDiscard.value, 10) || 0),
    timerDuration: Math.max(5, parseInt(inputTimer.value, 10) || 30),
    enableTimer: checkTimer.checked,
    soundEnabled: checkSound.checked,
    showSubtitle: checkShowSub.checked,
    removeOnWin: checkRemoveWin.checked,
  });
  modalSettings.close();
  showToast('Configuración guardada.');
});

// 7. Crear Nueva Plantilla Personalizada
btnOpenCreatePreset.addEventListener('click', () => {
  inputPresetName.value = '';
  inputPresetItemLabel.value = '';
  inputPresetSubLabel.value = '';
  inputPresetPrefix.value = '';
  inputPresetAction.value = '';
  checkPresetRemove.checked = false;
  modalCreatePreset.showModal();
});

btnCloseCreatePreset.addEventListener('click', () => modalCreatePreset.close());
btnCancelCreatePreset.addEventListener('click', () => modalCreatePreset.close());

formCreatePreset.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = inputPresetName.value.trim();
  const itemLabel = inputPresetItemLabel.value.trim();
  const subLabel = inputPresetSubLabel.value.trim();
  const prefix = inputPresetPrefix.value.trim();
  const action = inputPresetAction.value.trim() || 'Ver Enlace';
  const remove = checkPresetRemove.checked;

  if (!name || !itemLabel) return;

  const newPreset = createCustomPreset({
    name,
    itemLabel,
    subtitleLabel: subLabel || 'Detalle',
    subtitlePrefix: prefix,
    actionButtonText: action,
    defaultTitle: `Ruleta de ${name}`,
    defaultSubtitle: `Gira para elegir ${itemLabel.toLowerCase()}`,
    removeOnWin: remove,
  });

  modalCreatePreset.close();
  populatePresetsSelect(newPreset.id);

  // Aplicar automáticamente a la pantalla de Ajustes
  inputTitle.value = newPreset.defaultTitle;
  inputSubtitle.value = newPreset.defaultSubtitle;
  checkRemoveWin.checked = newPreset.removeOnWin;
  btnDeletePreset.style.display = 'inline-flex';

  showToast(`Plantilla "${name}" creada y seleccionada.`);
});

// Eliminar Plantilla Personalizada
btnDeletePreset.addEventListener('click', () => {
  const currentId = selectPreset.value;
  const preset = getPresetById(currentId);
  if (!preset.isCustom) return;

  if (confirm(`¿Estás seguro de que deseas eliminar la plantilla "${preset.name}"?`)) {
    deleteCustomPreset(currentId);
    populatePresetsSelect('general');
    const general = getPresetById('general');
    inputTitle.value = general.defaultTitle;
    inputSubtitle.value = general.defaultSubtitle;
    checkRemoveWin.checked = general.removeOnWin;
    showToast(`Plantilla "${preset.name}" eliminada.`);
  }
});

// 8. Reiniciar sorteo
btnReset.addEventListener('click', () => {
  if (confirm('¿Estás seguro de que deseas reiniciar el sorteo?')) {
    store.resetGame();
    showToast('Sorteo reiniciado.');
  }
});

// 9. Descargar acta oficial del sorteo en Excel
btnExportResults.addEventListener('click', () => {
  const state = store.getState();
  if (state.winners.length === 0) return;

  exportResultsToExcel({
    title: state.config.title,
    winners: state.winners,
    discarded: state.discarded,
    remainingCount: state.remainingItems.length,
    itemLabelName: state.config.itemLabelName,
    subtitleLabelName: state.config.subtitleLabelName,
  });

  showToast(t('export_success_toast'));
});

// Suscribirse a los cambios del Store
store.subscribe(render);
