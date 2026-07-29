# Auditoría de implementación y datos — HablaPE

**Corte:** 29 de julio de 2026  
**Alcance:** revisión documental y técnica para una primera demo; no sustituye una revisión legal profesional.

## Resultado ejecutivo

El proyecto tiene una hipótesis de producto clara y dos recorridos MVP razonables, pero el plan original no era todavía ejecutable: solo existían el plan y un catálogo de enlaces. No había corpus descargado, chunks trazables, datos sintéticos, casos de evaluación, aplicación, pruebas ni configuración verificable de Google Cloud.

Esta iteración deja una **demo determinista y local**, siete documentos oficiales con hash SHA-256, un corpus mínimo trazable y un set inicial de escenarios sintéticos. La demo no usa todavía OCR, voz, Gemma, Vertex AI ni datos personales reales; esas capacidades requieren evaluación separada y credenciales de infraestructura.

## Puertas CRISP-DM

| Fase | Estado | Evidencia | Condición para avanzar |
| --- | --- | --- | --- |
| Comprensión del negocio | **Aprobada con reservas** | MVP, usuarios, problema y recorridos definidos en `PLAN_EJECUCION.md` | Fijar métricas de éxito y responsable legal |
| Comprensión de datos | **Parcial** | 7 PDFs oficiales descargados y manifestados | Completar normas faltantes, etiquetar chunks y revisar vigencia |
| Preparación de datos | **Inicial** | Corpus mínimo, fixtures y escenarios sintéticos | Llegar a ≥40 casos revisados por recorrido y controlar versiones |
| Modelado | **No iniciado** | No hay modelo ni endpoint configurado | Resolver arquitectura, cuota GPU, región, costos y STT |
| Evaluación | **No iniciada** | Solo pruebas de interfaz y reglas deterministas | Definir métricas, umbrales y evaluación legal/adversarial |
| Despliegue ML | **Bloqueado** | No hay `gcloud`, proyecto, credenciales ni cuotas verificables | Aprovisionar entorno y aprobar tratamiento de datos |

## Inventario y disponibilidad

| Activo | Disponibilidad actual | Observación |
| --- | --- | --- |
| Plan de ejecución | Local | Completo como propuesta, no como implementación |
| Catálogo de fuentes | Local | Extenso; se corrigieron vacíos de vigencia |
| Corpus oficial mínimo | Local | 7 PDFs, hashes y procedencia en `corpus/manifest.json` |
| Chunks jurídicos | Local | Muestra mínima para la demo; no es corpus de producción |
| Casos sintéticos | Local | Muestra de evaluación; todos marcados `is_synthetic=true` |
| Documentos reales de usuarios | No disponibles ni requeridos | Deben excluirse de la demo |
| Vertex AI / Gemma | Disponibilidad pública documentada | Disponibilidad de cuenta, región y cuota no verificada |
| Speech-to-Text | Disponibilidad pública documentada | `es-PE` no figura en la lista de Chirp 3 revisada |
| GPU L4, Firestore, GCS, Secret Manager | No verificable en esta máquina | Falta proyecto y autenticación de Google Cloud |

## Brechas legales y documentales

### Prioridad crítica

1. **Artículo 205 del Código Procesal Penal.** El plan atribuía el texto vigente al D. Leg. 1574. El consolidado oficial muestra que la Ley 32130 modificó los numerales 1, 3 y 5; el D. Leg. 1574 modificó el numeral 4. El corpus debe citar el consolidado y registrar ambas modificatorias.
2. **Protocolo de control de identidad.** El protocolo de 2018 sigue siendo útil como antecedente operativo, pero la Defensoría del Pueblo indicó en 2026 que no fue actualizado a los cambios del artículo 205 y recomendó uno nuevo. No debe usarse como única fuente normativa vigente.
3. **Libro de Reclamaciones digital.** La Ley 32495 modificó los artículos 150 y 151 en 2025. Al corte, la R.M. 244-2026-PCM publica un **proyecto** de adecuación reglamentaria; el proyecto no debe presentarse como norma vigente.
4. **Privacidad y uso de IA.** El producto procesará voz, imágenes y hechos potencialmente sensibles. Debe incorporar la Ley 29733 y su Reglamento, D.S. 016-2024-JUS, además de la Ley 31814 y su Reglamento, D.S. 115-2025-PCM.

### Prioridad alta

- Descargar y versionar Ley 32130, D. Leg. 1574, Ley 32495, R.M. 244-2026-PCM y el reglamento consolidado del Libro de Reclamaciones.
- Incorporar Constitución, Nuevo Código Procesal Constitucional y reglas de hábeas corpus solo para orientación general, con escalamiento explícito.
- Revisar manualmente la Directiva 001-2021/COD-INDECOPI y las rutas sectoriales antes de automatizar el enrutamiento.
- Confirmar si al desplegar existe un nuevo protocolo oficial que sustituya el de 2018.

## Correcciones técnicas al plan

- **Modelo:** Gemma 3 12B sigue siendo una opción disponible, pero el plan debe comparar Gemma 4 12B y evaluar calidad, latencia, memoria y costo antes de congelar arquitectura.
- **Voz:** no se confirmó `es-PE` en Chirp 3. Debe probarse un locale español soportado por Chirp con habla peruana o usar un modelo de Speech-to-Text que sí declare `es-PE`.
- **RAG:** una base vectorial no reemplaza reglas deterministas. Plazos, supuestos habilitantes y rutas deben mantenerse en validadores versionados.
- **Multimodalidad:** OCR y audio requieren consentimiento, minimización, borrado y un modo sin carga de documentos.
- **Costo:** no es responsable validar el presupuesto sin proyecto, región, cuotas, volumen y perfil de tráfico.

## Alcance de la primera demo

La demo implementa dos recorridos:

1. Control de identidad policial: clasifica un relato sintético, separa hechos, fuente oficial, explicación y siguiente acción.
2. Reclamo de consumo: genera un borrador editable usando únicamente datos confirmados y ofrece canales oficiales.

Las respuestas son reglas locales y reproducibles. Los botones de audio y documento representan simulaciones y se etiquetan como tales. No se guardan datos ni se envían archivos.

## Riesgos abiertos y siguientes pasos

1. Revisión jurídica del corpus y de cada regla antes de pilotos.
2. Ampliar a ≥40 escenarios revisados por recorrido, con negativos, ambigüedad y ataques de prompt.
3. Medir exactitud de clasificación, groundedness, completitud de citas, falsos plazos y derivación segura.
4. Prototipar STT con audios peruanos sintéticos/consentidos y comparar WER por entorno.
5. Configurar un proyecto de prueba en Google Cloud con presupuesto, alertas y cuotas antes de integrar modelos.
6. Ejecutar una evaluación de impacto de privacidad y fijar retención cero por defecto para audio/imágenes.

