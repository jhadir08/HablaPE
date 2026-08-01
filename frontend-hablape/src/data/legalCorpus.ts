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
    spijUrl: 'https://spij.minjus.gob.pe/spij-ext-web/detallenorma/N3210',
    elPeruanoUrl: 'https://busquedas.elperuano.pe/normaslegales/ds-012-2025-in',
    tags: ['identificación', 'vía pública', 'derechos fundamentales', 'DNI'],
    citizenSummary: 'La policía puede pedirte identificación en la vía pública por prevención, pero siempre debe tratarte con respeto y sin abuso de fuerza.',
    whenUsed: [
      'Cuando un policía te pide tu DNI mientras caminas o vas en transporte público.',
      'En operativos de control preventivo en vías públicas.',
      'Para verificar que el procedimiento se realice sin discriminación ni arbitrariedad.'
    ],
    relatedCases: [
      'Identificación casual en vía pública',
      'Operativos nocturnos en calles principales',
      'Verificación preventiva de documentos'
    ],
    faqs: [
      {
        question: '¿La policía necesita una orden judicial para pedirme DNI en la calle?',
        answer: 'No. El control de identidad en la calle es una facultad preventiva de la policía sin necesidad de orden judicial previo.'
      },
      {
        question: '¿Pueden tratarme con violencia durante la intervención?',
        answer: 'Absolutamente no. La norma exige respeto irrestricto a los Derechos Humanos y trato proporcionado.'
      }
    ]
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
    spijUrl: 'https://spij.minjus.gob.pe/spij-ext-web/detallenorma/N957',
    elPeruanoUrl: 'https://busquedas.elperuano.pe/normaslegales/ley-32130-cpp',
    tags: ['DNI', 'retencion', '4 horas', '12 horas extranjeros', 'comisaria', 'libro de registro'],
    citizenSummary: 'Si muestras tu DNI y no hay sospechas de delito, el control termina. Si no lo llevas, la retención en comisaría es máximo 4 horas para peruanos (12 para extranjeros).',
    whenUsed: [
      'Cuando te piden DNI en la calle o te conducen a una comisaría por no portar documento físico.',
      'Para calcular el tiempo máximo permitido de retención (4h nacionales / 12h extranjeros).',
      'Para exigir la anotación formal en el Libro de Registro de la Comisaría.'
    ],
    relatedCases: [
      'Olvido de DNI físico al salir de casa',
      'Traslado a comisaría para verificación biométrica',
      'Verificación migratoria de ciudadanos extranjeros'
    ],
    faqs: [
      {
        question: '¿Si me llevan a la comisaría por no tener DNI, estoy detenido?',
        answer: 'No. Es una retención exclusiva para verificación de identidad, no un arresto ni detención por delito.'
      },
      {
        question: '¿Qué pasa si pasan las 4 horas de retención?',
        answer: 'Al cumplirse las 4 horas deben darte la salida inmediatamente si se comprobó tu identidad y no hay requisitoria.'
      }
    ]
  },
  {
    id: 'ds-012-2025-art8',
    documentTitle: 'Reglamento de Control de Identidad Policial',
    code: 'D.S. N° 012-2025-IN',
    category: 'Celulares',
    articleNumber: 'Art. 8',
    title: 'Uso de Medios Digitales y DNI Virtual',
    content: 'El ciudadano puede acreditar su identidad mediante el DNI físico, DNI electrónico, o la exhibición del DNI digital a través de aplicaciones oficiales de RENIEC u otros documentos oficiales con foto y validez legal (licencia de conducir, pasaporte, carnet de extranjería, CPP). El efectivo policial debe verificar el documento en el lugar sin retener indebidamente el dispositivo móvil.',
    publishedDate: '2025-11-05',
    effectiveDate: '2025-11-06',
    version: '2025 (Vigente)',
    isVigente: true,
    officialUrl: 'https://busquedas.elperuano.pe/normaslegales/ds-012-2025-in',
    spijUrl: 'https://spij.minjus.gob.pe/spij-ext-web/detallenorma/N3210',
    elPeruanoUrl: 'https://busquedas.elperuano.pe/normaslegales/ds-012-2025-in',
    tags: ['DNI digital', 'celular', 'RENIEC', 'pasaporte', 'carnet extranjería'],
    citizenSummary: 'Puedes identificarte mostrando tu DNI digital en tu celular o licencia de conducir. El policía no debe quitarte el celular.',
    whenUsed: [
      'Cuando muestras la app del RENIEC o foto de tu documento oficial en tu teléfono.',
      'Para evitar traslados a comisaría si tienes tu DNI virtual disponible.'
    ],
    relatedCases: [
      'Identificación mediante DNI electrónico en smartphone',
      'Presentación de carnet de extranjería o pasaporte'
    ],
    faqs: [
      {
        question: '¿Tiene la misma validez el DNI digital que el azul o electrónico?',
        answer: 'Sí, las apps oficiales de RENIEC o documentos oficiales con fotografía tienen plena validez legal.'
      }
    ]
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
    spijUrl: 'https://spij.minjus.gob.pe/spij-ext-web/detallenorma/N957',
    elPeruanoUrl: 'https://busquedas.elperuano.pe/normaslegales/ley-32130-cpp',
    tags: ['derechos', 'llamada telefónica', 'no calabozo', 'familiares'],
    citizenSummary: 'Prohibido meterte al calabozo por falta de DNI. Tienes derecho a hacer una llamada telefónica para avisar a un familiar o que te lleven el documento.',
    whenUsed: [
      'Durante la retención en comisaría para exigir trato digno fuera de calabozos.',
      'Para solicitar acceso inmediato a tu teléfono y llamar a un familiar.'
    ],
    relatedCases: [
      'Llamada de auxilio a un familiar en caso de retención',
      'Exigencia de no ingresar a celdas de detenidos'
    ],
    faqs: [
      {
        question: '¿Pueden quitarme el celular si estoy retenido en comisaría por DNI?',
        answer: 'No. Tienes derecho a comunicarte para avisar tu ubicación y pedir que te traigan tu documento.'
      }
    ]
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
    spijUrl: 'https://spij.minjus.gob.pe/spij-ext-web/detallenorma/RM1452-2018',
    elPeruanoUrl: 'https://busquedas.elperuano.pe/normaslegales/rm-1452-2018-in',
    tags: ['identificación policía', 'placa policial', 'grado y nombre', 'respeto'],
    citizenSummary: 'El policía tiene la obligación de decirte su nombre, rango y comisaría, y explicar por qué te está deteniendo antes de pedirte tu DNI.',
    whenUsed: [
      'Al iniciar cualquier intervención policial en la calle o vehículo.',
      'Para solicitar respetuosamente el nombre y número de placa del efectivo.'
    ],
    relatedCases: [
      'Intervención policial por agentes vestidos de civil',
      'Requerimiento de identificación por parte del efectivo policial'
    ],
    faqs: [
      {
        question: '¿Puedo pedirle su nombre y placa al policía?',
        answer: 'Sí. Es una obligación del policía identificarse antes de requerir tus documentos.'
      }
    ]
  },
  {
    id: 'const-art2',
    documentTitle: 'Constitución Política del Perú',
    code: 'Const. Art. 2 Inc. 24',
    category: 'Constitución',
    articleNumber: 'Art. 2 Inc. 24 f)',
    title: 'Libertad y Seguridad Personales',
    content: 'Nadie puede ser detenido sino por mandato escrito y motivado del juez o por las autoridades policiales en caso de flagrante delito. El control de identidad policial es una restricción temporal de la libertad ambulatoria, NO una detención por delito, por lo cual exige causa justificada y trato digno.',
    publishedDate: '1993-12-29',
    effectiveDate: 'Vigente',
    version: 'Constitución 1993',
    isVigente: true,
    officialUrl: 'https://www.gob.pe/constitucion',
    spijUrl: 'https://spij.minjus.gob.pe/spij-ext-web/detallenorma/N1993',
    elPeruanoUrl: 'https://www.gob.pe/constitucion',
    tags: ['constitución', 'libertad', 'flagrancia', 'detención'],
    citizenSummary: 'Garantía máxima constitucional: solo pueden detenerte si cometiste un delito evidente o hay orden judicial escrita. El control de DNI no es una detención por delito.',
    whenUsed: [
      'Para fundamentar la diferencia entre una simple verificación de DNI y una detención arbitraria.',
      'Al apelar abuso de autoridad o detención sin flagrancia.'
    ],
    relatedCases: [
      'Defensa frente a detenciones arbitrarias sin flagrancia',
      'Protección constitucional de la libertad individual'
    ],
    faqs: [
      {
        question: '¿Qué es delito flagrante?',
        answer: 'Cuando la persona es descubierta en el instante de cometer un delito o inmediatamente después con pruebas u objetos del hecho.'
      }
    ]
  },
  {
    id: 'ds-012-2025-registro-equipos',
    documentTitle: 'Reglamento de Control de Identidad Policial',
    code: 'D.S. N° 012-2025-IN',
    category: 'Procedimientos',
    articleNumber: 'Art. 12',
    title: 'Límites en el Registro de Celulares y Pertenencias',
    content: 'El control de identidad no autoriza la revisión del contenido privado de teléfonos celulares, chats, correos o galerías de fotos. El secreto de las telecomunicaciones es inviolable conforme al Art. 2 inc. 10 de la Constitución. La Policía únicamente puede realizar un registro superficial de prendas o equipaje de mano cuando existan indicios objetivos de peligro o posesión de armas/objetos ilícitos.',
    publishedDate: '2025-11-05',
    effectiveDate: '2025-11-06',
    version: '2025 (Vigente)',
    isVigente: true,
    officialUrl: 'https://busquedas.elperuano.pe/normaslegales/ds-012-2025-in',
    spijUrl: 'https://spij.minjus.gob.pe/spij-ext-web/detallenorma/N3210',
    elPeruanoUrl: 'https://busquedas.elperuano.pe/normaslegales/ds-012-2025-in',
    tags: ['celular', 'privacidad', 'secreto de comunicaciones', 'revisión'],
    citizenSummary: 'Tu celular y tus chats son privados por Constitución. Ningún policía puede obligarte a desbloquear tu teléfono ni leer tus mensajes en un control de identidad.',
    whenUsed: [
      'Si un policía te exige desbloquear tu smartphone para revisar WhatsApp, fotos o banca móvil.',
      'Para proteger tus datos personales y privacidad durante la intervención.'
    ],
    relatedCases: [
      'Solicitud arbitraria de desbloqueo de smartphone',
      'Inspección de equipaje o mochilas sin sospecha fundada'
    ],
    faqs: [
      {
        question: '¿Pueden obligarme a poner mi huella o clave en el celular?',
        answer: 'No. El secreto de las telecomunicaciones es inviolable salvo orden motivada de un juez.'
      }
    ]
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
  },
  {
    id: 'motivo-intervencion',
    title: 'Motivo de la intervención policial',
    summary: 'Saber por qué razón te detienen y solicitar la identificación del efectivo policial.',
    iconName: 'ShieldAlert',
    userPrompt: 'Un policía me indicó que me detenga en la vía pública. ¿Tengo derecho a saber por qué me intervienen y pedir su nombre o número de placa?',
    keyTakeaways: [
      'El oficial tiene el deber de identificarse primero (nombre, rango y comisaría).',
      'Deben explicarte claramente el motivo del control de identidad o prevención de delito.',
      'Tienes derecho a trato respetuoso en todo momento sin abuso de autoridad.',
      'Puedes anotar o grabar la intervención desde el espacio público.'
    ],
    commonMisconceptions: [
      'Mito: La policía puede detenerte en la calle sin dar ninguna explicación (Falso, deben fundamentar el motivo).',
      'Mito: Grabar a un policía en la vía pública es delito (Falso, es un derecho ciudadano en espacio público).'
    ],
    sampleAudioText: 'Un policía me detuvo en la calle y se niega a decirme su nombre ni por qué me está pidiendo mis documentos.'
  }
];
