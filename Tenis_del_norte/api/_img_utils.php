<?php
/**
 * _img_utils.php — Utilidades de procesamiento de imágenes (GD)
 * Compartido por upload.php y optimizar_existentes.php
 */

if (!function_exists('procesarImagen')) {
    /**
     * Redimensiona (solo reduce, nunca amplía) y guarda optimizado.
     *
     * @param string $srcTmp   Ruta del archivo origen
     * @param string $mime     MIME del origen (image/jpeg|png|webp)
     * @param string $destPath Ruta destino donde escribir
     * @param int    $maxLado  Lado máximo (px) de la versión generada
     * @param int    $calidad  Calidad 0-100
     * @param bool   $useWebp  true → WebP; false → JPG
     * @return bool
     */
    function procesarImagen($srcTmp, $mime, $destPath, $maxLado, $calidad, $useWebp) {
        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':  $img = @imagecreatefromjpeg($srcTmp); break;
            case 'image/png':  $img = @imagecreatefrompng($srcTmp);  break;
            case 'image/webp': $img = @imagecreatefromwebp($srcTmp); break;
            default: return false;
        }
        if (!$img) return false;

        $w = imagesx($img);
        $h = imagesy($img);
        if ($w < 1 || $h < 1) { imagedestroy($img); return false; }

        $escala = min(1, $maxLado / max($w, $h));   // nunca ampliar
        $nw = max(1, (int)round($w * $escala));
        $nh = max(1, (int)round($h * $escala));

        $dst = imagecreatetruecolor($nw, $nh);

        if ($useWebp) {
            // WebP conserva transparencia
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
            imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
        } else {
            // JPG no soporta alpha → fondo blanco
            $white = imagecolorallocate($dst, 255, 255, 255);
            imagefilledrectangle($dst, 0, 0, $nw, $nh, $white);
        }

        imagecopyresampled($dst, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);

        $ok = $useWebp
            ? imagewebp($dst, $destPath, $calidad)
            : imagejpeg($dst, $destPath, $calidad);

        imagedestroy($img);
        imagedestroy($dst);
        return $ok;
    }
}
