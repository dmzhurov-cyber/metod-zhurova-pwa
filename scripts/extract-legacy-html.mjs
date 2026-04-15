/**
 * Извлекает объекты из pwa-appfinal/index.html в ESM-модуль (без выполнения).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const legacyHtml = path.join(__dirname, '../../pwa-appfinal/index.html')
const outFile = path.join(__dirname, '../src/course/legacy/courseData.js')

const lines = fs.readFileSync(legacyHtml, 'utf8').split(/\r?\n/)

function sliceLines(start, endInclusive) {
  return lines.slice(start - 1, endInclusive).join('\n')
}

// Номера строк — по текущему index.html в репозитории
const dayContentMap = sliceLines(4897, 6275)
const reportPrompts = sliceLines(6277, 6308)
const uniqueTasks = sliceLines(6344, 6805)
const libraryContent = sliceLines(11253, 11827)

const banner = `// Автогенерация: npm run extract:legacy — не править вручную
`

const body = `${banner}
${dayContentMap.replace('const dayContentMap', 'export const dayContentMap')}

${reportPrompts.replace('const reportPrompts', 'export const reportPrompts')}

${uniqueTasks.replace('const uniqueTasks', 'export const uniqueTasks')}

${libraryContent.replace('const libraryContent', 'export const libraryContent')}
`

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, body, 'utf8')
console.log('Wrote', outFile, 'bytes', Buffer.byteLength(body))
