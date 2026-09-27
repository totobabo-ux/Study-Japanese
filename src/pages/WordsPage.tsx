import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Tabs } from '../components/Tabs'
import { TOPICS, WORDS, wordId, wordRomaji, type TopicId, type Word } from '../data/words'
import { isWordUnlocked, missingKana } from '../lib/cards'
import { db, mastery, type Stat } from '../lib/db'
import { navigate } from '../lib/router'
import { speak } from '../lib/speech'
import { usePersistentState, useShowRomaji } from '../lib/storage'
import { MASTERY_STYLE } from './KanaTable'
import { presetWordTopics } from './Quiz'

const TABS = [
  { id: 'list', label: '단어장' },
  { id: 'phrases', label: '기초 표현' },
]

export function WordsPage({ tab = 'list' }: { tab?: string }) {
  const stats = useLiveQuery(() => db.stats.toArray(), [])
  const statMap = useMemo(() => new Map<string, Stat>(stats?.map((s) => [s.id, s])), [stats])

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">단어</h1>
      <Tabs base="words" current={tab} tabs={TABS} />
      {tab === 'list' && <WordList statMap={statMap} />}
      {tab === 'phrases' && <Phrases statMap={statMap} />}
    </div>
  )
}

function WordList({ statMap }: { statMap: Map<string, Stat> }) {
  const [showRomaji, setShowRomaji] = useShowRomaji()
  const [topic, setTopic] = usePersistentState<TopicId | 'all'>('words.topic', 'all')
  const [unlockedOnly, setUnlockedOnly] = usePersistentState('words.unlockedOnly', false)
  const [query, setQuery] = useState('')

  const unlockedCount = WORDS.filter((w) => isWordUnlocked(w, statMap)).length
  const q = query.trim()
  const list = WORDS.filter(
    (w) =>
      (topic === 'all' || w.topic === topic) &&
      (!unlockedOnly || isWordUnlocked(w, statMap)) &&
      (!q || w.kana.includes(q) || w.kanji?.includes(q) || w.meaning.includes(q) || wordRomaji(w).replace(/[ ']/g, '').includes(q.toLowerCase().replace(/[ ']/g, ''))),
  )

  return (
    <div className="space-y-4 pt-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">🔓 해금된 단어</span>
          <span className="tabular-nums text-slate-500">
            {unlockedCount} / {WORDS.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-rose-500" style={{ width: `${(unlockedCount / WORDS.length) * 100}%` }} />
        </div>
        <p className="mt-2 text-slate-500">퀴즈에서 맞힌 글자로만 이루어진 단어가 열려요. 글자를 배울수록 단어가 늘어나요.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색 (일본어, 로마자, 뜻)"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={unlockedOnly} onChange={(e) => setUnlockedOnly(e.target.checked)} className="size-4 accent-rose-600" />
          해금된 것만
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showRomaji} onChange={(e) => setShowRomaji(e.target.checked)} className="size-4 accent-rose-600" />
          로마자
        </label>
      </div>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {[{ id: 'all' as const, label: '전체', icon: '📚' }, ...TOPICS].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTopic(t.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              topic === t.id ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{list.length}개</span>
        {list.length > 0 && (
          <button
            type="button"
            onClick={() => {
              presetWordTopics(topic === 'all' ? TOPICS.map((t) => t.id) : [topic])
              navigate('quiz/words')
            }}
            className="font-medium text-rose-600"
          >
            이 단어들로 퀴즈 →
          </button>
        )}
      </div>

      <ul className="space-y-1.5">
        {list.map((w) => (
          <WordRow key={wordId(w)} w={w} statMap={statMap} showRomaji={showRomaji} />
        ))}
      </ul>
    </div>
  )
}

function WordRow({ w, statMap, showRomaji }: { w: Word; statMap: Map<string, Stat>; showRomaji: boolean }) {
  const unlocked = isWordUnlocked(w, statMap)
  const missing = unlocked ? [] : missingKana(w, statMap)
  return (
    <li>
      <button
        type="button"
        onClick={() => speak(w.kana)}
        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${MASTERY_STYLE[mastery(statMap.get(wordId(w)))]}`}
      >
        <span className="min-w-0 flex-1">
          <span className="font-jp text-lg">{w.kana}</span>
          {w.kanji && <span className="font-jp ml-2 text-sm text-slate-400">{w.kanji}</span>}
          {showRomaji && <span className="block text-sm text-rose-400">{wordRomaji(w)}</span>}
          <span className="block text-sm text-slate-600">{w.meaning}</span>
          {w.note && <span className="block text-xs text-slate-400">{w.note}</span>}
        </span>
        {!unlocked && (
          <span className="shrink-0 text-right text-xs text-slate-400" title="아직 안 배운 글자">
            🔒 <span className="font-jp">{missing.slice(0, 4).join(' ')}</span>
            {missing.length > 4 && '…'}
          </span>
        )}
        <span className="shrink-0 text-slate-300">🔊</span>
      </button>
    </li>
  )
}

function Phrases({ statMap }: { statMap: Map<string, Stat> }) {
  const [showRomaji, setShowRomaji] = useShowRomaji()
  const phrases = WORDS.filter((w) => w.topic === 'greetings')
  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-slate-500">
        바로 써먹을 수 있는 인사말과 생활 표현이에요. 글자를 다 몰라도 소리로 먼저 익혀 두면 좋아요.
      </p>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={showRomaji} onChange={(e) => setShowRomaji(e.target.checked)} className="size-4 accent-rose-600" />
        로마자 보기
      </label>
      <button
        type="button"
        onClick={() => {
          presetWordTopics(['greetings'])
          navigate('quiz/words')
        }}
        className="w-full rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-700">
        ✏️ 인사·표현 퀴즈 풀기
      </button>
      <ul className="space-y-1.5">
        {phrases.map((w) => (
          <WordRow key={wordId(w)} w={w} statMap={statMap} showRomaji={showRomaji} />
        ))}
      </ul>
    </div>
  )
}
