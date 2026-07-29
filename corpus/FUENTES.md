# HablaPE — Mapa de fuentes oficiales del corpus

**Fecha de verificación:** 2026-07-28 · Método: búsqueda web + petición HTTP real a cada URL.

**Leyenda de estado:**
- ✅ **VERIFICADO** — el enlace responde y el contenido corresponde al documento.
- ✅ **VERIFICADO (HTTP 200)** — el enlace descarga el PDF/página correcta según título y dominio oficial, pero el texto interno no pudo extraerse automáticamente.
- ⚠️ **NO VERIFICADO** — URL oficial hallada vía buscador, pero el sitio bloqueó o no respondió a la verificación automatizada (en navegador normal suele funcionar).
- 🔶 **NO OFICIAL** — fuente secundaria; usar solo como referencia, nunca como cita del corpus.

> **Nota técnica clave:** `gob.pe` y `cdn.www.gob.pe` bloquean peticiones automatizadas (HTTP 418/403) pero responden con User-Agent de navegador. `congreso.gob.pe` no respondió a ningún intento. **Para el corpus: preferir SPIJ, El Peruano (`diariooficial.elperuano.pe`), `tc.gob.pe` y los portales de cada regulador; descargar los PDFs de gob.pe con headers de navegador o alojar copia propia en Cloud Storage.**

---

## PARTE A — Control de identidad policial

### A1. Sentencia 1039/2025 del Tribunal Constitucional ⭐ (fuente jurídica principal del recorrido)

| Campo | Dato |
| --- | --- |
| Nombre completo | Sala Primera. Sentencia 1039/2025, Exp. N.° 01356-2024-PHC/TC (Junín). Hábeas corpus — Ciro Jhonson Cancho Espinal |
| Tipo / Entidad / Fecha | Sentencia constitucional · Tribunal Constitucional · 11-08-2025 |
| PDF oficial | https://www.tc.gob.pe/jurisprudencia/2025/01356-2024-HC.pdf — ✅ VERIFICADO (contenido) |
| Relevancia | El control de identidad del art. 205 CPP **no es discrecional**: exige presupuestos objetivos y solo procede en dos supuestos legales. Invoca el Protocolo Interinstitucional Específico de Control de Identidad. |
| Cobertura secundaria | https://lpderecho.pe/pnp-intervino-arbitrariamente-abogado-penalista-paseaba-familia-sentencia-indispensable-policias-expediente-01356-2024-phc-tc/ — 🔶 NO OFICIAL, ⚠️ no verificado |

### A2. Código Procesal Penal — Decreto Legislativo N.° 957

| Campo | Dato |
| --- | --- |
| Tipo / Entidad / Fecha | Decreto Legislativo (código) · Poder Ejecutivo/MINJUSDH · 22-07-2004 (consolidado actualizado a 2026) |
| Artículos relevantes | **205** (control de identidad policial), 206 (controles policiales públicos), 209–210 (pesquisas y retenciones), 203–204 (preceptos generales) |
| PDF consolidado oficial (El Peruano) | https://diariooficial.elperuano.pe/Normas/obtenerDocumento?idNorma=70003 — ✅ VERIFICADO (HTTP 200, ~1.5 MB, edición actualizada) |
| Ficha gob.pe | https://www.gob.pe/institucion/presidencia/normas-legales/344687-957 — ✅ VERIFICADO (HTTP 200 con UA de navegador) |
| PDF Congreso (histórico) | https://www2.congreso.gob.pe/sicr/cendocbib/con2_uibd.nsf/0CF515CB9C1E6BF2052577BD006ECE85/$FILE/DLeg_957.pdf — ⚠️ NO VERIFICADO (servidor sin respuesta; evitar) |

### A3. Decreto Legislativo N.° 1574 y Ley N.° 32130 — modificatorias del art. 205 CPP ⭐

| Campo | Dato |
| --- | --- |
| Nombre completo | D. Leg. que modifica el CPP en lo relativo al Control de Identidad Policial |
| Tipo / Fecha | Decreto Legislativo modificatorio · publicado 05-10-2023 |
| HTML oficial (El Peruano) | https://busquedas.elperuano.pe/dispositivo/NL/2222143-3 — ✅ VERIFICADO (contenido) |
| Relevancia | El D. Leg. 1574 modificó el numeral 4 (retención máx. 4 horas para nacionales / hasta 12 horas para extranjeros y garantías asociadas). El consolidado oficial registra además que la **Ley 32130** modificó los numerales 1, 3 y 5. La fuente de cita debe ser el Código consolidado, no una sola modificatoria. |

### A4. Constitución Política del Perú (1993)

| Campo | Dato |
| --- | --- |
| Artículos relevantes | Art. 2 (derechos fundamentales), esp. **2.24.b** (restricción de libertad solo por ley) y **2.24.f** (detención solo por mandato judicial o flagrancia); art. 200.1 (hábeas corpus) |
| Página SPIJ | https://spijweb.minjus.gob.pe/sdm_downloads/constitucion-politica-del-peru/ — ✅ VERIFICADO (contenido) |
| PDF directo SPIJ | https://spijweb.minjus.gob.pe/?sdm_process_download=1&download_id=8626 — ✅ VERIFICADO (HTTP 200, ~1.9 MB) |
| Edición oficial MINJUS (19.ª ed., lenguaje llano) | https://cdn.www.gob.pe/uploads/document/file/7399853/6308989-decimonovena-edicion-oficial-de-la-constitucion-politica-del-peru-que-incluye-su-adaptacion-a-un-lenguaje-llano.pdf — ✅ VERIFICADO (HTTP 200 con UA de navegador, ~4.5 MB) |
| PDF Congreso | https://www.congreso.gob.pe/Docs/files/constitucion/constitucion-politica-14-03-18.pdf — ⚠️ NO VERIFICADO (evitar; usar SPIJ) |

### A5. Decreto Legislativo N.° 1267 — Ley de la Policía Nacional del Perú

| Campo | Dato |
| --- | --- |
| Tipo / Fecha | Decreto Legislativo (ley de la PNP) · publicado 18-12-2016 |
| HTML oficial (El Peruano) | https://busquedas.elperuano.pe/dispositivo/NL/1464781-2 — ✅ VERIFICADO (contenido) |
| PDF consolidado oficial (El Peruano) | https://diariooficial.elperuano.pe/Normas/obtenerDocumento?idNorma=49 — ✅ VERIFICADO (HTTP 200, ~2.4 MB) |
| Artículos relevantes | Art. 2 (finalidad), art. 3 (competencias), atribuciones del personal policial (requerir identificación, intervenir, registrar) |

**Reglamento VIGENTE — D.S. N.° 012-2025-IN** (publicado 05-11-2025; sustituye al DS 026-2017-IN):
- Ficha gob.pe: https://www.gob.pe/institucion/mininter/normas-legales/7408685-012-2025-in — ✅ VERIFICADO (HTTP 200 con UA de navegador)
- ⚠️ El enlace `busquedas.elperuano.pe/dispositivo/NL/2454899-1` devuelve **404 — NO FUNCIONAL**.

**Reglamento anterior — D.S. N.° 026-2017-IN** (15-10-2017, solo referencia histórica):
- PDF oficial (gob.pe): https://cdn.www.gob.pe/uploads/document/file/571754/Decreto_Supremo_N%C2%BA_026-2017-IN.pdf?v=1585257795 — ✅ VERIFICADO (HTTP 200, ~1.4 MB)

### A6. Decreto Legislativo N.° 1186 — Uso de la fuerza por la PNP

| Campo | Dato |
| --- | --- |
| Tipo / Fecha | Decreto Legislativo · publicado 16-08-2015 |
| PDF consolidado oficial (El Peruano) | https://diariooficial.elperuano.pe/Normas/obtenerDocumento?idNorma=10002 — ✅ VERIFICADO (HTTP 200, ~540 KB) |
| Relevancia | Principios de legalidad, necesidad y proporcionalidad; niveles del uso de la fuerza en intervenciones |

**Reglamento — D.S. N.° 012-2016-IN** (publicado 27-07-2016):
- HTML oficial (El Peruano): https://busquedas.elperuano.pe/normaslegales/aprueban-reglamento-del-decreto-legislativo-n-1186-decreto-decreto-supremo-n-012-2016-in-1409580-3/ — ✅ VERIFICADO (contenido)
- Modificación reciente: **DS N.° 021-2025-IN** (dic. 2025, adecuación a la Ley 32291). Ficha oficial: https://www.gob.pe/institucion/mininter/normas-legales/7602108-021-2025-in — ✅ VERIFICADO. No usar la réplica secundaria.

### A7. Protocolos oficiales de actuación

**D.S. N.° 010-2018-JUS — Protocolos de Actuación Interinstitucional** (incluye el Protocolo Específico de Control de Identidad citado por el TC en la Sentencia 1039/2025) ⭐
- Tipo/Fecha: Decreto Supremo + 13 protocolos operativos · publicado 25-08-2018 · MINJUSDH (con PJ, MP, PNP, MININTER)
- HTML oficial (El Peruano): https://busquedas.elperuano.pe/dispositivo/NL/1685044-2 — ✅ VERIFICADO (contenido)
- PDF oficial del compendio (gob.pe/MINJUS): https://cdn.www.gob.pe/uploads/document/file/1526234/PROTOCOLOS-DE-ACTUACI%C3%93N-INTERINSTITUCIONAL-VERSI%C3%93N-FINAL%20%281%29.pdf.pdf?v=1609857149 — ✅ VERIFICADO (HTTP 200, ~2.2 MB)
- Página de la publicación: https://www.gob.pe/institucion/minjus/informes-publicaciones/1461964-protocolo-de-actuacion-interinstitucional-especificos-para-la-aplicacion-del-codigo-procesal-peruano — ✅ VERIFICADO (HTTP 200)
- Relevancia: el protocolo de control de identidad tiene 2 ejes (vía pública / dependencia policial) y 18 actividades con formatos anexos → **base para el diseño de los bloques "lo que debes cumplir / lo que debe garantizarse" y para el acta sintética.**

**Protocolo de Control de Identidad Policial 2014** (histórico, reemplazado por el de 2018):
- PDF oficial (Poder Judicial): https://www.pj.gob.pe/wps/wcm/connect/3c6a5d8040999d979d30dd1007ca24da/Protocolo+de+identidad+policial.pdf?MOD=AJPERES&CACHEID=3c6a5d8040999d979d30dd1007ca24da — ✅ VERIFICADO (HTTP 200, ~77 KB)

**Manual de Procedimientos Operativos Policiales (MAPRO PNP):**
- ⚠️ Sin enlace oficial funcional (solo repositorios no oficiales tipo Scribd). **No incluir en el corpus** o marcar como pendiente.

### A8. Informe Defensorial N.° 266 — Defensoría del Pueblo (dato del pitch)

| Campo | Dato |
| --- | --- |
| Nombre completo | "Situación de las unidades a cargo de la prevención del delito: Supervisión Nacional a Comisarías Básicas de la PNP" |
| Tipo / Fecha | Informe defensorial · 04-02-2026 |
| Página oficial | https://www.defensoria.gob.pe/informes/informe-defensorial-n-266/ — ✅ VERIFICADO (contenido) |
| PDF oficial directo | https://www.defensoria.gob.pe/wp-content/uploads/2026/02/Informe-Defensorial-n.%C2%B0-266_Situaci%C3%B3n-de-las-unidades-a-cargo-de-la-prevenci%C3%B3n-del-delito-Supervisi%C3%B3n-Nacional-a-Comisar%C3%ADas-B%C3%A1sicas-de-la-Polic%C3%ADa-Nacional-del-Per%C3%BA.pdf — ✅ VERIFICADO (HTTP 200, ~5.5 MB) |
| Relevancia | Supervisión de 1,327 comisarías (oct. 2024–jun. 2025); solo **60.66 %** conoce plenamente el Protocolo de Control de Identidad. *Ojo para el pitch:* el informe es sobre comisarías básicas en general, con una sección sobre control de identidad. |

### A9. Ley N.° 31307 — Nuevo Código Procesal Constitucional (hábeas corpus)

| Campo | Dato |
| --- | --- |
| Tipo / Fecha | Ley (código) · publicada 23-07-2021 (últ. modif.: Ley 32153, 05-11-2024) |
| PDF oficial (TC) | https://www.tc.gob.pe/wp-content/uploads/2021/08/Nuevo-Codigo-Procesal-Constitucional.pdf — ✅ VERIFICADO (HTTP 200, ~592 KB) |
| Ficha gob.pe | https://www.gob.pe/institucion/tc/normas-legales/2212168-31307 — ✅ VERIFICADO (HTTP 200 con UA de navegador) |
| Relevancia | Hábeas corpus ante detenciones/retenciones arbitrarias en un control de identidad |

### A10. Jurisprudencia constitucional adicional (línea del TC sobre el art. 205 CPP)

| Sentencia | Expediente | PDF oficial | Estado |
| --- | --- | --- | --- |
| Sentencia 372/2021 (Sala Segunda) | 02054-2017-PHC/TC | https://tc.gob.pe/jurisprudencia/2021/02054-2017-HC.pdf | ✅ HTTP 200, ~1 MB |
| Sentencia 441/2023 (Sala Primera) | 00413-2022-PHC/TC | https://tc.gob.pe/jurisprudencia/2023/00413-2022-HC.pdf | ✅ HTTP 200, ~490 KB |
| Sentencia 249/2024 (Sala Primera, Arequipa) | 05257-2022-PHC/TC | https://tc.gob.pe/jurisprudencia/2024/05257-2022-HC.pdf | ✅ HTTP 200, ~253 KB |

- Identificación de la línea jurisprudencial según recopilación 🔶 NO OFICIAL de Jurispol: https://jurispol.pe/top-3-sentencias-del-tc-sobre-el-adecuado-control-de-identidad-policial/ — **revisar el contenido de cada sentencia antes de citarla en el corpus.**
- **Acuerdos plenarios de la Corte Suprema:** no se halló ninguno dedicado específicamente al control de identidad. No citar sin revisión manual.

---

## PARTE B — Reclamo de consumo

### B1. Ley N.° 29571 — Código de Protección y Defensa del Consumidor ⭐

| Campo | Dato |
| --- | --- |
| Tipo / Entidad / Fecha | Ley · Congreso (aplica Indecopi) · publicada 02-09-2010; consolidado actualizado (últ. modif. conocida: D. Leg. 1729, feb. 2026) |
| Página SPIJ (consolidado) | https://spijweb.minjus.gob.pe/sdm_downloads/codigo-de-proteccion-y-defensa-del-consumidor-ley-n-29571-y-normas-complementarias/ — ✅ VERIFICADO (contenido) |
| PDF directo SPIJ | https://spijweb.minjus.gob.pe/?sdm_process_download=1&download_id=8690 — ✅ VERIFICADO (HTTP 200, ~3 MB) |
| Ficha gob.pe | https://www.gob.pe/institucion/indecopi/normas-legales/1244218-29571 — ⚠️ NO VERIFICADO (bloqueo anti-bot 418) |
| PDF Congreso (texto original 2010) | https://www2.congreso.gob.pe/sicr/cendocbib/con4_uibd.nsf/8783A434D1D0A27205257D4F006EC563/$FILE/1_Ley29571CodigoDProteccionyDefensaDelConsumidor.pdf — ⚠️ NO VERIFICADO (evitar) |
| Artículos clave | 1–2 (derechos, deber de información), **18–19 (idoneidad)**, **20–21 (garantías legal/explícita/implícita)**, 24 (atención de reclamos por el proveedor), 56–58 (métodos comerciales coercitivos/agresivos/engañosos), 105–107 (competencia de Indecopi), 125 (sumarísimo ≤ 3 UIT), **150–152 (Libro de Reclamaciones)** |

### B2. Reglamento del Libro de Reclamaciones — D.S. N.° 011-2011-PCM y modificatorias ⭐

**Norma base — D.S. N.° 011-2011-PCM** (publicado 19-02-2011):
- PDF (réplica en portal estatal INEI): https://www.inei.gob.pe/media/libro_reclamaciones/DS011_2011_PCM.pdf — ✅ VERIFICADO (HTTP 200, ~199 KB)
- PDF oficial gob.pe: https://cdn.www.gob.pe/uploads/document/file/662494/Decreto_Supremo_N_011-2011-PCM.pdf?v=1588006949 — ⚠️ NO VERIFICADO (403 CDN)
- Contenido clave: Libro físico o virtual, Hoja de Reclamación (Anexo I), aviso obligatorio (Anexo II), distinción **reclamo vs. queja**.

**Modificatorias:**

| Norma | Fecha publ. | Enlace oficial (El Peruano) | Estado | Relevancia |
| --- | --- | --- | --- | --- |
| D.S. 006-2014-PCM | 23-01-2014 | https://busquedas.elperuano.pe/dispositivo/NL/1041477-1 | ✅ VERIFICADO | Proveedores obligados, hojas, canales alternativos (transporte) |
| D.S. 058-2017-PCM | 29-05-2017 | https://busquedas.elperuano.pe/dispositivo/NL/1525945-8 | ✅ VERIFICADO | Art. 6-A; **el Libro NO es vía previa obligatoria para denunciar ante Indecopi** |
| **D.S. 101-2022-PCM** ⭐ | 16-08-2022 | https://busquedas.elperuano.pe/dispositivo/NL/2095978-1 | ✅ VERIFICADO | **Plazo de respuesta: máx. 15 días hábiles improrrogables**; redefine "queja"; art. 6-B |

### B3. Reclama Virtual de Indecopi (plataforma) ⭐

| Campo | Dato |
| --- | --- |
| Formulario oficial | https://enlinea.indecopi.gob.pe/reclamavirtual/ — ✅ VERIFICADO (aplicación web activa) |
| Trámite en gob.pe | https://www.gob.pe/532-presentar-reclamos-en-indecopi — ⚠️ NO VERIFICADO (bloqueo 418; URL oficial) |
| Portal del consumidor | https://consumidor.gob.pe/presenta-tu-reclamo/ — ⚠️ NO VERIFICADO (conexión cortada en ese path; dominio oficial de Indecopi) |
| Datos operativos | Asignación en ~3 días hábiles; tel. 224-7777 (Lima) y 0-800-4-4040 (regiones); mecanismo conciliatorio **gratuito**, distinto de la denuncia formal |

### B4. Denuncias formales ante Indecopi (sumarísimo y ordinario)

- Orientación oficial: https://www.gob.pe/14889-denuncias-de-proteccion-al-consumidor-procedimientos-de-proteccion-al-consumidor-sumarisimos-y-ordinarios y https://www.gob.pe/14888-denuncias-de-proteccion-al-consumidor — ⚠️ NO VERIFICADO (bloqueo 418; URLs oficiales)
- Página institucional: https://www.indecopi.gob.pe/en/pc-procedimiento — ⚠️ NO VERIFICADO (DNS no resolvió en el entorno de prueba)
- Datos clave: sumarísimo ≤ 3 UIT ante los ORPS; ordinario ante Comisiones de Protección al Consumidor; tasa ≈ 0.36 % de la UIT (TUPA Indecopi); apelación en 5 días hábiles.

**Norma procedimental vigente — Directiva N.° 001-2021/COD-INDECOPI** ("Directiva Única de Procedimientos de Protección al Consumidor", aprobada por Res. 000049-2021-PRE/INDECOPI, 30-04-2021):
- PDF oficial: https://cdn.www.gob.pe/uploads/document/file/1862815/Directiva%20N%C2%B0%20001-2021-COD-INDECOPI%20Directiva%20%C3%9Anica%20que%20regula%20los%20Procedimientos%20de%20Protecci%C3%B3n%20al%20Consumidor%20previstos%20en%20el%20C%C3%B3digo%20de%20Protecci%C3%B3n%20y%20Defensa%20del%20Consumidor.pdf.pdf — ⚠️ NO VERIFICADO (403 CDN; URL oficial)
- ⚠️ **Derogó** las Directivas 005-2017 y 006-2017/DIR-COD-INDECOPI — citarlas solo como antecedente.

### B5. Reguladores sectoriales (tabla de enrutamiento) ⭐

#### B5.1 OSIPTEL — Telecomunicaciones
- **TUO del Reglamento de Reclamos — Res. N.° 199-2022-CD/OSIPTEL** (08-11-2022): https://www.osiptel.gob.pe/media/rxeciksg/resol199-2022-cd.pdf — ✅ VERIFICADO (metadatos confirman la resolución) ⭐ *norma vigente*
- Reglamento base — Res. N.° 047-2015-CD/OSIPTEL: https://www.osiptel.gob.pe/media/k1rontlt/res047-2015-cd2.pdf — ✅ VERIFICADO (HTTP 200, ~354 KB)
- Portal del usuario: https://www.osiptel.gob.pe/portal-del-usuario/ — ✅ VERIFICADO
- **Ruta:** 1.ª instancia la empresa operadora → apelación/queja ante el **TRASU** (OSIPTEL).

#### B5.2 SBS — Banca, seguros y AFP
- Portal de atención al usuario: https://www.sbs.gob.pe/usuarios/ — ✅ VERIFICADO (denuncias/reclamos en línea, tel. 0800-10840, chat, WhatsApp)
- Ley 28587 (servicios financieros) — PDF Congreso: https://www2.congreso.gob.pe/sicr/cendocbib/con4_uibd.nsf/7439EC68E9690E8805257A070060E661/$FILE/28587.pdf — ⚠️ NO VERIFICADO (evitar; buscar en SPIJ)
- Reglamento de Conducta de Mercado — Res. SBS 3274-2017: https://www.sbs.gob.pe/Portals/0/jer/Auto_Nuevas_Empresas/Sistema_Financiero/7.%20Reg.%20de%20Gesti%C3%B3n%20de%20Conducta%20de%20Mercado_%20Res.%20SBS%20N%C2%B0%203274-2017.pdf — ⚠️ NO VERIFICADO (conexión cortada; dominio oficial)
- Reglamento de Gestión de Reclamos — Res. SBS 04036-2022 (nota: https://www.sbs.gob.pe/boletin/detalleboletin/idbulletin/1248 — ⚠️ NO VERIFICADO)
- **Ruta (regla de enrutamiento para la app):** reclamo → primero la entidad financiera (15 días hábiles) → PAU-SBS o Defensoría del Cliente Financiero; **las controversias de consumo individuales las resuelve Indecopi** (la SBS supervisa conducta de mercado, no indemniza).

#### B5.3 OSINERGMIN — Electricidad y gas natural
- Procedimiento de Reclamos — Res. N.° 269-2014-OS/CD: https://www.osinergmin.gob.pe/seccion/centro_documental/PlantillaMarcoLegalBusqueda/OSINERGMIN-269-2014-OS-CD.pdf — ✅ VERIFICADO (HTTP 200, ~514 KB)
- Orientación gob.pe: https://www.gob.pe/403-tengo-problemas-con-mi-servicio-de-energia-o-gas-natural — ⚠️ NO VERIFICADO (bloqueo 418)
- **Ruta:** 1.ª instancia la distribuidora → 2.ª y última instancia la **JARU**; recursos en 15 días hábiles.

#### B5.4 SUNASS — Agua y saneamiento
- **TUO vigente — Res. N.° 015-2023-SUNASS-CD** (publicada 04-05-2023; 46 artículos, 4 anexos, 10 formatos). Ficha gob.pe: https://www.gob.pe/institucion/sunass/normas-legales/4190902-015-2023-sunass-cd — ⚠️ NO VERIFICADO (bloqueo 418; URL oficial)
- Norma base: Res. N.° 066-2006-SUNASS-CD. Página propia de SUNASS redirige a gob.pe (migración de portal).
- PDF alternativo (réplica de una EPS) — 🔶 NO OFICIAL: https://www.epsilo.com.pe/uploads/Documentos/RCD_015-2023-SUNASS-CD_TUO_Reglamento_de_Reclamos.pdf
- **Ruta:** 1.ª instancia la EPS → 2.ª instancia el **TRASS** (SUNASS).

#### B5.5 SUSALUD — Salud
- Reglamento de Reclamos y Denuncias — **D.S. N.° 002-2019-SA** (31-01-2019): https://busquedas.elperuano.pe/normaslegales/aprueban-reglamento-para-la-gestion-de-reclamos-y-denuncias-decreto-supremo-n-002-2019-sa-1736853-1/ — ✅ VERIFICADO (contenido)
- Canal de reclamos: http://portal.susalud.gob.pe/blog/reclamos-quejas/ — ✅ VERIFICADO (Libro de Reclamaciones en Salud físico/virtual, línea gratuita **113**, atencionalusuario@susalud.gob.pe, respuesta en 30 días hábiles, gratuito)

#### B5.6 OSITRAN — Infraestructura de transporte (aeropuertos, puertos, carreteras, Línea 1)
- Reglamento de Atención de Reclamos — Res. N.° 019-2011-CD-OSITRAN (versión SPIJ actualizada con R.P. 040-2025-PD): https://www.ositran.gob.pe/anterior/wp-content/uploads/2025/07/reglamento-atencion-reclamos-y-solucion-controversias-version-spij-rp-040-2025-pd.pdf — ✅ VERIFICADO (encabezado confirmado, ~8.5 MB)
- Orientación gob.pe: https://www.gob.pe/102856-tribunal-de-solucion-de-controversias-y-atencion-de-reclamos-del-ositran — ⚠️ NO VERIFICADO (bloqueo 418)
- **Ruta:** 1.ª instancia el concesionario → 2.ª instancia el **TSC** (OSITRAN).

#### B5.7 ATU — Transporte urbano de Lima y Callao
- Sitio oficial: https://www.atu.gob.pe/ — ⚠️ NO VERIFICADO (timeout en el entorno de prueba; dominio oficial)
- Plataforma de reclamos: https://soluciones.atu.gob.pe/ — ⚠️ NO VERIFICADO (503 al momento de la prueba)
- Ficha gob.pe: https://www.gob.pe/atu — ⚠️ NO VERIFICADO (bloqueo 418)
- Canales oficiales reportados: Aló ATU (01) 203-9000, WhatsApp 945 838 534, denunciasfiscalizacion@atu.gob.pe, app ATU
- ⚠️ **Re-verificar antes de la demo** (la plataforma estaba caída al momento del mapeo).

### B6. Guías y materiales oficiales complementarios
- Manual sobre la Protección y Defensa del Consumidor (Indecopi–MINJUSDH, feb. 2021): https://consumidor.gob.pe/wp-content/uploads/2020/07/CodigoConsumo_Indecopi_Minjus_Feb_2021.pdf — ⚠️ NO VERIFICADO (dominio oficial)
- Hub de reclamos por sector (incl. banca/seguros/AFP): https://consumidor.gob.pe/presenta-tu-reclamo-banca-seguros-y-afp/ — ⚠️ NO VERIFICADO
- Consulta de estado de reclamos: https://www.gob.pe/10304-consultar-el-estado-de-reclamos-y-buenos-oficios-en-indecopi — ⚠️ NO VERIFICADO (bloqueo 418)

---

## Hallazgos clave para la construcción del corpus

1. **Vigencia — cuidado con citar textos derogados:**
   - El art. 205 CPP vigente debe leerse en el **Código consolidado**: la Ley 32130 modificó los numerales 1, 3 y 5, y el D. Leg. 1574 modificó el numeral 4.
   - El reglamento vigente de la Ley PNP es el **DS 012-2025-IN** (nov. 2025), no el DS 026-2017-IN.
   - La directiva procedimental vigente de Indecopi es la **001-2021/COD-INDECOPI**; las de 2017 están derogadas.
   - El plazo del Libro de Reclamaciones es **15 días hábiles improrrogables** (DS 101-2022-PCM).
   - El TUO vigente de reclamos SUNASS es la **Res. 015-2023-SUNASS-CD**.
2. **Descarga de PDFs para Cloud Storage:** los más robustos y verificados son los de SPIJ (Constitución, Ley 29571), El Peruano `obtenerDocumento` (CPP, DL 1267, DL 1186), tc.gob.pe (sentencias, Ley 31307), defensoria.gob.pe (Informe 266), INEI (DS 011-2011), OSIPTEL, OSINERGMIN y OSITRAN.
3. **gob.pe requiere User-Agent de navegador** para descargar; el validador de enlaces de la app necesita lista blanca o headers de navegador para ese dominio.
4. **Evitar enlaces de congreso.gob.pe** en el corpus (servidor inestable ante peticiones automatizadas).
5. **Pendientes de re-verificación manual** antes de congelar el corpus v1.0: plataforma ATU (503), Directiva 001-2021 (PDF en CDN bloqueado), reglamentos SBS y contenido de las 3 sentencias TC adicionales (A10).

---

## Revisión complementaria — 29 de julio de 2026

Esta revisión corrige y amplía el mapa inicial:

1. **Ley 32130:** el consolidado oficial del CPP registra sus cambios en los numerales 1, 3 y 5 del artículo 205. Debe incorporarse al corpus junto con el D. Leg. 1574.
2. **Protocolo 2018 desactualizado:** el Informe Defensorial 266 señala que no fue adecuado a los cambios del artículo 205 y recomienda un nuevo protocolo. En enero de 2026 el MINJUSDH anunció coordinación para proponer su actualización: https://www.gob.pe/institucion/minjus/noticias/1341024-ministerio-de-justicia-anuncia-coordinacion-interinstitucional-tras-presentacion-del-informe-defensorial-sobre-comisarias
3. **Libro de Reclamaciones digital:** la Ley 32495 modificó los artículos 150 y 151: https://busquedas.elperuano.pe/dispositivo/NL/2457203-1. La R.M. 244-2026-PCM publicó un proyecto de adecuación reglamentaria: https://www.gob.pe/institucion/pcm/normas-legales/8406634-244-2026-pcm. Al corte, es un proyecto y no debe tratarse como norma final.
4. **Código del Consumidor 2026:** el D. Leg. 1729 añadió mecanismos digitales en el artículo 24. Fuente oficial explicativa: https://elperuano.pe/noticia/289065-compras-online-conoce-tus-nuevos-derechos-y-como-reclamar-sin-complicaciones
5. **Dato del pitch de consumo:** Indecopi reportó 84,912 reclamos por Reclama Virtual entre enero y noviembre de 2025: https://www.gob.pe/institucion/indecopi/noticias/1325804-ocho-de-cada-10-reclamos-de-consumo-se-presentan-de-manera-digital-en-indecopi-a-traves-del-reclama-virtual
6. **Cumplimiento del producto:** incorporar Ley 29733 y D.S. 016-2024-JUS (datos personales), además de Ley 31814 y D.S. 115-2025-PCM (IA): https://www.gob.pe/institucion/pcm/normas-legales/7133522-115-2025-pcm

> **Decisión de corpus:** la primera demo usa únicamente reglas verificadas del CPP consolidado, la Sentencia 1039/2025 y el Código del Consumidor consolidado. El protocolo 2018 se muestra como antecedente desactualizado. Todo el contenido requiere revisión jurídica humana antes de uso público o asesoría individual.
