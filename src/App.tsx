import { useState } from 'react'
import { Home } from './pages/Home'
import { KanaTable } from './pages/KanaTable'
import { Quiz } from './pages/Quiz'

export type Page = 'home' | 'table' | 'quiz'

const NAV: { page: Page; label: string; icon: string }[] = [
  { page: 'home', label: '홈', icon: '🏠' },
  { page: 'table', label: '문자표', icon: 'あ' },
  { page: 'quiz', label: '퀴즈', icon: '✏️' },
]

export default function App() {
  const [page, setPage] = useState<Page>('home')

  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <main className="mx-auto max-w-2xl px-4 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        {page === 'home' && <Home onNavigate={setPage} />}
        {page === 'table' && <KanaTable />}
        {page === 'quiz' && <Quiz />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {NAV.map((n) => (
            <button
              key={n.page}
              type="button"
              onClick={() => setPage(n.page)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                page === n.page ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              <span className="font-jp text-xl leading-none">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
