import { timingSafeEqual } from 'node:crypto'

// HTTP Basic Authentication for the whole app.
//
// The browser sends: Authorization: Basic base64("user:password")
// We decode it, compare against two environment variables, and either let the
// request through (next) or answer 401 with a WWW-Authenticate header, which is
// what makes the browser show its built-in login box.
//
// The credentials live in APP_USER and APP_PASSWORD, set in the host's
// dashboard. They are never in the source code.

function safeEqual(a, b) {
  // timingSafeEqual needs equal-length buffers, so compare lengths first.
  // A plain === can leak how many characters matched through response timing.
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function basicAuth({ user, password }) {
  return (request, response, next) => {
    const header = request.headers.authorization || ''
    const [scheme, encoded] = header.split(' ')

    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8')
      const separator = decoded.indexOf(':')
      // Passwords can contain ':' so split only on the first one.
      const givenUser = decoded.slice(0, separator)
      const givenPassword = decoded.slice(separator + 1)

      if (separator !== -1 && safeEqual(givenUser, user) && safeEqual(givenPassword, password)) {
        return next()
      }
    }

    response.set('WWW-Authenticate', 'Basic realm="CrocheTa", charset="UTF-8"')
    response.status(401).json({ error: 'Sign in to use CrocheTa' })
  }
}
