import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// pdf.js parses PDFs in a Web Worker so the page stays responsive.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

const MAX_PDF_PAGES = 60
const RENDER_WIDTH = 1100   // pixels; sharp on phones, small enough to keep memory sane

// Turn a stored pattern into a list of pages the viewer can draw:
//   { kind: 'image', src }  for PDF pages (rendered to a JPEG) and images
//   { kind: 'text', text }  for plain-text patterns
export async function loadPages(pattern, url) {
  if (pattern.mime === 'text/plain') {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Could not load the pattern file')
    return [{ kind: 'text', text: await response.text() }]
  }

  if (pattern.mime.startsWith('image/')) {
    return [{ kind: 'image', src: url }]
  }

  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not load the pattern file')
  const data = new Uint8Array(await response.arrayBuffer())
  // isEvalSupported: false stops pdf.js from ever compiling code found in a
  // PDF (fonts can carry some). The file is drawn, never run.
  const pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise
  const pages = []
  const count = Math.min(pdf.numPages, MAX_PDF_PAGES)
  for (let n = 1; n <= count; n++) {
    const page = await pdf.getPage(n)
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    pages.push({ kind: 'image', src: canvas.toDataURL('image/jpeg', 0.88) })
    page.cleanup()
  }
  await pdf.destroy()
  if (pdf.numPages > MAX_PDF_PAGES) pages.truncated = pdf.numPages
  return pages
}
