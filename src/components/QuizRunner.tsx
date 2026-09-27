import { useCallback, useEffect, useState } from 'react'
import type { Face, StudyCard } from '../lib/cards'
import { db, recordAnswer, type Stat } from '../lib/db'
import { Session, choiceFace, type Question, type SessionConfig } from '../lib/session'
import { speak } from '../lib/speech'
import { useShowRomaji } from '../lib/storage'

/** 글자 수에 따라 크기를 줄인다 */
function textSize(face: Face, big: boolean): string {
  const len = face.text.length
  if (big) {
    if (!face.jp) return len > 12 ? 'text-2xl' : len > 6 ? 'text-3xl' : 'text-4xl'
    return len <= 1 ? 'text-8xl sm:text-9xl' : len <= 2 ? 'text-7xl' : len <= 4 ? 'text-6xl' : len <= 7 ? 'text-4xl' : 'text-2xl'
  }
  if (!face.jp) return len > 14 ? 'text-sm' : len > 8 ? 'text-base' : 'text-xl'
  return len <= 2 ? 'text-4xl' : len <= 4 ? 'text-2xl' : len <= 7 ? 'text-xl' : 'text-base'
}

function FaceView({ face, big, romaji }: { face: Face; big?: boolean; romaji?: boolean }) {
  return (
    <>
      <span className={`${face.jp ? 'font-jp' : 'font-semibold'} ${textSize(face, !!big)} ${face.jp ? 'break-all' : 'break-keep'} text-center leading-tight`}>{face.text}</span>
      {romaji && face.romaji && <span className={`${big ? 'mt-2 text-lg' : 'text-xs'} text-rose-400`}>{face.romaji}</span>}
      {face.sub && <span className={`${face.jp ? 'font-jp' : ''} ${big ? 'mt-1 text-xl' : 'text-sm'} text-slate-400`}>{face.sub}</span>}
    </>
  )
}

function revealText(card: StudyCard): string {
  return [card.front.text, card.front.romaji, card.front.sub, card.back.text, card.back.sub].filter(Boolean).join(' · ')
}

export function QuizRunner({ config, onExit }: { config: SessionConfig; onExit: () => void }) {
  const [session, setSession] = useState<Session | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [picked, setPicked] = useState<StudyCard | null>(null)
  const [done, setDone] = useState(false)
  const [showRomaji, setShowRomaji] = useShowRomaji()

  const start = useCallback(async () => {
    const stats = await db.stats.bulkGet(config.cards.map((c) => c.id))
    const s = new Session(config, new Map(stats.filter((x): x is Stat => !!x).map((x) => [x.id, x])))
    setSession(s)
    setQuestion(s.next())
    setPicked(null)
    setDone(false)
  }, [config])

  useEffect(() => {
    start()
  }, [start])

  // 듣기 문제는 바뀔 때마다 자동 재생
  useEffect(() => {
    if (question && (question.direction === 'lf' || question.direction === 'lb')) speak(question.card.speak)
  }, [question])

  const advance = useCallback(() => {
    if (!session) return
    const q = session.next()
    if (q) {
      setQuestion(q)
      setPicked(null)
    } else {
      setDone(true)
    }
  }, [session])

  const choose = useCallback(
    (c: StudyCard) => {
      if (!question || !session || picked) return
      const ok = c === question.card
      setPicked(c)
      speak(question.card.speak)
      session.answer(question.card, ok)
      recordAnswer(question.card.id, ok)
    },
    [question, session, picked],
  )

  // 정답이면 잠시 후 자동으로 다음 문제
  useEffect(() => {
    if (picked && question && picked === question.card) {
      const t = setTimeout(advance, 900)
      return () => clearTimeout(t)
    }
  }, [picked, question, advance])

  // PC 키보드: 1~4 선택, Enter/Space 다음
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!question || done) return
      const n = Number(e.key)
      if (n >= 1 && n <= question.choices.length) choose(question.choices[n - 1])
      else if ((e.key === 'Enter' || e.key === ' ') && picked) {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, picked, done, choose, advance])

  if (!session) return null
  if (done) return <QuizResult session={session} onRetry={start} onExit={onExit} />
  if (!question) return null

  const { card, direction, choices } = question
  const isWrong = picked !== null && picked !== card
  const listening = direction === 'lf' || direction === 'lb'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onExit} className="text-sm text-slate-500 hover:text-slate-700">
          ✕ 그만하기
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-rose-500 transition-all" style={{ width: `${(session.answered / session.total) * 100}%` }} />
        </div>
        <button
          type="button"
          onClick={() => setShowRomaji(!showRomaji)}
          title="로마자 독음 보기"
          className={`rounded-md border px-1.5 py-0.5 text-xs font-semibold ${showRomaji ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-400'}`}
        >
          Aa
        </button>
        <span className="text-sm tabular-nums text-slate-500">
          {Math.min(session.answered + (picked ? 0 : 1), session.total)}/{session.total}
        </span>
      </div>

      <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-8 shadow-sm">
        <div className="mb-3 text-xs font-medium text-slate-400">
          {direction === 'fb' ? (card.kind === 'kana' ? '발음을 고르세요' : '뜻을 고르세요') : direction === 'bf' ? '일본어를 고르세요' : direction === 'lf' ? '들리는 글자를 고르세요' : '들리는 말의 뜻을 고르세요'}
        </div>
        {listening ? (
          <button type="button" onClick={() => speak(card.speak)} className="flex flex-col items-center gap-2 text-slate-500">
            <span className="flex size-24 items-center justify-center rounded-full bg-rose-100 text-5xl">🔊</span>
            <span className="text-sm">눌러서 다시 듣기</span>
          </button>
        ) : (
          <div className="flex flex-col items-center">
            <FaceView face={direction === 'fb' ? card.front : card.back} big romaji={showRomaji} />
            {direction === 'fb' && card.kind === 'word' && (
              <button type="button" onClick={() => speak(card.speak)} className="mt-3 text-sm text-slate-400 hover:text-rose-500">
                🔊 듣기
              </button>
            )}
          </div>
        )}
        <div className="font-jp mt-4 min-h-6 text-center text-lg text-slate-500">{picked && revealText(card)}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {choices.map((c, i) => {
          let style = 'border-slate-200 bg-white hover:border-rose-300'
          if (picked) {
            if (c === card) style = 'border-emerald-400 bg-emerald-50 text-emerald-700'
            else if (c === picked) style = 'border-red-400 bg-red-50 text-red-700'
            else style = 'border-slate-200 bg-white opacity-50'
          }
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c)}
              disabled={picked !== null}
              className={`relative flex min-h-20 flex-col items-center justify-center rounded-2xl border-2 p-3 transition active:scale-95 ${style}`}
            >
              <span className="absolute left-2.5 top-1.5 hidden text-xs text-slate-300 sm:block">{i + 1}</span>
              <FaceView face={choiceFace(c, direction)} romaji={showRomaji} />
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

function QuizResult({ session, onRetry, onExit }: { session: Session; onRetry: () => void; onExit: () => void }) {
  const { score, answered, wrong } = session
  const pct = answered ? Math.round((score / answered) * 100) : 0
  const message = pct === 100 ? '완벽해요! 🎉' : pct >= 80 ? '아주 잘했어요! 👏' : pct >= 50 ? '좋아요, 조금만 더! 💪' : '반복하면 금방 늘어요 🌱'

  return (
    <div className="space-y-6 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-5xl font-bold text-rose-600 tabular-nums">
          {score}
          <span className="text-2xl text-slate-400"> / {answered}</span>
        </div>
        <div className="mt-2 text-lg">{message}</div>
      </div>

      {wrong.length > 0 && (
        <div className="space-y-2 text-left">
          <h2 className="font-semibold text-slate-700">틀린 문제 (눌러서 발음 듣기)</h2>
          <div className="flex flex-wrap gap-2">
            {wrong.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => speak(c.speak)}
                className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-4 py-2"
              >
                <span className="font-jp text-2xl">{c.front.text}</span>
                <span className="text-xs text-slate-500">{[c.front.romaji, c.front.sub, c.back.text, c.back.sub].filter(Boolean).join(' · ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onExit} className="rounded-2xl border border-slate-300 bg-white py-4 font-bold text-slate-700">
          돌아가기
        </button>
        <button type="button" onClick={onRetry} className="rounded-2xl bg-rose-600 py-4 font-bold text-white">
          다시 하기
        </button>
      </div>
    </div>
  )
}
