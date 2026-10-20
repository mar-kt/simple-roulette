# Ruleta de Sorteos Simple

Una aplicación web ultraligera, responsiva y de alto rendimiento para sorteos interactivos tipo ruleta / tragamonedas (*slot reel*), construida con **Vite y Vanilla TypeScript**.

---

## Un poco de historia

Este proyecto nació de la necesidad de poder ofrecer un sorteo rápido para un concurso de unos amigos en sus redes sociales. Si bien hay varias opciones en internet, la idea era poder darle la identidad necesaria, con logos y diseños, junto con la habilidad de dar al ganador una pequeña visibilidad de su red social.

La versión aquí se encuentra limpia y depurada de varios errores y el branding que tenía ese sistema original.

---

## Respecto al contenido generado por IA

La traducción al inglés y la documentación desde el siguiente punto fueron elaboradas con asistencia de IA. Asimismo, se utilizó como herramienta de pair-programming durante la refactorización matemática de la animación, el cálculo de offsets del carrete y la optimización del rendimiento visual.

Dicho lo anterior, cada línea de código generada fue revisada para asegurar su coherencia con el resto del proyecto y su correcto funcionamiento.

---

## Características Principales

- **Diseño Minimalista & Accesible:** Estética limpia y sin distracciones, tipografía sans-serif de precisión y modales nativos HTML5 (`<dialog>`).
- **Modelo de Dominio Genérico (`RouletteItem`):** Apto para cualquier dinámica: personas, premios, tareas de equipo, decisiones rápidas o selección de productos.
- **Importación de Datos Flexible:**
  - **Archivos Excel (`.xlsx`, `.xls`, `.csv`):** Procesamiento instantáneo en memoria RAM mediante SheetJS.
  - **Entrada Rápida de Texto:** Pega listas de texto libre (`Elemento | Subtítulo opcional | Enlace`).
  - **Gestor & Buscador de Participantes:** Modal interactivo con filtrado en tiempo real, adición rápida, eliminación individual y opción de recuperar cabeceras ignoradas.
- **Modos de Sorteo & Plantillas Personalizadas:**
  - Modos predefinidos: *Redes Sociales*, *Premios & Productos*, *Toma de Decisiones*, *General*.
  - Creador visual de plantillas propias guardadas en `localStorage`.
- **Motor Físico Inercial a 60 FPS:**
  - Animación fluida con `requestAnimationFrame` y curva de desaceleración cúbica natural.
  - Corrección visual anti-duplicados contiguos y centrado exacto entre indicadores.
- **Síntesis de Sonido en Tiempo Real (Web Audio API):**
  - Tics mecánicos en cada salto de ranura y acordes armónicos de victoria generados por osciladores nativos.
- **Dinámica de Descarte ("Tirar al agua"):** Configura cuántos participantes descartar con efecto de sonido descendente antes de coronar al ganador definitivo.
- **Temporizador de Validación en Vivo:** Cuenta regresiva reactiva para transmisiones en vivo.
- **Exportación Oficial del Acta en Excel (.xlsx):**
  - Generación en memoria de un archivo Excel con 3 hojas: *Ganadores* (en orden cronológico), *Descartados* y *Ficha de Auditoría / Resumen*.
- **Internacionalización Integrada (i18n):**
  - Soporte nativo para Español e Inglés con diccionario tipado estricto a nivel de compilador, con cambio reactivo instantáneo.
- **Privacidad Total (Zero-Server / Offline):**
  - La aplicación funciona 100% desconectada de Internet. No envía nombres, datos ni archivos a ningún servidor externo.

---

## Instalación y Uso Local

### Prerrequisitos
- Node.js >= 18
- npm >= 9

### Comandos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/rouletteapp.git
cd rouletteapp

# 2. Instalar dependencias (tarda < 5 segundos)
npm install

# 3. Iniciar servidor de desarrollo en vivo (arranca en ~70ms)
npm run dev

# 4. Compilar para producción (genera bundle estático optimizado en dist/)
npm run build

# 5. Previsualizar el paquete de producción localmente
npm run preview
```

---

## 📄 Licencia y Descargo de Responsabilidad

Distribuido bajo la **Licencia MIT**. Consulta el archivo `LICENSE` para más detalles.

> **Aviso de uso:** Esta aplicación es una herramienta de utilidad técnica para selección aleatoria, dinámicas de grupo y toma de decisiones recreativas o educativas. No está diseñada ni autorizada para juegos de azar regulados ni apuestas financieras. El organizador del sorteo o dinámica es el único responsable del cumplimiento de las normativas locales aplicables a la entrega de premios.
