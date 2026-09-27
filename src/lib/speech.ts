let jaVoice: SpeechSynthesisVoice | null = null

function pickVoice(): void {
  if (!('speechSynthesis' in window)) return
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').startsWith('ja'))
  // 온라인(고품질) 음성이 있으면 우선 사용
  jaVoice = voices.find((v) => !v.localService) ?? voices[0] ?? null
}

if ('speechSynthesis' in window) {
  pickVoice()
  speechSynthesis.addEventListener('voiceschanged', pickVoice)
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window
}

export function hasJapaneseVoice(): boolean {
  return jaVoice !== null
}

export function speak(text: string): void {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  if (jaVoice) u.voice = jaVoice
  u.rate = 0.85
  speechSynthesis.speak(u)
}
