import { useCallback, useEffect, useRef, useState } from 'react'
import { Segmented } from '../components/Segmented'
import {
  ALL_KANA,
  CATEGORY_LABEL,
  KANA_ROWS,
  SCRIPT_LABEL,
  display,
  kanaOfRows,
  statId,
  toKatakana,
  type Category,
  type Kana,
  type Script,
} from '../data/kana'
import { db, mastery, recordAnswer, type Mastery } from '../lib/db'
import { speak } from '../lib/speech'
import { usePersistentState } from '../lib/storage'

type Mode = 'read' | 'listen'

interface Settings {
  script: Script
  mode: Mode
  rowIds: string[]
  count: number
}

const MODE_LABEL: Record<Mode, string> = {
  read: '글자 보고 발음 고르기',
  listen: '소리 듣고 글자 고르기',
}

export function Quiz() {
  const [settings, setSettings] = usePersistentState<Settings>('quiz.settings', {
    script: 'hiragana',
    mode: 'read',
    rowIds: ['a', 'ka'],
    count: 10,
  })
  const [running, setRunning] = useState(false)

  if (running) return <QuizRun settings={settings} onExit={() => setRunning(false)} />
  return <QuizSetup settings={settings} onChange={setSettings} onStart={() => setRunning(true)} />
}

/* ---------------------------------- 설정 ---------------------------------- */

function QuizSetup({ settings, onChange, onStart }: { settings: Settings; onChange: (s: Settings) => void; onStart: () => void }) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })
  const selectedCount = kanaOfRows(settings.rowIds).length

  const toggleRow = (id: string) =>
    set('rowIds', settings.rowIds.includes(id) ? settings.rowIds.filter((r) => r !== id) : [...settings.rowIds, id])

  const toggleCategory = (cat: Category) => {
    const ids = KANA_ROWS.filter((r) => r.category === cat).map((r) => r.id)
    const allOn = ids.every((id) => settings.rowIds.includes(id))
    set('rowIds', allOn ? settings.rowIds.filter((id) => !ids.includes(id)) : [...new Set([...settings.rowIds, ...ids])])
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">퀴즈</h1>

      <Field label="문자">
        <Segmented
          value={settings.script}
          onChange={(v) => set('script', v)}
          options={[
            { value: 'hiragana', label: SCRIPT_LABEL.hiragana },
            { value: 'katakana', label: SCRIPT_LABEL.katakana },
          ]}
        />
      </Field>

      <Field label="방식">
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => set('mode', m)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                settings.mode === m ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {m === 'read' ? '👀 ' : '🔊 '}
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="문제 수">
        <Segmented
          value={String(settings.count)}
          onChange={(v) => set('count', Number(v))}
          options={[10, 20, 30].map((n) => ({ value: String(n), label: `${n}문제` }))}
        />
      </Field>

      <Field label={`범위 (${selectedCount}자 선택됨)`}>
        <div className="space-y-4">
          {(['basic', 'dakuten', 'yoon'] as Category[]).map((cat) => (
            <div key={cat} className="space-y-2">
              <button type="button" onClick={() => toggleCategory(cat)} className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">
                {CATEGORY_LABEL[cat]} · 전체 선택/해제
              </button>
              <div className="flex flex-wrap gap-1.5">
                {KANA_ROWS.filter((r) => r.category === cat).map((r) => {
                  const on = settings.rowIds.includes(r.id)
                  const label = settings.script === 'katakana' ? toKatakana(r.label) : r.label
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRow(r.id)}
                      className={`font-jp rounded-full border px-3 py-1.5 text-sm ${
                        on ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Field>

      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={onStart}
        className="w-full rounded-2xl bg-rose-600 py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.98] disabled:bg-slate-300"
      >
        시작하기
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      {children}
    </div>
  )
}

/* ---------------------------------- 진행 ---------------------------------- */

/** を와 お는 소리가 같으므로 보기에 함께 나오지 않게 한다 */
const soundKey = (k: Kana) => (k.romaji === 'wo' ? 'o' : k.romaji)

const INITIAL_WEIGHT: Record<Mastery, number> = { new: 3, weak: 4, learning: 2, mastered: 1 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickWeighted(pool: Kana[], weights: Map<string, number>, exclude?: Kana): Kana {
  const candidates = pool.length > 1 && exclude ? pool.filter((k) => k !== exclude) : pool
  const total = candidates.reduce((sum, k) => sum + (weights.get(k.h) ?? 1), 0)
  let r = Math.random() * total
  for (const k of candidates) {
    r -= weights.get(k.h) ?? 1
    if (r <= 0) return k
  }
  return candidates[candidates.length - 1]
}

function makeOptions(answer: Kana, pool: Kana[]): Kana[] {
  const used = new Set([soundKey(answer)])
  const options = [answer]
  // 선택 범위에서 먼저 뽑고, 부족하면 같은 종류 전체에서 채운다
  for (const source of [shuffle(pool), shuffle(ALL_KANA.filter((k) => k.h.length === answer.h.length)), shuffle(ALL_KANA)]) {
    for (const k of source) {
      if (options.length >= 4) break
      if (!used.has(soundKey(k))) {
        used.add(soundKey(k))
        options.push(k)
      }
    }
  }
  return shuffle(options)
}

interface Question {
  answer: Kana
  options: Kana[]
}

function QuizRun({ settings, onExit }: { settings: Settings; onExit: () => void }) {
  const { script, mode, count } = settings
  const [pool] = useState(() => kanaOfRows(settings.rowIds))
  const weights = useRef(new Map<string, number>())
  const [question, setQuestion] = useState<Question | null>(null)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<Kana | null>(null)
  const [wrongList, setWrongList] = useState<Kana[]>([])
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const nextQuestion = useCallback(
    (prev?: Kana) => {
      const answer = pickWeighted(pool, weights.current, prev)
      setQuestion({ answer, options: makeOptions(answer, pool) })
      setPicked(null)
    },
    [pool],
  )

  // 저장된 학습 기록으로 출제 가중치를 정한 뒤 첫 문제 시작
  useEffect(() => {
    let cancelled = false
    db.stats.bulkGet(pool.map((k) => statId(k, script))).then((stats) => {
      if (cancelled) return
      pool.forEach((k, i) => weights.current.set(k.h, INITIAL_WEIGHT[mastery(stats[i])]))
      nextQuestion()
    })
    return () => {
      cancelled = true
    }
  }, [pool, script, nextQuestion])

  // 듣기 모드는 문제가 바뀔 때마다 자동 재생
  useEffect(() => {
    if (question && mode === 'listen') speak(question.answer.h)
  }, [question, mode])

  const advance = useCallback(() => {
    if (!question) return
    if (index + 1 >= count) {
      setDone(true)
    } else {
      setIndex((i) => i + 1)
      nextQuestion(question.answer)
    }
  }, [question, index, count, nextQuestion])

  const choose = useCallback(
    (k: Kana) => {
      if (!question || picked) return
      const ok = k === question.answer
      setPicked(k)
      speak(question.answer.h)
      recordAnswer(statId(question.answer, script), ok)
      const w = weights.current.get(question.answer.h) ?? 1
      weights.current.set(question.answer.h, ok ? Math.max(0.5, w / 2) : 4)
      if (ok) setScore((s) => s + 1)
      else setWrongList((list) => (list.includes(question.answer) ? list : [...list, question.answer]))
    },
    [question, picked, script],
  )

  // 정답이면 잠시 후 자동으로 다음 문제
  useEffect(() => {
    if (picked && question && picked === question.answer) {
      const t = setTimeout(advance, 900)
      return () => clearTimeout(t)
    }
  }, [picked, question, advance])

  // PC 키보드: 1~4 선택, Enter/Space 다음
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!question) return
      const n = Number(e.key)
      if (n >= 1 && n <= question.options.length) choose(question.options[n - 1])
      else if ((e.key === 'Enter' || e.key === ' ') && picked) {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, picked, choose, advance])

  if (done) {
    return (
      <QuizResult
        score={score}
        total={count}
        wrongList={wrongList}
        script={script}
        onRetry={() => {
          setIndex(0)
          setScore(0)
          setWrongList([])
          setDone(false)
          nextQuestion()
        }}
        onExit={onExit}
      />
    )
  }

  if (!question) return null
  const { answer, options } = question
  const isWrong = picked !== null && picked !== answer

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onExit} className="text-sm text-slate-500 hover:text-slate-700">
          ✕ 그만하기
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-rose-500 transition-all" style={{ width: `${(index / count) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-slate-500">
          {index + 1}/{count}
        </span>
      </div>

      <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-8 shadow-sm">
        {mode === 'read' ? (
          <span className="font-jp text-8xl leading-none sm:text-9xl">{display(answer, script)}</span>
        ) : (
          <button type="button" onClick={() => speak(answer.h)} className="flex flex-col items-center gap-2 text-slate-500">
            <span className="flex size-24 items-center justify-center rounded-full bg-rose-100 text-5xl">🔊</span>
            <span className="text-sm">눌러서 다시 듣기</span>
          </button>
        )}
        <div className="mt-4 h-6 text-lg text-slate-500">
          {picked &&
            (mode === 'read' ? (
              <span>
                {answer.romaji} · {answer.ko}
              </span>
            ) : (
              <span>
                <span className="font-jp">{display(answer, script)}</span> · {answer.romaji} · {answer.ko}
              </span>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((k, i) => {
          let style = 'border-slate-200 bg-white hover:border-rose-300'
          if (picked) {
            if (k === answer) style = 'border-emerald-400 bg-emerald-50 text-emerald-700'
            else if (k === picked) style = 'border-red-400 bg-red-50 text-red-700'
            else style = 'border-slate-200 bg-white opacity-50'
          }
          return (
            <button
              key={k.h}
              type="button"
              onClick={() => choose(k)}
              disabled={picked !== null}
              className={`relative flex min-h-20 flex-col items-center justify-center rounded-2xl border-2 p-3 transition active:scale-95 ${style}`}
            >
              <span className="absolute left-2.5 top-1.5 hidden text-xs text-slate-300 sm:block">{i + 1}</span>
              {mode === 'read' ? (
                <>
                  <span className="text-2xl font-semibold">{k.romaji}</span>
                  <span className="text-sm text-slate-400">{k.ko}</span>
                </>
              ) : (
                <span className="font-jp text-4xl">{display(k, script)}</span>
              )}
            </button>
          )
        })}
      </div>

      {isWrong && (
        <button type="button" onClick={advance} className="w-full rounded-2xl bg-slate-800 py-4 text-lg font-bold text-white active:scale-[0.98]">
          다음 <span className="hidden text-sm font-normal text-slate-400 sm:inline">(Enter)</span>
        </button>
      )}
    </div>
  )
}

/* ---------------------------------- 결과 ---------------------------------- */

function QuizResult(props: { score: number; total: number; wrongList: Kana[]; script: Script; onRetry: () => void; onExit: () => void }) {
  const { score, total, wrongList, script, onRetry, onExit } = props
  const pct = Math.round((score / total) * 100)
  const message = pct === 100 ? '완벽해요! 🎉' : pct >= 80 ? '아주 잘했어요! 👏' : pct >= 50 ? '좋아요, 조금만 더! 💪' : '반복하면 금방 늘어요 🌱'

  return (
    <div className="space-y-6 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-5xl font-bold text-rose-600 tabular-nums">
          {score}
          <span className="text-2xl text-slate-400"> / {total}</span>
        </div>
        <div className="mt-2 text-lg">{message}</div>
      </div>

      {wrongList.length > 0 && (
        <div className="space-y-2 text-left">
          <h2 className="font-semibold text-slate-700">틀린 글자 (눌러서 발음 듣기)</h2>
          <div className="flex flex-wrap gap-2">
            {wrongList.map((k) => (
              <button
                key={k.h}
                type="button"
                onClick={() => speak(k.h)}
                className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-4 py-2"
              >
                <span className="font-jp text-3xl">{display(k, script)}</span>
                <span className="text-xs text-slate-500">
                  {k.romaji} · {k.ko}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onExit} className="rounded-2xl border border-slate-300 bg-white py-4 font-bold text-slate-700">
          설정으로
        </button>
        <button type="button" onClick={onRetry} className="rounded-2xl bg-rose-600 py-4 font-bold text-white">
          다시 하기
        </button>
      </div>
    </div>
  )
}
