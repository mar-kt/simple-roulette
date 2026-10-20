import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas para que el paquete estático funcione en cualquier hosting o subcarpeta (ej: GitHub Pages)
  base: './',
});
