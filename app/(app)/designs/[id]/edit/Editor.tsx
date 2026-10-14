"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/app/app.module.css";
import Icon from "@/components/Icon";
import { FIT_MAX, FIT_MIN, PAD, measurementsFor, outlineFor, shadeFor, type Measurement, type Params } from "@/lib/flat";

type View = { width: number; height: number; fillD: string; outlineD: string; shadeD?: string; bbox: { x: number; y: number; w: number; h: number } };

export default function Editor(props: {
  id: string;
  initialName: string;
  initialParams: Params;
  views: { front: View; back?: View };
  baseMeasurements: Measurement[];
  hasPrint: boolean;
  hasReference: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(props.initialName);
  const [p, setP] = useState<Params>(props.initialParams);
  const [side, setSide] = useState<"front" | "back">("front");
  const [showRef, setShowRef] = useState(props.hasReference);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef(false);

  const view = side === "back" && props.views.back ? props.views.back : props.views.front;
  const set = (patch: Partial<Params>) => {
    setP((cur) => ({ ...cur, ...patch }));
    setDirty(true);
  };
  const setPrint = (patch: Partial<NonNullable<Params["print"]>>) => p.print && set({ print: { ...p.print, ...patch } });

  const rows = useMemo(() => measurementsFor(props.baseMeasurements, p), [props.baseMeasurements, p]);

  const padX = view.width * PAD, padY = view.height * PAD;
  const W = view.width + 2 * padX, H = view.height + 2 * padY;
  const cx = view.bbox.x + view.bbox.w / 2, cy = view.bbox.y + view.bbox.h / 2;
  const T = `translate(${padX} ${padY}) translate(${cx} ${cy}) scale(${p.fit.w} ${p.fit.l}) translate(${-cx} ${-cy})`;
  const showPrint = side === "front" && props.hasPrint && p.print?.enabled;
  const pw = (p.print?.w ?? 0) * view.width;
  const ph = pw * (p.print?.aspect ?? 0.4);

  function moveTo(e: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg || !p.print) return;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W - padX;
    const y = ((e.clientY - r.top) / r.height) * H - padY;
    setPrint({ cx: Math.min(1, Math.max(0, x / view.width)), cy: Math.min(1, Math.max(0, y / view.height)) });
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      const r = await fetch(`/api/designs/${props.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, params: p }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Could not save.");
      setDirty(false);
      router.push(`/designs/${props.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
      setSaving(false);
    }
  }

  const slider = (label: string, value: number, min: number, max: number, step: number, on: (v: number) => void, fmt = (v: number) => `${Math.round(v * 100)}%`) => (
    <label className={styles.field}>
      <span className={styles.row} style={{ justifyContent: "space-between" }}>{label}<span className={styles.muted}>{fmt(value)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(Number(e.target.value))} />
    </label>
  );

  return (
    <div className={styles.editorGrid}>
      <section className={styles.card}>
        <div className={styles.row} style={{ justifyContent: "space-between" }}>
          <div className={styles.row}>
            <button type="button" className={side === "front" ? styles.btn : styles.btnGhost} onClick={() => setSide("front")}>Front</button>
            {props.views.back && <button type="button" className={side === "back" ? styles.btn : styles.btnGhost} onClick={() => setSide("back")}>Back</button>}
          </div>
          {props.hasReference && (
            <label className={styles.row} style={{ gap: 6 }}>
              <input type="checkbox" checked={showRef} onChange={(e) => setShowRef(e.target.checked)} /> Compare with photo
            </label>
          )}
        </div>
        <div className={styles.compare} data-ref={showRef}>
          <div className={styles.canvas}>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Design preview"
              onPointerMove={(e) => drag.current && moveTo(e)} onPointerUp={() => (drag.current = false)} onPointerLeave={() => (drag.current = false)}>
              <g transform={T}>
                <path d={view.fillD} fill={p.color} fillRule="evenodd" />
                {view.shadeD && <path d={view.shadeD} fill={shadeFor(p.color)} fillRule="evenodd" />}
              </g>
              {showPrint && p.print && (
                <image href={`/api/designs/${props.id}/print.png`} x={padX + p.print.cx * view.width - pw / 2} y={padY + p.print.cy * view.height - ph / 2} width={pw} height={ph}
                  style={{ cursor: "grab", touchAction: "none" }} onPointerDown={(e) => { drag.current = true; (e.target as Element).setPointerCapture(e.pointerId); moveTo(e); }} />
              )}
              <g transform={T} style={{ pointerEvents: "none" }}>
                <path d={view.outlineD} fill={outlineFor(p.color)} fillRule="evenodd" />
              </g>
            </svg>
          </div>
          {showRef && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.refPhoto} src={`/api/designs/${props.id}/reference.jpg?inline=1`} alt="Your reference photo" />
          )}
        </div>
        {showPrint && <p className={styles.muted} style={{ margin: 0 }}>Drag the graphic to place it.</p>}
      </section>

      <aside className={styles.card} style={{ alignSelf: "start" }}>
        <label className={styles.field}>
          Style name
          <input className={styles.input} value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
        </label>
        <label className={styles.field}>
          Fabric colour
          <span className={styles.row}>
            <input type="color" value={p.color} onChange={(e) => set({ color: e.target.value })} style={{ width: 48, height: 36 }} />
            <input className={styles.input} value={p.color} maxLength={7} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set({ color: e.target.value })} style={{ width: 110 }} />
          </span>
        </label>
        {slider("Width", p.fit.w, FIT_MIN, FIT_MAX, 0.01, (v) => set({ fit: { ...p.fit, w: v } }))}
        {slider("Length", p.fit.l, FIT_MIN, FIT_MAX, 0.01, (v) => set({ fit: { ...p.fit, l: v } }))}

        {props.hasPrint && p.print && (
          <>
            <label className={styles.row} style={{ gap: 8, fontWeight: 600 }}>
              <input type="checkbox" checked={p.print.enabled} onChange={(e) => setPrint({ enabled: e.target.checked })} /> Chest graphic
            </label>
            {p.print.enabled && (
              <>
                {slider("Size", p.print.w, 0.04, 0.6, 0.005, (v) => setPrint({ w: v }), (v) => `${Math.round(v * 100)}% of width`)}
                {slider("Left to right", p.print.cx, 0, 1, 0.005, (v) => setPrint({ cx: v }), () => "")}
                {slider("Up and down", p.print.cy, 0, 1, 0.005, (v) => setPrint({ cy: v }), () => "")}
              </>
            )}
          </>
        )}

        <div>
          <b>Measurements (cm)</b>
          <table className={styles.table}>
            <tbody>
              {rows.map((m) => (
                <tr key={m.code}>
                  <td>{m.code} · {m.point}</td>
                  <td>
                    <input type="number" step="0.1" min="0" className={styles.input} style={{ width: 84, minHeight: 32, textAlign: "right" }} value={m.cm}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        const next = { ...p.overrides };
                        if (v > 0) next[m.code] = v; else delete next[m.code];
                        set({ overrides: next });
                      }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.row}>
          <button type="button" className={styles.btn} onClick={save} disabled={saving} style={{ height: 40 }}>
            <Icon d="check" size={16} />{saving ? "Rebuilding files..." : "Save and rebuild files"}
          </button>
          <Link href={`/designs/${props.id}`} className={styles.btnGhost} style={{ height: 40 }}>Cancel</Link>
        </div>
        {dirty && !saving && <p className={styles.muted} style={{ margin: 0 }}>Unsaved changes. Saving rebuilds every export.</p>}
      </aside>
    </div>
  );
}
