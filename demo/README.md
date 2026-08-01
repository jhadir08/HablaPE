# HablaPE — primera demo

Prototipo web en español para dos recorridos:

- orientación general durante un control de identidad policial;
- preparación de un borrador de reclamo por una compra.

La interfaz separa cuatro capas: hechos proporcionados por la persona, fuente oficial, explicación simple y siguiente acción/canal.

## Ejecutar localmente

Requiere Node.js 22.13 o posterior.

```powershell
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Validar

```powershell
npm run lint
npm test
npm audit --omit=dev
```

La prueba compila la aplicación y verifica el render inicial, metadatos, guardas de privacidad y enlaces oficiales.

## Alcance de esta versión

- La clasificación y las respuestas son deterministas y se ejecutan en el navegador.
- Audio, actas y boletas son simulaciones con `is_synthetic=true`.
- No existe carga real de archivos, OCR, STT, RAG, Gemma ni persistencia.
- No deben ingresarse nombres, DNI, direcciones u otros datos personales reales.
- El contenido es informativo; no constituye asesoría legal.

El diagnóstico completo, brechas normativas e inventario de datos están en
[`../AUDITORIA_IMPLEMENTACION.md`](../AUDITORIA_IMPLEMENTACION.md). La
procedencia y los hashes de los documentos están en
[`../corpus/manifest.json`](../corpus/manifest.json).

