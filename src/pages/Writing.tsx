import { useEffect, useRef, useState } from 'react'
import { Segmented } from '../components/Segmented'
import { KANA_ROWS, SCRIPT_LABEL, display, type Kana, type Script } from '../data/kana'
import { speak } from '../lib/speech'
import { usePersistentState } from '../lib/storage'

type Strokes = Record<string, string[]>

// 쓰기 연습 대상: 기본 + 탁음·반탁음 (요음은 두 글자 조합이라 제외)
const WRITABLE: Kana[] = KANA_ROWS.filter((r) => r.category !== 'yoon').flatMap((r) => r.kana.filter((k): k is Kana => k !== null))

/** path의 시작점 (획 번호 표시용) */
function startPoint(d: string): [number, number] | null {
  const m = d.match(/^[Mm]\s*(-?[\d.]+)[\s,]*(-?[\d.]+)/)
  return m ? [Number(m[1]), Number(m[2])] : null
}

export function Writing() {
  const [strokes, setStrokes] = useState<Strokes | null>(null)
  const [script, setScript] = usePersistentState<Script>('write.script', 'hiragana')
  const [index, setIndex] = usePersistentState('write.index', 0)
  const [showGuide, setShowGuide] = usePersistentState('write.guide', true)
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    import('../data/strokes.json').then((m) => setStrokes(m.default as Strokes))
  }, [])

  const kana = WRITABLE[index] ?? WRITABLE[0]
  const char = display(kana, script)
  const paths = strokes?.[char] ?? []
  const go = (i: number) => setIndex((i + WRITABLE.length) % WRITABLE.length)

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={script}
          onChange={setScript}
          options={[
            { value: 'hiragana', label: SCRIPT_LABEL.hiragana },
            { value: 'katakana', label: SCRIPT_LABEL.katakana },
          ]}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showGuide} onChange={(e) => setShowGuide(e.target.checked)} className="size-4 accent-rose-600" />
          따라 쓰기 안내선
        </label>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => go(index - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-lg">
          ←
        </button>
        <button type="button" onClick={() => speak(kana.h)} className="text-center">
          <span className="font-jp text-3xl font-bold">{char}</span>
          <span className="ml-2 text-slate-500">
            {kana.romaji} · {kana.ko} · {paths.length}획 🔊
          </span>
        </button>
        <button type="button" onClick={() => go(index + 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-lg">
          →
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-500">필순 보기</div>
          <div className="relative aspect-square rounded-2xl border border-slate-200 bg-white">
            <GridLines />
            <svg key={`${char}-${replay}`} viewBox="0 0 109 109" className="absolute inset-0 size-full">
              {paths.map((d, i) => (
                <path key={`bg-${i}`} d={d} fill="none" stroke="#e2e8f0" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  pathLength={1}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stroke-draw"
                  style={{ animationDelay: `${i * 0.8}s` }}
                />
              ))}
              {paths.map((d, i) => {
                const p = startPoint(d)
                return (
                  p && (
                    <g key={`n-${i}`} className="stroke-num" style={{ animationDelay: `${i * 0.8}s` }}>
                      <circle cx={p[0]} cy={p[1]} r={4.2} fill="#e11d48" />
                      <text x={p[0]} y={p[1] + 2.3} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="white">
                        {i + 1}
                      </text>
                    </g>
                  )
                )
              })}
            </svg>
          </div>
          <button type="button" onClick={() => setReplay((r) => r + 1)} className="w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium">
            ▶ 다시 보기
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-500">따라 쓰기</div>
          <DrawPad key={char} guide={showGuide ? paths : []} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {WRITABLE.map((k, i) => (
          <button
            key={k.h}
            type="button"
            onClick={() => go(i)}
            className={`font-jp size-9 rounded-lg border text-lg ${i === index ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-200 bg-white'}`}
          >
            {display(k, script)}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        필순 데이터: <a href="https://kanjivg.tagaini.net/" target="_blank" rel="noreferrer" className="underline">KanjiVG</a> (CC BY-SA 3.0)
      </p>
    </div>
  )
}

function GridLines() {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      <line x1="50" y1="0" x2="50" y2="100" stroke="#fecdd3" strokeWidth={0.4} strokeDasharray="2 2" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="#fecdd3" strokeWidth={0.4} strokeDasharray="2 2" />
    </svg>
  )
}

function DrawPad({ guide }: { guide: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  // 화면 크기와 픽셀 밀도에 맞게 캔버스 해상도를 맞춘다
  useEffect(() => {
    const canvas = canvasRef.current!
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      // 크기가 그대로면 그린 내용을 유지 (모바일 주소창이 숨겨질 때 등)
      if (canvas.width === Math.round(rect.width * dpr) && canvas.height === Math.round(rect.height * dpr)) return
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = rect.width / 26
      ctx.strokeStyle = '#e11d48'
      setHasInk(false)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top] as const
  }

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const [x, y] = point(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasInk(true)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const [x, y] = point(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  const onUp = () => {
    drawing.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
  }

  return (
    <>
      <div className="relative aspect-square rounded-2xl border border-slate-200 bg-white">
        <GridLines />
        <svg viewBox="0 0 109 109" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
          {guide.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#e2e8f0" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full touch-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={!hasInk}
        className="w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium disabled:opacity-40"
      >
        🧽 지우기
      </button>
    </>
  )
}
