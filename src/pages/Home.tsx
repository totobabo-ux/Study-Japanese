import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import type { Page } from '../App'
import { ALL_KANA, SCRIPT_LABEL, statId, type Script } from '../data/kana'
import { db, exportStats, importStats, mastery, resetStats } from '../lib/db'
import { hasJapaneseVoice, isSpeechSupported } from '../lib/speech'

const SCRIPTS: Script[] = ['hiragana', 'katakana']

export function Home({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const stats = useLiveQuery(() => db.stats.toArray(), [])
  const statMap = new Map(stats?.map((s) => [s.id, s]))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">
          <span className="font-jp text-rose-600">にほんご</span> 공부
        </h1>
        <p className="mt-1 text-sm text-slate-500">히라가나부터 차근차근 시작해요.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {SCRIPTS.map((script) => {
          const mastered = ALL_KANA.filter((k) => mastery(statMap.get(statId(k, script))) === 'mastered').length
          const pct = Math.round((mastered / ALL_KANA.length) * 100)
          return (
            <div key={script} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">{SCRIPT_LABEL[script]}</span>
                <span className="text-sm tabular-nums text-slate-500">
                  {mastered} / {ALL_KANA.length}자 익힘
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onNavigate('table')} className="rounded-2xl border border-slate-200 bg-white py-5 font-bold shadow-sm active:scale-[0.98]">
          <span className="font-jp mr-1 text-rose-600">あ</span> 문자표 보기
        </button>
        <button type="button" onClick={() => onNavigate('quiz')} className="rounded-2xl bg-rose-600 py-5 font-bold text-white shadow-sm active:scale-[0.98]">
          ✏️ 퀴즈 풀기
        </button>
      </div>

      <VoiceNotice />
      <InstallGuide />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600">
        <h2 className="mb-2 font-semibold text-slate-800">📚 추천 학습 순서</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>문자표에서 한 행(5글자)씩 소리를 들으며 익히기</li>
          <li>퀴즈 범위를 배운 행까지만 골라서 풀기</li>
          <li>모두 초록색(익힘)이 되면 다음 행 추가</li>
          <li>기본 46자 → 탁음·반탁음 → 요음 → 가타카나 순서로</li>
        </ol>
      </section>

      <Backup />
    </div>
  )
}

function VoiceNotice() {
  const [ok, setOk] = useState(true)
  useEffect(() => {
    // 음성 목록은 비동기로 로드되므로 잠시 후 확인
    const t = setTimeout(() => setOk(isSpeechSupported() && hasJapaneseVoice()), 1500)
    return () => clearTimeout(t)
  }, [])
  if (ok) return null
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      🔇 이 기기에서 일본어 음성을 찾지 못했어요. 발음이 안 나오면 기기 설정에서 일본어 음성(TTS)을 설치하거나 Chrome, Safari 같은 다른 브라우저를 써 보세요.
    </div>
  )
}

function InstallGuide() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone
  if (isStandalone) return null
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
      📱 <b>앱처럼 설치하기</b>
      <br />
      {isIOS
        ? 'Safari 하단의 공유 버튼(□↑)을 누른 뒤 "홈 화면에 추가"를 선택하세요.'
        : '브라우저 메뉴(⋮)에서 "앱 설치" 또는 "홈 화면에 추가"를 선택하세요. PC Chrome은 주소창 오른쪽의 설치 아이콘을 눌러도 돼요.'}
    </div>
  )
}

function Backup() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const onExport = async () => {
    const blob = new Blob([await exportStats()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `japanese-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMessage('백업 파일을 저장했어요.')
  }

  const onImport = async (file: File) => {
    try {
      const n = await importStats(await file.text())
      setMessage(`${n}개 기록을 불러왔어요.`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '불러오기에 실패했어요.')
    }
  }

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
      <summary className="cursor-pointer font-semibold text-slate-800">💾 학습 기록 관리</summary>
      <p className="mt-2 text-slate-500">학습 기록은 이 기기의 브라우저에만 저장돼요. 다른 기기로 옮길 때는 백업 파일을 내보낸 뒤 그 기기에서 불러오세요.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onExport} className="rounded-lg border border-slate-300 px-3 py-2">
          내보내기
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-300 px-3 py-2">
          불러오기
        </button>
        {confirmReset ? (
          <button
            type="button"
            onClick={async () => {
              await resetStats()
              setConfirmReset(false)
              setMessage('기록을 모두 지웠어요.')
            }}
            className="rounded-lg bg-red-600 px-3 py-2 text-white"
          >
            정말 지울까요? 한 번 더 누르세요
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="rounded-lg border border-red-200 px-3 py-2 text-red-600">
            초기화
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImport(f)
            e.target.value = ''
          }}
        />
      </div>
      {message && <p className="mt-2 text-emerald-700">{message}</p>}
    </details>
  )
}
