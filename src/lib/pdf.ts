export function pdfFileName(applicantName: string, date = new Date()) {
  const name = applicantName.trim() || "신청인"
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "")
  return `소명서_${name}_${ymd}.pdf`
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
