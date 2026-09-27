import { useState } from 'react'
import { toRomaji } from '../lib/romaji'
import { speak } from '../lib/speech'

interface Example {
  jp: string
  ko: string
  meaning: string
  romaji: string
}

interface Lesson {
  id: string
  title: string
  body: string[]
  examples: Example[]
  /** 듣고 구분하기: 둘 중 하나를 들려주고 고르게 한다 */
  pairs?: [Example, Example][]
}

/** 문장처럼 띄어쓰기·조사 발음이 필요한 경우 romaji를 직접 준다 */
const ex = (jp: string, ko: string, meaning: string, romaji = toRomaji(jp)): Example => ({ jp, ko, meaning, romaji })

const LESSONS: Lesson[] = [
  {
    id: 'mora',
    title: '0. 박자(모라) 감각',
    body: [
      '일본어는 글자 하나가 한 박자예요. 한국어처럼 받침으로 합쳐 읽지 않고, 글자 수만큼 일정한 리듬으로 읽어요.',
      '아래 규칙들(장음·촉음·ん)도 모두 "한 박자를 차지한다"는 점이 핵심이에요.',
    ],
    examples: [ex('さくら', '사/쿠/라 (3박자)', '벚꽃'), ex('にほん', '니/호/ㅇ (3박자)', '일본'), ex('とうきょう', '토/오/쿄/오 (4박자)', '도쿄')],
  },
  {
    id: 'long',
    title: '1. 장음 — 길게 끌기',
    body: [
      '같은 모음이 이어지면 한 박자 더 길게 발음해요. 길이에 따라 뜻이 달라지니 꼭 구분하세요.',
      'え단 + い는 보통 "에-"로, お단 + う는 "오-"로 길게 읽어요. (せんせい → 센세-, がっこう → 각코-)',
      '가타카나에서는 "ー" 기호로 장음을 표시해요. (コーヒー → 코-히-)',
    ],
    examples: [ex('せんせい', '센세-', '선생님'), ex('がっこう', '각코-', '학교'), ex('コーヒー', '코-히-', '커피')],
    pairs: [
      [ex('おばさん', '오바상', '아주머니'), ex('おばあさん', '오바-상', '할머니')],
      [ex('おじさん', '오지상', '아저씨'), ex('おじいさん', '오지-상', '할아버지')],
      [ex('ゆき', '유키', '눈'), ex('ゆうき', '유-키', '용기')],
      [ex('ここ', '코코', '여기'), ex('こうこう', '코-코-', '고등학교')],
    ],
  },
  {
    id: 'sokuon',
    title: '2. 촉음 っ — 한 박자 멈추기',
    body: [
      '작은 っ(ッ)는 소리를 내지 않고 한 박자 멈추는 글자예요. 뒤 글자의 자음을 준비한 채로 잠깐 쉬어요.',
      '한국어의 받침(ㄱ, ㅅ, ㅂ)과 비슷하게 들리지만, 반드시 한 박자를 채워야 해요.',
    ],
    examples: [ex('きって', '킷테', '우표'), ex('ざっし', '잣시', '잡지'), ex('いっぱい', '입파이', '가득')],
    pairs: [
      [ex('きて', '키테', '와 (오다)'), ex('きって', '킷테', '우표')],
      [ex('おと', '오토', '소리'), ex('おっと', '옷토', '남편')],
      [ex('さか', '사카', '언덕'), ex('さっか', '삭카', '작가')],
    ],
  },
  {
    id: 'n',
    title: '3. ん — 뒤 소리에 따라 달라지는 받침',
    body: [
      'ん은 한 박자를 차지하는 받침 소리예요. 뒤에 오는 소리에 따라 ㅁ·ㄴ·ㅇ처럼 자연스럽게 바뀌어요.',
      'ま·ば·ぱ행 앞 → ㅁ (さんぽ 삼포) / た·だ·な·ら행 앞 → ㄴ (せんせい 센세-) / か·が행 앞이나 끝 → ㅇ (りんご 링고, ほん 홍)',
    ],
    examples: [ex('さんぽ', '삼포', '산책'), ex('せんせい', '센세-', '선생님'), ex('りんご', '링고', '사과'), ex('ほん', '홍', '책')],
  },
  {
    id: 'dakuten',
    title: '4. 탁음 — か와 が 구분하기',
    body: [
      '한국어에는 단어 첫소리에 오는 유성음(g, d, b)이 없어서, が·だ·ば를 か·た·は로 듣고 말하기 쉬워요.',
      'が는 목을 울리며 "가"를 부드럽게 내는 소리예요. 반대로 か는 단어 처음에선 "카"에 가깝게, 중간에선 "까"처럼 들려요.',
    ],
    examples: [ex('がくせい', '각세-', '학생'), ex('でんわ', '뎅와', '전화'), ex('ばす', '바스', '버스')],
    pairs: [
      [ex('かき', '카키', '감'), ex('かぎ', '카기', '열쇠')],
      [ex('てんき', '텡키', '날씨'), ex('でんき', '뎅키', '전기')],
      [ex('きん', '킹', '금'), ex('ぎん', '깅', '은')],
    ],
  },
  {
    id: 'youon',
    title: '5. 요음 — 작은 ゃゅょ는 한 박자',
    body: [
      'きゃ·しゅ·ちょ처럼 작은 ゃ·ゅ·ょ가 붙으면 두 글자를 합쳐 한 박자로 읽어요.',
      '큰 글자(きや)와 작은 글자(きゃ)는 박자 수와 뜻이 완전히 달라져요.',
    ],
    examples: [ex('きょう', '쿄-', '오늘'), ex('しゃしん', '샤싱', '사진'), ex('りょこう', '료코-', '여행')],
    pairs: [
      [ex('びよういん', '비요-잉', '미용실'), ex('びょういん', '뵤-잉', '병원')],
      [ex('ひやく', '히야쿠', '비약'), ex('ひゃく', '햐쿠', '백 (100)')],
      [ex('きよう', '키요-', '재주 있음'), ex('きょう', '쿄-', '오늘')],
    ],
  },
  {
    id: 'particles',
    title: '6. 조사 は·へ·を의 발음',
    body: [
      '조사로 쓰일 때만 발음이 달라져요: は → "와", へ → "에", を → "오".',
      '단어 안에서는 원래대로 읽어요. (はな 하나, へや 헤야)',
    ],
    examples: [
      ex('わたしは がくせいです', '와타시와 각세-데스', '저는 학생입니다', 'watashi wa gakusei desu'),
      ex('がっこうへ いきます', '각코-에 이키마스', '학교에 갑니다', 'gakkou e ikimasu'),
      ex('みずを のみます', '미즈오 노미마스', '물을 마십니다', 'mizu o nomimasu'),
      ex('こんにちは', '콘니치와', '안녕하세요 (낮 인사)', 'konnichiwa'),
    ],
  },
]

export function Rules() {
  const [open, setOpen] = useState<string>('mora')
  return (
    <div className="space-y-3 pt-4">
      <p className="text-sm text-slate-500">한국어 화자가 특히 헷갈리는 발음 규칙이에요. 🔊를 눌러 소리를 들어 보세요.</p>
      {LESSONS.map((l) => (
        <section key={l.id} className="rounded-2xl border border-slate-200 bg-white">
          <button type="button" onClick={() => setOpen(open === l.id ? '' : l.id)} className="flex w-full items-center justify-between p-4 text-left font-semibold">
            {l.title}
            <span className="text-slate-400">{open === l.id ? '▲' : '▼'}</span>
          </button>
          {open === l.id && (
            <div className="space-y-4 px-4 pb-4">
              <div className="space-y-2 text-sm leading-relaxed text-slate-600">
                {l.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {l.examples.map((e) => (
                  <ExampleButton key={e.jp} e={e} />
                ))}
              </div>
              {l.pairs && <PairQuiz pairs={l.pairs} />}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

function ExampleButton({ e }: { e: Example }) {
  return (
    <button type="button" onClick={() => speak(e.jp)} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-left hover:bg-rose-50">
      <span className="text-lg">🔊</span>
      <span>
        <span className="font-jp block text-lg">{e.jp}</span>
        <span className="block text-sm text-rose-400">{e.romaji}</span>
        <span className="text-xs text-slate-500">
          {e.ko} · {e.meaning}
        </span>
      </span>
    </button>
  )
}

function PairQuiz({ pairs }: { pairs: [Example, Example][] }) {
  const [q, setQ] = useState<{ pair: [Example, Example]; answer: Example } | null>(null)
  const [picked, setPicked] = useState<Example | null>(null)
  const [score, setScore] = useState({ ok: 0, total: 0 })

  const next = () => {
    const pair = pairs[Math.floor(Math.random() * pairs.length)]
    const answer = pair[Math.floor(Math.random() * 2)]
    setQ({ pair, answer })
    setPicked(null)
    speak(answer.jp)
  }

  const choose = (e: Example) => {
    if (!q || picked) return
    setPicked(e)
    setScore((s) => ({ ok: s.ok + (e === q.answer ? 1 : 0), total: s.total + 1 }))
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-rose-700">🎧 듣고 구분하기</span>
        {score.total > 0 && (
          <span className="tabular-nums text-slate-500">
            {score.ok} / {score.total}
          </span>
        )}
      </div>
      {!q ? (
        <button type="button" onClick={next} className="w-full rounded-lg bg-rose-600 py-2.5 font-semibold text-white">
          시작하기
        </button>
      ) : (
        <div className="space-y-2">
          <button type="button" onClick={() => speak(q.answer.jp)} className="w-full rounded-lg bg-white py-2 text-sm text-slate-600">
            🔊 다시 듣기
          </button>
          <div className="grid grid-cols-2 gap-2">
            {q.pair.map((e) => {
              let style = 'border-slate-200 bg-white'
              if (picked) {
                if (e === q.answer) style = 'border-emerald-400 bg-emerald-50'
                else if (e === picked) style = 'border-red-400 bg-red-50'
              }
              return (
                <button key={e.jp} type="button" onClick={() => choose(e)} className={`rounded-lg border-2 p-2 ${style}`}>
                  <span className="font-jp block text-lg">{e.jp}</span>
                  <span className="block text-xs text-rose-400">{e.romaji}</span>
                  <span className="text-xs text-slate-500">
                    {e.ko} · {e.meaning}
                  </span>
                </button>
              )
            })}
          </div>
          {picked && (
            <button type="button" onClick={next} className="w-full rounded-lg bg-slate-800 py-2.5 font-semibold text-white">
              다음 문제
            </button>
          )}
        </div>
      )}
    </div>
  )
}
