import { toHiragana } from '../data/kana'

/** 가나 → 로마자 (헵번식). 장음은 모음을 겹쳐 쓴다 (コーヒー → koohii) */
const DIGRAPHS: Record<string, string> = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo', しゃ: 'sha', しゅ: 'shu', しょ: 'sho', しぇ: 'she',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho', ちぇ: 'che', にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo', みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo', ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo', じぇ: 'je', ぢゃ: 'ja', ぢゅ: 'ju', ぢょ: 'jo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo', ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  // 외래어 표기용
  てぃ: 'ti', でぃ: 'di', でゅ: 'dyu', とぅ: 'tu', どぅ: 'du', ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
  うぃ: 'wi', うぇ: 'we', うぉ: 'wo', つぁ: 'tsa', ゔぁ: 'va', ゔぃ: 'vi', ゔぇ: 've', ゔぉ: 'vo',
}

const MONO: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o', か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no', は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo', や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro', わ: 'wa', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do', ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po', ゔ: 'vu',
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', ゃ: 'ya', ゅ: 'yu', ょ: 'yo', ゎ: 'wa',
}

/**
 * @param particles true면 띄어 쓴 어절 끝의 は·へ를 조사로 보고 wa·e로 읽는다
 */
export function toRomaji(text: string, particles = false): string {
  const src = toHiragana(text)
  const out: string[] = []
  let double = false
  let afterN = false

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    const pair = src.slice(i, i + 2)

    if (ch === 'っ') {
      double = true
      continue
    }
    if (ch === 'ー') {
      // 장음: 앞 모음을 한 번 더
      const prev = out.join('').match(/[aiueo](?=[^aiueo]*$)/)
      if (prev) out.push(prev[0])
      continue
    }

    let syl: string | undefined
    if (DIGRAPHS[pair]) {
      syl = DIGRAPHS[pair]
      i++
    } else if (particles && (ch === 'は' || ch === 'へ') && (i + 1 === src.length || src[i + 1] === ' ')) {
      syl = ch === 'は' ? 'wa' : 'e'
    } else {
      syl = MONO[ch]
    }

    if (syl === undefined) {
      out.push(ch) // 공백, 기호 등은 그대로
      double = false
      afterN = false
      continue
    }
    if (double) {
      // 촉음: 다음 자음을 겹친다 (ち 계열은 t를 붙임)
      syl = (syl.startsWith('ch') ? 't' : syl[0]) + syl
      double = false
    }
    // ん 뒤에 모음·y가 오면 구분 기호 (きんえん → kin'en)
    if (afterN && /^[aiueoy]/.test(syl)) syl = `'${syl}`
    afterN = ch === 'ん'
    out.push(syl)
  }
  return out.join('')
}
