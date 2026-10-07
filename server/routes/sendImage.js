// One place that sends a stored picture, so posts and comments serve it the
// same safe way. The type was decided from the file's own bytes when it was
// saved; nosniff stops the browser guessing another one, and the sandbox CSP
// means the file cannot run scripts even if someone opens it on its own.
export function sendImage(res, file) {
  res.set({
    'Content-Type': file.mime,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': 'sandbox',
    'Cache-Control': 'private, max-age=31536000, immutable',   // a post's picture never changes
  })
  res.send(file.data)
}
