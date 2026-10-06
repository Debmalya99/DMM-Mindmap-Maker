import { marked } from 'marked'
import katex from 'katex'

export function renderMarkdown(text) {
  const source = text || ''
  const processed = source
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
      } catch (e) {
        return `[Math Error: ${e.message}]`
      }
    })
    .replace(/\$([^\$]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
      } catch (e) {
        return `[Math Error: ${e.message}]`
      }
    })
  return marked.parse(processed)
}