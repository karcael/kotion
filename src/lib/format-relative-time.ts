/** Turkish relative time. Falls back to an absolute date beyond ~7 days. */
export function formatRelativeTime(
  date: Date | string,
  now: Date = new Date()
): string {
  const d = typeof date === "string" ? new Date(date) : date
  const diffMs = now.getTime() - d.getTime()
  const sec = Math.floor(diffMs / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)

  if (sec < 60) return "az önce"
  if (min < 60) return `${min} dakika önce`
  if (hour < 24) return `${hour} saat önce`
  if (day === 1) return "dün"
  if (day < 7) return `${day} gün önce`
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
