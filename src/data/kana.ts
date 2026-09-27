export type Script = 'hiragana' | 'katakana'
export type Category = 'basic' | 'dakuten' | 'yoon'

export interface Kana {
  /** 히라가나 표기. 가타카나는 toKatakana()로 변환해서 사용 */
  h: string
  romaji: string
  /** 한글 발음 표기 */
  ko: string
}

export interface KanaRow {
  id: string
  label: string
  category: Category
  /** 표에서 빈 칸은 null */
  kana: (Kana | null)[]
}

const k = (h: string, romaji: string, ko: string): Kana => ({ h, romaji, ko })

export const KANA_ROWS: KanaRow[] = [
  // 기본 (청음)
  { id: 'a', label: 'あ행', category: 'basic', kana: [k('あ', 'a', '아'), k('い', 'i', '이'), k('う', 'u', '우'), k('え', 'e', '에'), k('お', 'o', '오')] },
  { id: 'ka', label: 'か행', category: 'basic', kana: [k('か', 'ka', '카'), k('き', 'ki', '키'), k('く', 'ku', '쿠'), k('け', 'ke', '케'), k('こ', 'ko', '코')] },
  { id: 'sa', label: 'さ행', category: 'basic', kana: [k('さ', 'sa', '사'), k('し', 'shi', '시'), k('す', 'su', '스'), k('せ', 'se', '세'), k('そ', 'so', '소')] },
  { id: 'ta', label: 'た행', category: 'basic', kana: [k('た', 'ta', '타'), k('ち', 'chi', '치'), k('つ', 'tsu', '츠'), k('て', 'te', '테'), k('と', 'to', '토')] },
  { id: 'na', label: 'な행', category: 'basic', kana: [k('な', 'na', '나'), k('に', 'ni', '니'), k('ぬ', 'nu', '누'), k('ね', 'ne', '네'), k('の', 'no', '노')] },
  { id: 'ha', label: 'は행', category: 'basic', kana: [k('は', 'ha', '하'), k('ひ', 'hi', '히'), k('ふ', 'fu', '후'), k('へ', 'he', '헤'), k('ほ', 'ho', '호')] },
  { id: 'ma', label: 'ま행', category: 'basic', kana: [k('ま', 'ma', '마'), k('み', 'mi', '미'), k('む', 'mu', '무'), k('め', 'me', '메'), k('も', 'mo', '모')] },
  { id: 'ya', label: 'や행', category: 'basic', kana: [k('や', 'ya', '야'), null, k('ゆ', 'yu', '유'), null, k('よ', 'yo', '요')] },
  { id: 'ra', label: 'ら행', category: 'basic', kana: [k('ら', 'ra', '라'), k('り', 'ri', '리'), k('る', 'ru', '루'), k('れ', 're', '레'), k('ろ', 'ro', '로')] },
  { id: 'wa', label: 'わ행', category: 'basic', kana: [k('わ', 'wa', '와'), null, null, null, k('を', 'wo', '오')] },
  { id: 'n', label: 'ん', category: 'basic', kana: [k('ん', 'n', '응'), null, null, null, null] },

  // 탁음 · 반탁음
  { id: 'ga', label: 'が행', category: 'dakuten', kana: [k('が', 'ga', '가'), k('ぎ', 'gi', '기'), k('ぐ', 'gu', '구'), k('げ', 'ge', '게'), k('ご', 'go', '고')] },
  { id: 'za', label: 'ざ행', category: 'dakuten', kana: [k('ざ', 'za', '자'), k('じ', 'ji', '지'), k('ず', 'zu', '즈'), k('ぜ', 'ze', '제'), k('ぞ', 'zo', '조')] },
  { id: 'da', label: 'だ행', category: 'dakuten', kana: [k('だ', 'da', '다'), k('ぢ', 'ji', '지'), k('づ', 'zu', '즈'), k('で', 'de', '데'), k('ど', 'do', '도')] },
  { id: 'ba', label: 'ば행', category: 'dakuten', kana: [k('ば', 'ba', '바'), k('び', 'bi', '비'), k('ぶ', 'bu', '부'), k('べ', 'be', '베'), k('ぼ', 'bo', '보')] },
  { id: 'pa', label: 'ぱ행', category: 'dakuten', kana: [k('ぱ', 'pa', '파'), k('ぴ', 'pi', '피'), k('ぷ', 'pu', '푸'), k('ぺ', 'pe', '페'), k('ぽ', 'po', '포')] },

  // 요음
  { id: 'kya', label: 'きゃ', category: 'yoon', kana: [k('きゃ', 'kya', '캬'), k('きゅ', 'kyu', '큐'), k('きょ', 'kyo', '쿄')] },
  { id: 'sha', label: 'しゃ', category: 'yoon', kana: [k('しゃ', 'sha', '샤'), k('しゅ', 'shu', '슈'), k('しょ', 'sho', '쇼')] },
  { id: 'cha', label: 'ちゃ', category: 'yoon', kana: [k('ちゃ', 'cha', '차'), k('ちゅ', 'chu', '추'), k('ちょ', 'cho', '초')] },
  { id: 'nya', label: 'にゃ', category: 'yoon', kana: [k('にゃ', 'nya', '냐'), k('にゅ', 'nyu', '뉴'), k('にょ', 'nyo', '뇨')] },
  { id: 'hya', label: 'ひゃ', category: 'yoon', kana: [k('ひゃ', 'hya', '햐'), k('ひゅ', 'hyu', '휴'), k('ひょ', 'hyo', '효')] },
  { id: 'mya', label: 'みゃ', category: 'yoon', kana: [k('みゃ', 'mya', '먀'), k('みゅ', 'myu', '뮤'), k('みょ', 'myo', '묘')] },
  { id: 'rya', label: 'りゃ', category: 'yoon', kana: [k('りゃ', 'rya', '랴'), k('りゅ', 'ryu', '류'), k('りょ', 'ryo', '료')] },
  { id: 'gya', label: 'ぎゃ', category: 'yoon', kana: [k('ぎゃ', 'gya', '갸'), k('ぎゅ', 'gyu', '규'), k('ぎょ', 'gyo', '교')] },
  { id: 'ja', label: 'じゃ', category: 'yoon', kana: [k('じゃ', 'ja', '자'), k('じゅ', 'ju', '주'), k('じょ', 'jo', '조')] },
  { id: 'bya', label: 'びゃ', category: 'yoon', kana: [k('びゃ', 'bya', '뱌'), k('びゅ', 'byu', '뷰'), k('びょ', 'byo', '뵤')] },
  { id: 'pya', label: 'ぴゃ', category: 'yoon', kana: [k('ぴゃ', 'pya', '퍄'), k('ぴゅ', 'pyu', '퓨'), k('ぴょ', 'pyo', '표')] },
]

export const CATEGORY_LABEL: Record<Category, string> = {
  basic: '기본 (청음)',
  dakuten: '탁음 · 반탁음',
  yoon: '요음',
}

export const SCRIPT_LABEL: Record<Script, string> = {
  hiragana: '히라가나',
  katakana: '가타카나',
}

/** 히라가나 → 가타카나 (유니코드상 0x60 차이) */
export function toKatakana(s: string): string {
  return s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
}

export function display(kana: Kana, script: Script): string {
  return script === 'katakana' ? toKatakana(kana.h) : kana.h
}

/** 학습 기록 키. 문자 종류별로 따로 기록 */
export function statId(kana: Kana, script: Script): string {
  return `${script}:${kana.h}`
}

export function kanaOfRows(rowIds: string[]): Kana[] {
  return KANA_ROWS.filter((r) => rowIds.includes(r.id)).flatMap((r) => r.kana.filter((x): x is Kana => x !== null))
}

export const ALL_KANA: Kana[] = kanaOfRows(KANA_ROWS.map((r) => r.id))

export function toHiragana(s: string): string {
  return s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

/** 모양이 비슷해서 헷갈리기 쉬운 글자 묶음 */
export const CONFUSABLES: Record<Script, string[][]> = {
  hiragana: [
    ['さ', 'ち'],
    ['き', 'さ'],
    ['ぬ', 'め', 'あ', 'お'],
    ['ね', 'れ', 'わ'],
    ['は', 'ほ', 'け'],
    ['る', 'ろ'],
    ['い', 'り', 'こ'],
    ['に', 'た', 'こ'],
    ['う', 'つ', 'ら'],
    ['ま', 'も', 'よ'],
    ['く', 'へ', 'し'],
    ['す', 'む'],
  ],
  katakana: [
    ['シ', 'ツ'],
    ['ソ', 'ン', 'リ'],
    ['ク', 'ケ', 'タ'],
    ['ス', 'ヌ', 'ホ'],
    ['コ', 'ユ', 'ロ'],
    ['ウ', 'ワ', 'フ', 'ラ'],
    ['チ', 'テ'],
    ['ア', 'マ', 'ヤ'],
    ['ノ', 'メ', 'ナ'],
    ['ル', 'レ'],
    ['ヲ', 'ラ'],
    ['カ', 'ヤ', 'セ'],
    ['キ', 'サ', 'モ'],
  ],
}

const KANA_BY_H = new Map(ALL_KANA.map((k) => [k.h, k]))

export function kanaByChar(ch: string): Kana | undefined {
  return KANA_BY_H.get(toHiragana(ch))
}

/** 작은 글자·장음 기호 등을 학습 단위 글자로 바꾼다. 가나가 아니면 null */
const SMALL_TO_BASE: Record<string, string> = { ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お', っ: 'つ', ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', ゎ: 'わ', ゔ: 'う' }

export function baseKanaOf(ch: string): { kana: Kana; script: Script } | null {
  const isKata = /[\u30a1-\u30f6]/.test(ch)
  const h = toHiragana(ch)
  const kana = KANA_BY_H.get(SMALL_TO_BASE[h] ?? h)
  return kana ? { kana, script: isKata ? 'katakana' : 'hiragana' } : null
}
