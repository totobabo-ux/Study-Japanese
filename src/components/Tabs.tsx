import { navigate } from '../lib/router'

/** 페이지 상단의 하위 탭 (주소로 이동) */
export function Tabs({ base, current, tabs }: { base: string; current: string; tabs: { id: string; label: string }[] }) {
  return (
    <div className="flex gap-1 border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => navigate(`${base}/${t.id}`)}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            current === t.id ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
