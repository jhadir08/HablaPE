"use client";

import { useMemo, useState } from "react";

type Journey = "identidad" | "consumo";

const identitySample =
  "Un policía me pidió mi DNI mientras caminaba. No me explicó el motivo y dijo que iría a la comisaría si no lo encontraba.";

const consumerSample =
  "Compré unos audífonos por internet. Uno dejó de funcionar al día siguiente y la tienda no quiere cambiarlos.";

const officialLinks = {
  cpp: "https://diariooficial.elperuano.pe/Normas/obtenerDocumento?idNorma=70003",
  tc: "https://www.tc.gob.pe/jurisprudencia/2025/01356-2024-HC.html",
  consumer:
    "https://diariooficial.elperuano.pe/Normas/obtenerDocumento?idNorma=17",
  reclama: "https://enlinea.indecopi.gob.pe/reclamavirtual/",
};

function Brand() {
  return (
    <a className="brand" href="#inicio" aria-label="HablaPE, ir al inicio">
      <span className="brand-mark" aria-hidden="true">
        H
      </span>
      <span>
        Habla<span>PE</span>
      </span>
    </a>
  );
}

function ShieldIcon() {
  return (
    <span className="mini-icon" aria-hidden="true">
      ✓
    </span>
  );
}

function SourceLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className="source-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function IdentityResult({ story }: { story: string }) {
  const urgent = /cinco|5 horas|celda|golpe|deten/i.test(story);
  const noReason = /no me explic|sin motivo|porque sí/i.test(story);

  return (
    <section className="result-stack" aria-live="polite">
      {urgent && (
        <div className="urgent-note">
          <strong>Puede requerir ayuda urgente.</strong>
          <span>
            Si sigues retenido, estás en una celda o temes por tu integridad,
            busca apoyo inmediato de una persona de confianza o defensa legal.
          </span>
        </div>
      )}

      <article className="answer-card facts">
        <p className="eyebrow">1 · Lo que nos contaste</p>
        <p>{story}</p>
        <span className="provenance">Dato proporcionado por ti · no verificado</span>
      </article>

      <article className="answer-card source">
        <p className="eyebrow">2 · Lo que dice la fuente oficial</p>
        <h3>El control necesita una razón objetiva</h3>
        <p>
          El artículo 205 permite pedir la identificación para prevenir un
          delito u obtener información útil sobre un hecho punible. La
          identificación debe intentarse en el lugar y deben darte facilidades
          para encontrar o mostrar tu documento.
        </p>
        <div className="source-list">
          <SourceLink href={officialLinks.cpp}>
            Código Procesal Penal · art. 205
          </SourceLink>
          <SourceLink href={officialLinks.tc}>
            TC · Sentencia 1039/2025
          </SourceLink>
        </div>
      </article>

      <article className="answer-card explain">
        <p className="eyebrow">3 · En palabras simples</p>
        <h3>{noReason ? "Pedir el DNI no es una facultad sin límites" : "Primero debe intentarse identificarte allí"}</h3>
        <p>
          Puedes preguntar con calma el motivo y la dependencia del agente. Si
          no llevas el documento, puedes pedir facilidades para ubicarlo o
          mostrarlo. El traslado para identificarte es excepcional.
        </p>
        <div className="time-rule">
          <span>04 h</span>
          <p>
            límite indicado para la diligencia de identificación de una
            persona peruana, no una autorización automática para retenerte.
          </p>
        </div>
      </article>

      <article className="answer-card action">
        <p className="eyebrow">4 · Qué puedes hacer ahora</p>
        <ol className="action-list">
          <li>
            <span>1</span>
            Pregunta el motivo del control y anota hora, lugar y dependencia.
          </li>
          <li>
            <span>2</span>
            Muestra tu documento o pide una alternativa razonable para
            identificarte.
          </li>
          <li>
            <span>3</span>
            Si hay traslado, solicita comunicarte con una persona de confianza
            y conserva los datos de la diligencia.
          </li>
        </ol>
      </article>

      <div className="caution-card">
        <ShieldIcon />
        <div>
          <strong>Una fuente operativa necesita actualización</strong>
          <p>
            El protocolo de 2018 es un antecedente útil, pero la Defensoría del
            Pueblo informó que no está adecuado al artículo 205 vigente. Por
            eso esta demo prioriza el Código consolidado y la sentencia del TC.
          </p>
        </div>
      </div>
    </section>
  );
}

function ComplaintDraft({
  provider,
  date,
  order,
  problem,
}: {
  provider: string;
  date: string;
  order: string;
  problem: string;
}) {
  return (
    <section className="result-stack" aria-live="polite">
      <article className="answer-card facts">
        <p className="eyebrow">1 · Datos confirmados</p>
        <dl className="confirm-grid">
          <div>
            <dt>Proveedor</dt>
            <dd>{provider || "No indicado"}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{date || "No indicada"}</dd>
          </div>
          <div>
            <dt>Pedido</dt>
            <dd>{order || "No indicado"}</dd>
          </div>
        </dl>
        <span className="provenance">Datos proporcionados por ti · editables</span>
      </article>

      <article className="answer-card source">
        <p className="eyebrow">2 · La regla aplicable</p>
        <h3>El producto debe ser idóneo</h3>
        <p>
          Lo recibido debe corresponder con lo ofrecido y con lo que
          razonablemente esperabas. El proveedor tiene hasta 15 días hábiles
          para atender el reclamo.
        </p>
        <SourceLink href={officialLinks.consumer}>
          Código del Consumidor · arts. 18, 19 y 24
        </SourceLink>
      </article>

      <article className="answer-card draft-card">
        <div className="draft-heading">
          <div>
            <p className="eyebrow">3 · Borrador para editar</p>
            <h3>Reclamo por falta de idoneidad</h3>
          </div>
          <span className="draft-badge">Borrador</span>
        </div>
        <p className="letter">
          Señores {provider || "[proveedor]"}:
          <br />
          <br />
          El {date || "[fecha]"} realicé la compra identificada con el pedido{" "}
          {order || "[número]"}.
          <br />
          <br />
          {problem}
          <br />
          <br />
          Solicito que se evalúe el producto y se me brinde una solución idónea,
          dejando constancia de la respuesta dentro del plazo legal.
        </p>
        <button
          className="copy-button"
          onClick={() =>
            navigator.clipboard?.writeText(
              `Señores ${provider || "[proveedor]"}:\n\nEl ${
                date || "[fecha]"
              } realicé la compra identificada con el pedido ${
                order || "[número]"
              }.\n\n${problem}\n\nSolicito que se evalúe el producto y se me brinde una solución idónea, dejando constancia de la respuesta dentro del plazo legal.`,
            )
          }
        >
          Copiar borrador
        </button>
      </article>

      <article className="answer-card action">
        <p className="eyebrow">4 · Canal recomendado</p>
        <ol className="action-list">
          <li>
            <span>1</span>
            Presenta el texto en el Libro de Reclamaciones del proveedor y
            guarda la constancia.
          </li>
          <li>
            <span>2</span>
            Si no se resuelve, usa Reclama Virtual de Indecopi. No inventes
            fechas ni adjuntos.
          </li>
        </ol>
        <a
          className="primary-link"
          href={officialLinks.reclama}
          target="_blank"
          rel="noreferrer"
        >
          Abrir Reclama Virtual <span aria-hidden="true">↗</span>
        </a>
      </article>
    </section>
  );
}

export default function Home() {
  const [journey, setJourney] = useState<Journey>("identidad");
  const [story, setStory] = useState(identitySample);
  const [analyzed, setAnalyzed] = useState(false);
  const [simulatedDoc, setSimulatedDoc] = useState(false);
  const [provider, setProvider] = useState("Tienda Demo S.A.C.");
  const [date, setDate] = useState("2026-07-10");
  const [order, setOrder] = useState("DEMO-2048");
  const [problem, setProblem] = useState(
    "Los audífonos dejaron de funcionar al día siguiente y el proveedor rechazó el cambio.",
  );
  const [drafted, setDrafted] = useState(false);

  const wordCount = useMemo(
    () => story.trim().split(/\s+/).filter(Boolean).length,
    [story],
  );

  const switchJourney = (next: Journey) => {
    setJourney(next);
    setAnalyzed(false);
    setDrafted(false);
    setSimulatedDoc(false);
    setStory(next === "identidad" ? identitySample : consumerSample);
  };

  return (
    <main id="inicio">
      <header className="site-header">
        <Brand />
        <nav aria-label="Navegación principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#fuentes">Fuentes</a>
        </nav>
        <span className="demo-pill">Demo · is_synthetic=true</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">Orientación ciudadana · Perú</p>
          <h1>
            Conoce el procedimiento.
            <span>Actúa informado.</span>
          </h1>
          <p className="hero-lede">
            Cuéntanos qué pasó. HablaPE separa tus hechos de la fuente oficial
            y te muestra un siguiente paso claro.
          </p>
          <div className="trust-row">
            <span>
              <ShieldIcon /> Fuentes oficiales
            </span>
            <span>
              <ShieldIcon /> Sin guardar tus datos
            </span>
          </div>
        </div>
        <aside className="scope-card">
          <p className="eyebrow">Primera demo</p>
          <strong>Dos situaciones frecuentes</strong>
          <div className="scope-stat">
            <span>01</span>
            <p>Control de identidad policial</p>
          </div>
          <div className="scope-stat">
            <span>02</span>
            <p>Reclamo por una compra</p>
          </div>
          <p className="scope-note">
            No cubre casos laborales, penales ni asesoría personalizada.
          </p>
        </aside>
      </section>

      <section className="workspace" aria-labelledby="workspace-title">
        <div className="workspace-heading">
          <div>
            <p className="kicker">Prueba el recorrido</p>
            <h2 id="workspace-title">¿Qué te pasó?</h2>
          </div>
          <p>Paso 1 de 3 · elige una situación</p>
        </div>

        <div className="journey-tabs" role="tablist" aria-label="Situación">
          <button
            role="tab"
            aria-selected={journey === "identidad"}
            className={journey === "identidad" ? "active" : ""}
            onClick={() => switchJourney("identidad")}
          >
            <span aria-hidden="true">01</span>
            Un policía me pidió identificarme
          </button>
          <button
            role="tab"
            aria-selected={journey === "consumo"}
            className={journey === "consumo" ? "active" : ""}
            onClick={() => switchJourney("consumo")}
          >
            <span aria-hidden="true">02</span>
            Tengo un problema con una compra
          </button>
        </div>

        {journey === "identidad" ? (
          <div className="interaction-grid">
            <section className="input-panel">
              <label htmlFor="story">Cuéntalo con tus palabras</label>
              <p className="field-help">
                No escribas nombres, DNI, dirección ni otros datos reales.
              </p>
              <textarea
                id="story"
                value={story}
                onChange={(event) => {
                  setStory(event.target.value);
                  setAnalyzed(false);
                }}
                rows={7}
              />
              <div className="field-footer">
                <span>{wordCount} palabras</span>
                <button
                  className="text-button"
                  onClick={() => {
                    setStory(identitySample);
                    setAnalyzed(false);
                  }}
                >
                  Usar ejemplo
                </button>
              </div>

              <div className="simulator-row">
                <button
                  className="sim-button"
                  onClick={() => {
                    setStory(identitySample);
                    setAnalyzed(false);
                  }}
                >
                  <span aria-hidden="true">●</span>
                  Simular audio
                  <small>Transcripción local ficticia</small>
                </button>
                <button
                  className="sim-button"
                  onClick={() => setSimulatedDoc((current) => !current)}
                >
                  <span aria-hidden="true">▤</span>
                  Simular acta
                  <small>Extracción ficticia</small>
                </button>
              </div>

              {simulatedDoc && (
                <div className="simulation-note">
                  <strong>Acta DEMO-001 leída</strong>
                  <span>
                    27 minutos · Comisaría Demo · is_synthetic=true
                  </span>
                </div>
              )}

              <button
                className="primary-button"
                disabled={wordCount < 4}
                onClick={() => setAnalyzed(true)}
              >
                Revisar situación <span aria-hidden="true">→</span>
              </button>
              <p className="privacy-line">
                Esta demo procesa todo en tu navegador y no guarda el relato.
              </p>
            </section>

            <div className="output-panel">
              {analyzed ? (
                <IdentityResult story={story} />
              ) : (
                <div className="empty-state">
                  <span aria-hidden="true">H</span>
                  <h3>Aquí aparecerá una orientación trazable</h3>
                  <p>
                    Verás por separado tus datos, la fuente oficial, una
                    explicación simple y el siguiente paso.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="interaction-grid">
            <section className="input-panel">
              <div className="form-grid">
                <label>
                  Proveedor
                  <input
                    value={provider}
                    onChange={(event) => {
                      setProvider(event.target.value);
                      setDrafted(false);
                    }}
                  />
                </label>
                <label>
                  Fecha de compra
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setDrafted(false);
                    }}
                  />
                </label>
              </div>
              <label>
                Número de pedido
                <input
                  value={order}
                  onChange={(event) => {
                    setOrder(event.target.value);
                    setDrafted(false);
                  }}
                />
              </label>
              <label htmlFor="problem">¿Qué ocurrió?</label>
              <textarea
                id="problem"
                value={problem}
                onChange={(event) => {
                  setProblem(event.target.value);
                  setDrafted(false);
                }}
                rows={6}
              />

              <button
                className="sim-button receipt"
                onClick={() => {
                  setProvider("Tienda Demo S.A.C.");
                  setDate("2026-07-10");
                  setOrder("DEMO-2048");
                  setProblem(
                    "Los audífonos dejaron de funcionar al día siguiente y el proveedor rechazó el cambio.",
                  );
                  setSimulatedDoc(true);
                  setDrafted(false);
                }}
              >
                <span aria-hidden="true">▤</span>
                Simular lectura de boleta
                <small>Solo datos ficticios · is_synthetic=true</small>
              </button>

              {simulatedDoc && (
                <div className="simulation-note">
                  <strong>Boleta DEMO-2048 leída</strong>
                  <span>Tienda Demo · S/ 149.90 · datos ficticios</span>
                </div>
              )}

              <button
                className="primary-button"
                disabled={problem.trim().length < 12}
                onClick={() => setDrafted(true)}
              >
                Crear borrador <span aria-hidden="true">→</span>
              </button>
              <p className="privacy-line">
                Revisa siempre el texto antes de presentarlo.
              </p>
            </section>

            <div className="output-panel">
              {drafted ? (
                <ComplaintDraft
                  provider={provider}
                  date={date}
                  order={order}
                  problem={problem}
                />
              ) : (
                <div className="empty-state">
                  <span aria-hidden="true">H</span>
                  <h3>Primero confirma los hechos</h3>
                  <p>
                    HablaPE no inventará fechas, pedidos ni solicitudes. El
                    borrador se crea solo con lo que tú confirmes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="how" id="como-funciona">
        <div>
          <p className="kicker">Diseñado para generar confianza</p>
          <h2>La respuesta no mezcla hechos con reglas</h2>
        </div>
        <div className="principles">
          <article>
            <span>01</span>
            <h3>Tú confirmas los datos</h3>
            <p>La demo distingue lo que contaste de lo que puede comprobar.</p>
          </article>
          <article>
            <span>02</span>
            <h3>La fuente queda visible</h3>
            <p>Cada regla importante enlaza al documento oficial utilizado.</p>
          </article>
          <article>
            <span>03</span>
            <h3>El siguiente paso es concreto</h3>
            <p>Te orienta a documentar, reclamar o buscar ayuda cuando toca.</p>
          </article>
        </div>
      </section>

      <section className="sources-section" id="fuentes">
        <div>
          <p className="kicker">Corpus de demostración</p>
          <h2>Fuentes oficiales, con vigencia visible</h2>
        </div>
        <div className="source-cards">
          <SourceLink href={officialLinks.cpp}>
            Código Procesal Penal consolidado
          </SourceLink>
          <SourceLink href={officialLinks.tc}>
            Sentencia 1039/2025 del TC
          </SourceLink>
          <SourceLink href={officialLinks.consumer}>
            Código del Consumidor consolidado
          </SourceLink>
        </div>
      </section>

      <footer>
        <Brand />
        <p>
          Prototipo informativo. No es asesoría legal ni reemplaza a una
          autoridad o profesional.
        </p>
        <span>HablaPE · Demo 2026</span>
      </footer>
    </main>
  );
}
