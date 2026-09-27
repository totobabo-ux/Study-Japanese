export type TopicId =
  | 'greetings'
  | 'numbers'
  | 'time'
  | 'people'
  | 'body'
  | 'food'
  | 'home'
  | 'places'
  | 'school'
  | 'nature'
  | 'colors'
  | 'verbs'
  | 'i_adj'
  | 'na_adj'
  | 'basics'
  | 'loanwords'

export interface Word {
  /** 가나 표기 (보통 히라가나, 외래어 등 가타카나로 쓰는 말은 가타카나). 공백 없음 */
  kana: string
  /** 흔히 쓰는 한자 표기. 보통 가나로만 쓰는 말이면 생략 */
  kanji?: string
  /** 로마자 독음. 생략하면 가나에서 자동 변환 (문장은 띄어쓰기를 위해 직접 적는다) */
  romaji?: string
  /** 한국어 뜻 (간결하게, 여러 뜻은 ", "로 구분) */
  meaning: string
  topic: TopicId
  /** 쓰임새 등 짧은 설명 (주로 인사·표현) */
  note?: string
}

export const TOPICS: { id: TopicId; label: string; icon: string }[] = [
  { id: 'greetings', label: '인사·표현', icon: '👋' },
  { id: 'numbers', label: '숫자·세기', icon: '🔢' },
  { id: 'time', label: '시간·날짜', icon: '📅' },
  { id: 'people', label: '가족·사람', icon: '👨‍👩‍👧' },
  { id: 'body', label: '몸·건강', icon: '🫀' },
  { id: 'food', label: '음식·음료', icon: '🍙' },
  { id: 'home', label: '집·물건', icon: '🏠' },
  { id: 'places', label: '장소·교통', icon: '🚃' },
  { id: 'school', label: '학교·일', icon: '🏫' },
  { id: 'nature', label: '자연·날씨·동물', icon: '🌸' },
  { id: 'colors', label: '색깔', icon: '🎨' },
  { id: 'verbs', label: '동사', icon: '🏃' },
  { id: 'i_adj', label: 'い형용사', icon: '✨' },
  { id: 'na_adj', label: 'な형용사', icon: '💫' },
  { id: 'basics', label: '지시어·의문사·부사', icon: '❓' },
  { id: 'loanwords', label: '외래어', icon: '☕' },
]
