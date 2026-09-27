// 모든 단어의 로마자 변환 결과 점검: 변환되지 않은 문자가 있으면 출력
import { WORDS, wordRomaji } from '../src/data/words'

const bad = WORDS.filter((w) => !/^[a-z' ]+$/.test(wordRomaji(w)))
for (const w of bad) console.log('CHECK', w.kana, '→', wordRomaji(w))
console.log(`${WORDS.length}개 중 확인 필요 ${bad.length}개`)
console.log(WORDS.filter((_, i) => i % 45 === 0).map((w) => `${w.kana}=${wordRomaji(w)}`).join('  '))
