import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { CARD_BY_ID, type StudyCard } from '../lib/cards'
import { db } from '../lib/db'
import { navigate } from '../lib/router'
import type { SessionConfig } from '../lib/session'

/** 한 번에 복습할 최대 개수 */
const BATCH = 30

function formatWhen(ms: number): string {
  const diff = ms - Date.now()
  const min = Math.round(diff / 60000)
  if (min < 60) return `${Math.max(1, min)}분 후`
  const hour = Math.round(min / 60)
  if (hour < 24) return `${hour}시간 후`
  return `${Math.round(hour / 24)}일 후`
}

export function Review() {
  const [config, setConfig] = useState<SessionConfig | null>(null)
  const data = useLiveQuery(async () => {
    const now = Date.now()
    const due = await db.stats.where('due').belowOrEqual(now).sortBy('due')
    const next = await db.stats.where('due').above(now).first()
    const total = await db.stats.where('due').above(0).count()
    return { due, nextDue: next?.due, total }
  }, [config])

  if (config) return <QuizRunner config={config} onExit={() => setConfig(null)} />
  if (!data) return null

  const cards = data.due.map((s) => CARD_BY_ID.get(s.id)).filter((c): c is StudyCard => !!c)
  const kanaCount = cards.filter((c) => c.kind === 'kana').length
  const wordCount = cards.length - kanaCount

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">복습</h1>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="text-sm text-slate-500">지금 복습할 항목</div>
        <div className="mt-1 text-6xl font-bold tabular-nums text-rose-600">{cards.length}</div>
        {cards.length > 0 && (
          <div className="mt-2 text-sm text-slate-500">
            문자 {kanaCount}개 · 단어 {wordCount}개
          </div>
        )}
      </div>

      {cards.length > 0 ? (
        <button
          type="button"
          onClick={() => setConfig({ cards: cards.slice(0, BATCH), mode: { type: 'review' } })}
          className="w-full rounded-2xl bg-rose-600 py-4 text-lg font-bold text-white shadow-sm active:scale-[0.98]"
        >
          복습 시작 {cards.length > BATCH && `(${BATCH}개씩)`}
        </button>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-800">
          {data.total === 0 ? (
            <>
              아직 복습할 기록이 없어요. 퀴즈를 풀면 복습 일정이 자동으로 만들어져요.
              <button type="button" onClick={() => navigate('quiz')} className="mt-3 block w-full rounded-xl bg-white py-2.5 font-semibold text-rose-600">
                퀴즈 풀러 가기
              </button>
            </>
          ) : (
            <>🎉 지금은 복습할 게 없어요!{data.nextDue && <> 다음 복습은 {formatWhen(data.nextDue)}예요.</>}</>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600">
        <h2 className="mb-2 font-semibold text-slate-800">🔁 간격 반복이란?</h2>
        <p>
          잊어버릴 때쯤 다시 보면 기억이 훨씬 오래가요. 맞힌 항목은 복습 간격이 점점 길어지고(1일 → 3일 → 1주 → …), 틀린 항목은 곧바로 다시 나와요.
          퀴즈와 복습에서 푼 모든 문제가 자동으로 일정에 반영돼요. (FSRS 알고리즘)
        </p>
      </section>
    </div>
  )
}
