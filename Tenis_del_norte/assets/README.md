# 📂 Carpeta Assets

Esta carpeta es para almacenar tus archivos de imagen personalizados.

## Archivos esperados

### 1. Logo de la página
- **Nombre:** `logo.png` (o el nombre que prefieras)
- **Ubicación:** `assets/logo.png`
- **Tamaño recomendado:** 40x40px (se mostrará en el navegador)
- **Formato:** PNG, JPG, o SVG

**Cómo cambiar el nombre del logo:**
1. Edita `js/nav.js` y actualiza esta línea:
   ```javascript
   const LOGO_PATH = 'assets/logo.png'; // Cambia 'logo.png' por tu archivo
   ```

## Estructura de archivos
```
assets/
├── logo.png           (tu logo de la página - 40x40px)
└── README.md          (este archivo)
```

¡Listo! Tu logo se verá automáticamente en la navegación de todas las páginas.
