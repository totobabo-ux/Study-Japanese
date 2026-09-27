import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './lib/db'
import { navigate, useRoute } from './lib/router'
import { Home } from './pages/Home'
import { KanaPage } from './pages/KanaPage'
import { Quiz } from './pages/Quiz'
import { Review } from './pages/Review'
import { WordsPage } from './pages/WordsPage'

const NAV: { page: string; label: string; icon: string }[] = [
  { page: 'home', label: '홈', icon: '🏠' },
  { page: 'kana', label: '문자', icon: 'あ' },
  { page: 'words', label: '단어', icon: '📖' },
  { page: 'quiz', label: '퀴즈', icon: '✏️' },
  { page: 'review', label: '복습', icon: '🔁' },
]

export default function App() {
  const [page = 'home', sub] = useRoute()
  const dueCount = useLiveQuery(() => db.stats.where('due').belowOrEqual(Date.now()).count(), [page]) ?? 0

  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <main className="mx-auto max-w-2xl px-4 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        {page === 'home' && <Home dueCount={dueCount} />}
        {page === 'kana' && <KanaPage tab={sub} />}
        {page === 'words' && <WordsPage tab={sub} />}
        {page === 'quiz' && <Quiz key={sub} tab={sub} />}
        {page === 'review' && <Review />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {NAV.map((n) => (
            <button
              key={n.page}
              type="button"
              onClick={() => navigate(n.page)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                page === n.page ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              <span className="font-jp text-xl leading-none">{n.icon}</span>
              {n.label}
              {n.page === 'review' && dueCount > 0 && (
                <span className="absolute right-[calc(50%-1.6rem)] top-1 min-w-5 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-5 text-white">
                  {dueCount > 99 ? '99+' : dueCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
