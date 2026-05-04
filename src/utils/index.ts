export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${formatDate(date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export function getReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = content.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(chineseChars / 400 + englishWords / 200));
}
export function getWordCount(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = content.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(Boolean).length;
  return chineseChars + englishWords;
}
export function sortByDate(a: { date: Date }, b: { date: Date }): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}
export function getYear(date: Date | string): string {
  return String(new Date(date).getFullYear());
}
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '');
}
