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

### 2. Guía de tallas (botón flotante del catálogo)
- **Nombre:** `guia-tallas.jpg`
- **Ubicación:** `assets/guia-tallas.jpg`
- **Uso:** se abre al tocar el botón dorado de la regla (📏) en el catálogo.
- **Formato:** JPG o PNG. Vertical u horizontal; se ajusta sola (máx. 92% de la pantalla).

### 3. Imagen de bienvenida (popup automático)
- **Nombre:** `bienvenida.jpg`
- **Ubicación:** `assets/bienvenida.jpg`
- **Uso:** aparece sola al entrar al catálogo (una vez por sesión). Sirve para
  indicar la guía de tallas y señalar dónde está el botón de la regla.
- **Nota:** mientras este archivo no exista, el popup simplemente no se muestra.

> Para cambiar estos nombres, edita `js/nav.js`:
> ```javascript
> const SIZE_GUIDE_IMG = 'assets/guia-tallas.jpg';
> const WELCOME_IMG    = 'assets/bienvenida.jpg';
> ```

## Estructura de archivos
```
assets/
├── logo.png           (tu logo de la página - 40x40px)
├── guia-tallas.jpg    (imagen del botón "Guía de tallas")
├── bienvenida.jpg     (imagen del popup de bienvenida)
└── README.md          (este archivo)
```

¡Listo! Tu logo se verá automáticamente en la navegación de todas las páginas.
