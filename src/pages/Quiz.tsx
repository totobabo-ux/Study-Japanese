import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { QuizRunner } from '../components/QuizRunner'
import { Segmented } from '../components/Segmented'
import { Tabs } from '../components/Tabs'
import { CATEGORY_LABEL, CONFUSABLES, KANA_ROWS, SCRIPT_LABEL, kanaByChar, kanaOfRows, toKatakana, type Category, type Script } from '../data/kana'
import { TOPICS, WORDS, type TopicId } from '../data/words'
import { isWordUnlocked, kanaCard, wordCard, type Direction } from '../lib/cards'
import { db, type Stat } from '../lib/db'
import type { SessionConfig } from '../lib/session'
import { usePersistentState } from '../lib/storage'

const TABS = [
  { id: 'kana', label: '문자' },
  { id: 'similar', label: '헷갈리는 문자' },
  { id: 'words', label: '단어' },
]

const WORD_TOPICS_KEY = 'quiz.wordTopics'

/** 단어장에서 "이 단어들로 퀴즈"를 눌렀을 때 주제를 미리 골라 둔다 */
export function presetWordTopics(topics: TopicId[]): void {
  try {
    localStorage.setItem(WORD_TOPICS_KEY, JSON.stringify(topics))
  } catch {
    // 저장소를 쓸 수 없으면 기존 선택 유지
  }
}

export function Quiz({ tab = 'kana' }: { tab?: string }) {
  const [config, setConfig] = useState<SessionConfig | null>(null)

  if (config) return <QuizRunner config={config} onExit={() => setConfig(null)} />
  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">퀴즈</h1>
      <Tabs base="quiz" current={tab} tabs={TABS} />
      <div className="pt-4">
        {tab === 'kana' && <KanaSetup onStart={setConfig} />}
        {tab === 'similar' && <SimilarSetup onStart={setConfig} />}
        {tab === 'words' && <WordSetup onStart={setConfig} />}
      </div>
    </div>
  )
}

/* ------------------------------- 공통 요소 ------------------------------- */

type KanaMode = 'read' | 'listen' | 'mix'
const KANA_MODE_DIRS: Record<KanaMode, Direction[]> = { read: ['fb'], listen: ['lf'], mix: ['fb', 'lf'] }
const KANA_MODE_LABEL: Record<KanaMode, string> = { read: '👀 글자 보고 발음 고르기', listen: '🔊 소리 듣고 글자 고르기', mix: '🔀 섞어서' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      {children}
    </div>
  )
}

function OptionCards<T extends string>({ value, options, onChange }: { value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {(Object.keys(options) as T[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${
            value === m ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-600'
          }`}
        >
          {options[m]}
        </button>
      ))}
    </div>
  )
}

function ScriptPicker({ value, onChange }: { value: Script; onChange: (s: Script) => void }) {
  return (
    <Segmented
      value={value}
      onChange={onChange}
      options={[
        { value: 'hiragana', label: SCRIPT_LABEL.hiragana },
        { value: 'katakana', label: SCRIPT_LABEL.katakana },
      ]}
    />
  )
}

function CountPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <Segmented value={String(value)} onChange={(v) => onChange(Number(v))} options={[10, 20, 30].map((n) => ({ value: String(n), label: `${n}문제` }))} />
  )
}

function StartButton({ disabled, onClick, children = '시작하기' }: { disabled?: boolean; onClick: () => void; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-2xl bg-rose-600 py-4 text-lg font-bold text-white shadow-sm transition active:scale-[0.98] disabled:bg-slate-300"
    >
      {children}
    </button>
  )
}

/* --------------------------------- 문자 --------------------------------- */

interface KanaSettings {
  script: Script
  mode: KanaMode
  rowIds: string[]
  count: number
}

function KanaSetup({ onStart }: { onStart: (c: SessionConfig) => void }) {
  const [s, setS] = usePersistentState<KanaSettings>('quiz.kana', { script: 'hiragana', mode: 'read', rowIds: ['a', 'ka'], count: 10 })
  const set = <K extends keyof KanaSettings>(key: K, value: KanaSettings[K]) => setS({ ...s, [key]: value })
  const selected = kanaOfRows(s.rowIds)

  const toggleRow = (id: string) => set('rowIds', s.rowIds.includes(id) ? s.rowIds.filter((r) => r !== id) : [...s.rowIds, id])
  const toggleCategory = (cat: Category) => {
    const ids = KANA_ROWS.filter((r) => r.category === cat).map((r) => r.id)
    const allOn = ids.every((id) => s.rowIds.includes(id))
    set('rowIds', allOn ? s.rowIds.filter((id) => !ids.includes(id)) : [...new Set([...s.rowIds, ...ids])])
  }

  return (
    <div className="space-y-6">
      <Field label="문자">
        <ScriptPicker value={s.script} onChange={(v) => set('script', v)} />
      </Field>
      <Field label="방식">
        <OptionCards value={s.mode} options={KANA_MODE_LABEL} onChange={(v) => set('mode', v)} />
      </Field>
      <Field label="문제 수">
        <CountPicker value={s.count} onChange={(v) => set('count', v)} />
      </Field>
      <Field label={`범위 (${selected.length}자 선택됨)`}>
        <div className="space-y-4">
          {(['basic', 'dakuten', 'yoon'] as Category[]).map((cat) => (
            <div key={cat} className="space-y-2">
              <button type="button" onClick={() => toggleCategory(cat)} className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">
                {CATEGORY_LABEL[cat]} · 전체 선택/해제
              </button>
              <div className="flex flex-wrap gap-1.5">
                {KANA_ROWS.filter((r) => r.category === cat).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRow(r.id)}
                    className={`font-jp rounded-full border px-3 py-1.5 text-sm ${
                      s.rowIds.includes(r.id) ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {s.script === 'katakana' ? toKatakana(r.label) : r.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Field>
      <StartButton
        disabled={selected.length === 0}
        onClick={() =>
          onStart({
            cards: selected.map((k) => kanaCard(k, s.script)),
            directions: { kana: KANA_MODE_DIRS[s.mode] },
            mode: { type: 'practice', count: s.count },
          })
        }
      />
    </div>
  )
}

/* ------------------------------ 헷갈리는 문자 ------------------------------ */

function SimilarSetup({ onStart }: { onStart: (c: SessionConfig) => void }) {
  const [s, setS] = usePersistentState('quiz.similar', { script: 'hiragana' as Script, mode: 'mix' as KanaMode, count: 20 })
  const sets = CONFUSABLES[s.script]

  const start = () => {
    const kana = [...new Set(sets.flat())].map((ch) => kanaByChar(ch)).filter((k) => !!k)
    onStart({
      cards: kana.map((k) => kanaCard(k, s.script)),
      directions: { kana: KANA_MODE_DIRS[s.mode] },
      mode: { type: 'practice', count: s.count },
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">모양이 비슷한 글자를 보기로 함께 내서 차이를 확실히 구분하게 도와줘요.</p>
      <Field label="문자">
        <ScriptPicker value={s.script} onChange={(v) => setS({ ...s, script: v })} />
      </Field>
      <Field label="비슷한 글자 묶음">
        <div className="flex flex-wrap gap-2">
          {sets.map((set) => (
            <span key={set.join()} className="font-jp rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-2xl tracking-widest">
              {set.join('')}
            </span>
          ))}
        </div>
      </Field>
      <Field label="방식">
        <OptionCards value={s.mode} options={KANA_MODE_LABEL} onChange={(v) => setS({ ...s, mode: v })} />
      </Field>
      <Field label="문제 수">
        <CountPicker value={s.count} onChange={(v) => setS({ ...s, count: v })} />
      </Field>
      <StartButton onClick={start} />
    </div>
  )
}

/* --------------------------------- 단어 --------------------------------- */

type WordMode = 'meaning' | 'word' | 'listen' | 'mix'
const WORD_MODE_LABEL: Record<WordMode, string> = {
  meaning: '👀 단어 보고 뜻 고르기',
  word: '🇰🇷 뜻 보고 단어 고르기',
  listen: '🔊 듣고 뜻 고르기',
  mix: '🔀 섞어서',
}
const WORD_MODE_DIRS: Record<WordMode, Direction[]> = { meaning: ['fb'], word: ['bf'], listen: ['lb'], mix: ['fb', 'bf', 'lb'] }

function WordSetup({ onStart }: { onStart: (c: SessionConfig) => void }) {
  const [topics, setTopics] = usePersistentState<TopicId[]>(WORD_TOPICS_KEY, ['greetings', 'numbers'])
  const [s, setS] = usePersistentState('quiz.words', { mode: 'meaning' as WordMode, count: 10, unlockedOnly: true })
  const stats = useLiveQuery(() => db.stats.toArray(), [])
  const statMap = useMemo(() => new Map<string, Stat>(stats?.map((x) => [x.id, x])), [stats])

  const inTopics = WORDS.filter((w) => topics.includes(w.topic))
  const pool = s.unlockedOnly ? inTopics.filter((w) => isWordUnlocked(w, statMap)) : inTopics

  const toggleTopic = (id: TopicId) => setTopics(topics.includes(id) ? topics.filter((t) => t !== id) : [...topics, id])
  const allOn = topics.length === TOPICS.length

  return (
    <div className="space-y-6">
      <Field label="방식">
        <OptionCards value={s.mode} options={WORD_MODE_LABEL} onChange={(v) => setS({ ...s, mode: v })} />
      </Field>
      <Field label="문제 수">
        <CountPicker value={s.count} onChange={(v) => setS({ ...s, count: v })} />
      </Field>
      <Field label="주제">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setTopics(allOn ? [] : TOPICS.map((t) => t.id))}
            className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline"
          >
            전체 선택/해제
          </button>
          <div className="flex flex-wrap gap-1.5">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTopic(t.id)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  topics.includes(t.id) ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </Field>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={s.unlockedOnly}
          onChange={(e) => setS({ ...s, unlockedOnly: e.target.checked })}
          className="mt-0.5 size-4 accent-rose-600"
        />
        <span>
          해금된 단어만 (배운 글자로만 된 단어)
          <span className="block text-xs text-slate-400">
            선택한 주제 {inTopics.length}개 중 {pool.length}개 출제 가능
          </span>
        </span>
      </label>
      {pool.length === 0 && inTopics.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          아직 해금된 단어가 없어요. 문자 퀴즈로 글자를 먼저 익히거나, "해금된 단어만"을 끄고 풀어 보세요.
        </div>
      )}
      <StartButton
        disabled={pool.length === 0}
        onClick={() =>
          onStart({
            cards: pool.map(wordCard),
            directions: { word: WORD_MODE_DIRS[s.mode] },
            mode: { type: 'practice', count: s.count },
          })
        }
      />
    </div>
  )
}
