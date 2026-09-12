import type { BenefitMode } from './products';

const categoryEmojiMap: Record<string, string> = {
  '성인용보행기': '🚶',
  '목욕의자': '🛁',
  '안전손잡이': '🤝',
  '이동변기': '🚽',
  '미끄럼방지용품': '👣',
  '미끄럼방지양말': '🧦',
  '욕창예방방석': '🪑',
  '욕창예방매트리스': '🛏️',
  '지팡이': '🦯',
  '요실금팬티': '🩲',
  '간이변기': '🚻',
  '자세변환용구': '🛌',
  '경사로(실내용)': '♿',
  '경사로(실외용)': '♿',
  '수동휠체어': '🦽',
  '전동침대': '🛏️',
  '수동침대': '🛏️',
  '이동욕조': '🛁',
  '목욕리프트': '♿',
  '배회감지기': '📍',
  '기저귀센서': '📡',
  '구강세척기(마우스피스형)': '🪥',
};

export function getCategoryEmoji(category: string) {
  return categoryEmojiMap[category] ?? '📦';
}

export function getBenefitModeLabel(mode: BenefitMode) {
  if (mode === 'RENTAL') return '대여';
  if (mode === 'PURCHASE_OR_RENTAL') return '구입·대여';
  return '구입';
}

export function getBenefitModeEmoji(mode: BenefitMode) {
  if (mode === 'RENTAL') return '🔁';
  if (mode === 'PURCHASE_OR_RENTAL') return '↔️';
  return '🛒';
}
