import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RELATIVOS_SIN_EXTENSION = /^\.{1,2}\//

export function resolve(specifier, context, nextResolve) {
  if (RELATIVOS_SIN_EXTENSION.test(specifier) && !/\.[cm]?jsx?$/.test(specifier)) {
    const base = new URL(specifier, context.parentURL)
    if (existsSync(fileURLToPath(base))) return nextResolve(base.href, context)
    if (existsSync(fileURLToPath(new URL(base.href + '.js')))) {
      return nextResolve(new URL(base.href + '.js').href, context)
    }
  }
  return nextResolve(specifier, context)
}
