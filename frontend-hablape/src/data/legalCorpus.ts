import { CorpusArticle, FrequentScenario } from '../types';

export const LEGAL_CORPUS: CorpusArticle[] = [
  {
    id: 'ds-012-2025-art1',
    documentTitle: 'Reglamento de Control de Identidad Policial',
    code: 'D.S. N° 012-2025-IN',
    category: 'Control de Identidad',
    articleNumber: 'Art. 3',
    title: 'Objeto y Ámbito del Control de Identidad',
    content: 'La Policía Nacional del Perú, en el marco de sus funciones de prevención e investigación del delito, puede requerir la identificación de cualquier persona en vías o lugares públicos. El requerimiento debe realizarse con respeto irrestricto a los Derechos Humanos y bajo principios de proporcionalidad y necesidad.',
    publishedDate: '2025-11-05',
    effectiveDate: '2025-11-06',
    version: '2025 (Vigente)',
    isVigente: true,
    supersedes: 'D.S. N° 026-2017-IN (Derogado)',
    officialUrl: 'https://busquedas.elperuano.pe/normaslegales/ds-012-2025-in',
    tags: ['identificación', 'vía pública', 'derechos fundamentales', 'DNI']
  },
  {
    id: 'cpp-205',
    documentTitle: 'Código Procesal Penal - D. Leg. N° 957',
    code: 'CPP Art. 205',
    category: 'Control de Identidad',
    articleNumber: 'Art. 205 (Modificado por D.L. 1574 y Ley 32130)',
    title: 'Control de Identidad Policial y Retención',
    content: '1. La Policía, sin necesidad de orden del Fiscal o del Juez, podrá requerir la identificación de cualquier persona y realizar las comprobaciones pertinentes en la vía pública o en el lugar donde se hubiere hecho el requerimiento.\n2. La persona tiene derecho a exhibir su Documento Nacional de Identidad (DNI) o documento oficial de identidad (físico o digital válido). Si exhibe el documento y no hay motivos fundados de vinculación con un delito, concluye el procedimiento.\n3. Si la persona no porta su DNI o existan dudas sobre su autenticidad, la Policía puede conducirla a la Comisaría más cercana exclusivamente para efectos de identificación. El procedimiento de retención en la comisaría no podrá exceder de cuatro (4) horas para peruanos y hasta doce (12) horas para ciudadanos extranjeros en verificación migratoria.\n4. Se debe llevar un Libro de Registro de Identificación Policial donde conste hora de ingreso, motivo y hora de salida.',
    publishedDate: '2004-07-29',
    effectiveDate: 'Vigente con modif. 2024/2025',
    version: 'Texto Unificado 2025',
    isVigente: true,
    officialUrl: 'https://spij.minjus.gob.pe/spij-ext-web/',
    tags: ['DNI', 'retencion', '4 horas', '12 horas extranjeros', 'comisaria', 'libro de registro']
  },
  {
    id: 'ds-012-2025-art8',
    documentTitle: 'Reglamento de Control de Identidad Policial',
    code: 'D.S. N° 012-2025-IN',
    category: 'Atribuciones Policiales',
    articleNumber: 'Art. 8',
    title: 'Uso de Medios Digitales y DNI Virtual',
    content: 'El ciudadano puede acreditar su identidad mediante el DNI físico, DNI electrónico, o la exhibición del DNI digital a través de aplicaciones oficiales de RENIEC u otros documentos oficiales con foto y validez legal (licencia de conducir, pasaporte, carnet de extranjería, CPP). El efectivo policial debe verificar el documento en el lugar sin retener indebidamente el dispositivo móvil.',
    publishedDate: '2025-11-05',
    effectiveDate: '2025-11-06',
    version: '2025 (Vigente)',
    isVigente: true,
    officialUrl: 'https://busquedas.elperuano.pe/normaslegales/ds-012-2025-in',
    tags: ['DNI digital', 'celular', 'RENIEC', 'pasaporte', 'carnet extranjería']
  },
  {
    id: 'cpp-205-5',
    documentTitle: 'Código Procesal Penal - D. Leg. N° 957',
    code: 'CPP Art. 205 Inc. 5',
    category: 'Garantías Constitucionales',
    articleNumber: 'Art. 205.5',
    title: 'Garantías durante la Conducción a Comisaría',
    content: 'A la persona retenida para identificación no se le registrará ni ingresará a un calabozo o celda de detenidos, ni se le considerará bajo arresto o detención imputativa. Tiene derecho a comunicarse con un familiar o persona de su confianza para informar sobre su ubicación y solicitar que le alcancen su documento de identidad.',
    publishedDate: '2004-07-29',
    effectiveDate: 'Vigente',
    version: 'Texto Unificado 2025',
    isVigente: true,
    officialUrl: 'https://spij.minjus.gob.pe/spij-ext-web/',
    tags: ['derechos', 'llamada telefónica', 'no calabozo', 'familiares']
  },
  {
    id: 'manual-ddhh-pnp',
    documentTitle: 'Manual de Derechos Humanos aplicados a la Función Policial',
    code: 'R.M. N° 1452-2018-IN',
    category: 'Derechos Humanos',
    articleNumber: 'Cap. IV - Sec. B',
    title: 'Conducta e Identificación del Personal Policial',
    content: 'El personal policial que realiza un control de identidad debe vestir el uniforme reglamentario o portar su placa e identificación visible si viste de civil (unidades especializadas). Antes de solicitar el documento al ciudadano, el efectivo policial DEBE identificarse expresamente dando su grado, nombre y la unidad a la que pertenece, y explicar el motivo general de la intervención.',
    publishedDate: '2018-12-12',
    effectiveDate: 'Vigente',
    version: 'Vigente',
    isVigente: true,
    officialUrl: 'https://www.gob.pe/mininter',
    tags: ['identificación policía', 'placa policial', 'grado y nombre', 'respeto']
  },
  {
    id: 'const-art2',
    documentTitle: 'Constitución Política del Perú',
    code: 'Const. Art. 2 Inc. 24',
    category: 'Garantías Constitucionales',
    articleNumber: 'Art. 2 Inc. 24 f)',
    title: 'Libertad y Seguridad Personales',
    content: 'Nadie puede ser detenido sino por mandato escrito y motivado del juez o por las autoridades policiales en caso de flagrante delito. El control de identidad policial es una restricción temporal de la libertad ambulatoria, NO una detención por delito, por lo cual exige causa justificada y trato digno.',
    publishedDate: '1993-12-29',
    effectiveDate: 'Vigente',
    version: 'Constitución 1993',
    isVigente: true,
    officialUrl: 'https://www.gob.pe/constitucion',
    tags: ['constitución', 'libertad', 'flagrancia', 'detención']
  },
  {
    id: 'ds-012-2025-registro-equipos',
    documentTitle: 'Reglamento de Control de Identidad Policial',
    code: 'D.S. N° 012-2025-IN',
    category: 'Atribuciones Policiales',
    articleNumber: 'Art. 12',
    title: 'Límites en el Registro de Celulares y Pertenencias',
    content: 'El control de identidad no autoriza la revisión del contenido privado de teléfonos celulares, chats, correos o galerías de fotos. El secreto de las telecomunicaciones es inviolable conforme al Art. 2 inc. 10 de la Constitución. La Policía únicamente puede realizar un registro superficial de prendas o equipaje de mano cuando existan indicios objetivos de peligro o posesión de armas/objetos ilícitos.',
    publishedDate: '2025-11-05',
    effectiveDate: '2025-11-06',
    version: '2025 (Vigente)',
    isVigente: true,
    officialUrl: 'https://busquedas.elperuano.pe/normaslegales/ds-012-2025-in',
    tags: ['celular', 'privacidad', 'secreto de comunicaciones', 'revisión']
  }
];

export const FREQUENT_SCENARIOS: FrequentScenario[] = [
  {
    id: 'no-dni-fisico',
    title: 'No llevo mi DNI físico al salir a la calle',
    summary: 'Me detuvo un patrullero y me pide DNI, pero solo lo tengo digital en mi celular o recordado de memoria.',
    iconName: 'CreditCard',
    userPrompt: 'Un policía me intervino en la avenida Arequipa y me pide DNI. No tengo el DNI físico conmigo pero tengo una foto en el celular y sé el número de memoria. ¿Me puede llevar a la comisaría?',
    keyTakeaways: [
      'El DNI digital o la verificación biométrica por sistema PNP/RENIEC es válida.',
      'Puedes dar tu número de DNI y nombres completos para que lo verifiquen en el sistema.',
      'Si no se logra verificar y persisten dudas razonables, la Policía puede conducirte a la comisaría por un máximo de 4 horas.',
      'En la comisaría NO te pueden meter a un calabozo.'
    ],
    commonMisconceptions: [
      'Mito: Es obligatorio llevar el DNI plástico en el bolsillo bajo pena de multa automática (Falso).',
      'Mito: Si vas a la comisaría por identidad estás detenido por delito (Falso, es retención administrativa).'
    ],
    sampleAudioText: 'Me han parado en la calle y me piden DNI. No lo tengo a la mano pero les dije mi número de DNI y no quieren revisar su sistema.'
  },
  {
    id: 'revisar-celular',
    title: 'Policía exige revisar mis chats o mi teléfono',
    summary: 'Durante un control de identidad, el efectivo me exige desbloquear el celular para ver mis WhatsApp o fotos.',
    iconName: 'Smartphone',
    userPrompt: 'Estaba en el parque y me hicieron control de identidad. El policía me pidió que le entregue el celular desbloqueado para revisar mis mensajes. ¿Es legal?',
    keyTakeaways: [
      'NO es legal. El secreto de las comunicaciones está protegido por la Constitución (Art. 2 inc. 10).',
      'El control de identidad NO faculta al policía a revisar el contenido privado de tu teléfono.',
      'Solo un Juez puede ordenar el levantamiento del secreto de las comunicaciones.',
      'Puedes negarte cortésmente citando el Art. 12 del D.S. N° 012-2025-IN.'
    ],
    commonMisconceptions: [
      'Mito: El policía tiene derecho a revisar el celular de cualquiera en una intervención preventiva (Falso).',
      'Mito: Negarte a dar la clave del celular es delito de desobediencia a la autoridad (Falso).'
    ],
    sampleAudioText: 'Un oficial me pide que desbloquee mi celular para ver mis fotos y mensajes durante la intervención.'
  },
  {
    id: 'retencion-comisaria',
    title: 'Conducción a la Comisaría y plazo de 4 horas',
    summary: 'No pude acreditar mi identidad en la calle y me trasladan en patrullero a la comisaría.',
    iconName: 'Clock',
    userPrompt: 'Me llevaron a la comisaría de Miraflores porque no tenía mi DNI. Ya pasaron 2 horas. ¿Cuáles son mis derechos aquí dentro?',
    keyTakeaways: [
      'El plazo máximo absoluto de retención para identificación de peruanos es de 4 HORAS.',
      'Para ciudadanos extranjeros con verificación migratoria es hasta 12 HORAS.',
      'Tienes derecho a una llamada telefónica a un familiar para que te traiga el DNI.',
      'Exige que anoten tu hora exacta de ingreso en el Libro de Registro de Identificación Policial.'
    ],
    commonMisconceptions: [
      'Mito: En la comisaría te pueden quitar todas tus pertenencias y encerrar en calabozo (Falso).',
      'Mito: La retención se puede prolongar por 24 horas sin motivo (Falso, máximo 4 horas).'
    ],
    sampleAudioText: 'Me llevaron a la comisaría por no tener DNI y me quieren hacer esperar sin darme derecho a llamar a mi familia.'
  },
  {
    id: 'ciudadano-extranjero',
    title: 'Intervención a Ciudadanos Extranjeros',
    summary: 'Documentos migratorios, pasaporte, Carnet de Extranjería o CPP en controles de identidad.',
    iconName: 'Globe',
    userPrompt: 'Soy ciudadano venezolano con Carnet de Permiso Temporal de Permanencia (CPP). La policía me detuvo y dice que ese documento no vale. ¿Qué aplica?',
    keyTakeaways: [
      'El Carnet de Extranjería, CPP o Pasaporte son documentos oficiales válidos acreditados en el Perú.',
      'La Policía coordina con Migraciones (Interpol/SIPOL) para la verificación.',
      'El plazo de retención exclusivamente para verificación migratoria no puede exceder de 12 horas.',
      'Tienes derecho a asistencia de tu representación consular si lo solicitas.'
    ],
    commonMisconceptions: [
      'Mito: El CPP o Carnet de Extranjería no sirve para identificarse ante la Policía (Falso, es oficial).',
      'Mito: Una retención por verificación migratoria es expulsión directa (Falso, son trámites distintos).'
    ]
  }
];
