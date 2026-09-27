import { useLiveQuery } from 'dexie-react-hooks'
import { Segmented } from '../components/Segmented'
import { CATEGORY_LABEL, KANA_ROWS, SCRIPT_LABEL, display, statId, type Category, type Script } from '../data/kana'
import { db, mastery, type Mastery, type Stat } from '../lib/db'
import { speak } from '../lib/speech'
import { usePersistentState } from '../lib/storage'

export const MASTERY_STYLE: Record<Mastery, string> = {
  new: 'bg-white border-slate-200',
  weak: 'bg-red-50 border-red-200',
  learning: 'bg-amber-50 border-amber-200',
  mastered: 'bg-emerald-50 border-emerald-200',
}

const CATEGORIES: Category[] = ['basic', 'dakuten', 'yoon']

export function KanaTable() {
  const [script, setScript] = usePersistentState<Script>('table.script', 'hiragana')
  const [showKo, setShowKo] = usePersistentState('table.showKo', true)
  const stats = useLiveQuery(() => db.stats.toArray(), [])
  const statMap = new Map<string, Stat>(stats?.map((s) => [s.id, s]))

  return (
    <div className="space-y-6">
      <header className="space-y-3 pt-4">
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
            <input type="checkbox" checked={showKo} onChange={(e) => setShowKo(e.target.checked)} className="size-4 accent-rose-600" />
            한글 발음 보기
          </label>
        </div>
        <p className="text-sm text-slate-500">글자를 누르면 발음을 들을 수 있어요.</p>
        <Legend />
      </header>

      {CATEGORIES.map((cat) => {
        const rows = KANA_ROWS.filter((r) => r.category === cat)
        const cols = cat === 'yoon' ? 3 : 5
        return (
          <section key={cat} className="space-y-2">
            <h2 className="font-semibold text-slate-700">{CATEGORY_LABEL[cat]}</h2>
            <div className="space-y-1.5">
              {rows.map((row) => (
                <div key={row.id} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {row.kana.map((kana, i) =>
                    kana ? (
                      <button
                        key={kana.h}
                        type="button"
                        onClick={() => speak(kana.h)}
                        className={`flex aspect-square flex-col items-center justify-center rounded-xl border transition active:scale-95 sm:aspect-[4/3] ${
                          MASTERY_STYLE[mastery(statMap.get(statId(kana, script)))]
                        }`}
                      >
                        <span className={`font-jp leading-none ${cat === 'yoon' ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>
                          {display(kana, script)}
                        </span>
                        <span className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                          {kana.romaji}
                          {showKo && <span className="text-slate-400"> · {kana.ko}</span>}
                        </span>
                      </button>
                    ) : (
                      <div key={`empty-${i}`} />
                    ),
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Legend() {
  const items: [Mastery, string][] = [
    ['new', '아직 안 풀어봄'],
    ['weak', '최근에 틀림'],
    ['learning', '학습 중'],
    ['mastered', '익힘 (연속 3회 정답)'],
  ]
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
      {items.map(([m, label]) => (
        <span key={m} className="flex items-center gap-1">
          <span className={`inline-block size-3 rounded border ${MASTERY_STYLE[m]}`} />
          {label}
        </span>
      ))}
    </div>
  )
}
