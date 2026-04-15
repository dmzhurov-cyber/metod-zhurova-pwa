# Полный список различий: `pwa-appfinal` (legacy) ↔ `pwa-v2`

Используется для закрытия пробелов и приёмки. Спецификация `PWA-V2-MASTER-SPEC.md` задаёт намеренные отличия (Telegram, стек).

## Намеренно не переносится (по ТЗ)

| Область | Legacy | v2 |
|--------|--------|-----|
| Telegram | WebApp SDK, `tg.*`, ветки UI | Нет |
| Монолит | Один `index.html` | React, модули, роутинг |
| Старая палитра sage/bio-arch | CSS в HTML | **Submerged Precision** (токены в `index.css`) |

## Контент курса

| Элемент | Статус |
|--------|--------|
| `dayContentMap`, `reportPrompts`, `uniqueTasks`, `libraryContent` | ✅ `extract:legacy` → `courseData.js` |
| Схемы `schemes/`, иллюстрации `illustrations/` | ✅ `public/course-assets/` |
| Доп. схемы по дням 2,3,6,13 | ✅ `daySchemes.ts` |
| **День 17: теория только из PTI** (`getPelvicDay17TheoryHTML`) | ✅ переносится в `day17Pelvic.ts` + уровень из `pwa_v2_profile_initial` |
| **Иллюстрация дня** `ILL-DAY-01…30.svg` над теорией | ✅ переносится в `DayScreen` |
| Персональные подсказки `getPersonalizedHint` / `getABTheoryBlock` | Частично: PTI-баннер для дней 9,10,16,17 (как в legacy) |
| День 0, −3…−1 | ✅ стартовая диагностика + экраны intro + day-zero-info |

## Диагностики

| Тип | Legacy | v2 |
|-----|--------|-----|
| Расширенная стартовая | Свой набор в HTML | 19 вопросов без «контроль с начала курса» (`diagnostics.ts`) |
| Baseline из книги (`diagnosticTests.baseline`) | В объекте курса | Не смешан со стартовым потоком (отдельное решение продукта) |
| PTI | Модалка | `PtiWizard` → `pwa_v2_profile_initial` |
| Столпы / триггеры (книга) | Библиотека | ✅ `/app/tests/pillars`, `/tests/triggers` |
| Контрольные 7,14,21,30 | Встроенные блоки + дни | ✅ `/app/checkpoint/:day` |

## Игровая логика

| Элемент | Статус |
|--------|--------|
| Уровни XP по порогам, стрик, дейлики, навыки-полосы, дерево навыков, ачивки | ✅ `gameState.ts` / `rpgConfig.ts` |
| Upsell-модалки day7/14/21/30 | Нет (монетизация не в v2 MVP) |
| Награды pop-up (`showRewardPopup`) | Упрощено: тосты + прогресс в UI |

## Инфраструктура

| Элемент | Статус |
|--------|--------|
| Service Worker / PWA | ✅ `vite-plugin-pwa` |
| Netlify Drop | ✅ `npm run pack:netlify` → `for-netlify-drop/` |
| `basename` для `/pwa-appfinal/` | ✅ `vite.config` + `BrowserRouter` |

## UX / медиа (частичный паритет)

| Элемент | Legacy | v2 |
|--------|--------|-----|
| `schemes-viewer.js` (свернуть, zoom, скачать) | Полный | Схемы в библиотеке; **скачивание SVG** на детальной странице схемы |
| Озвучка `speechSynthesis` | Было | Нет |
| Напоминания SW + heartbeat | Было | Локальные настройки в профиле; без фонового SW-таймера |
| Toast | `showToast` | ✅ лёгкий глобальный тост |

## Промпт для доводки (выполнено)

1. День 17: теория заменена на протокол по PTI (`course/day17Pelvic.ts`, уровень из `pwa_v2_profile_initial`).  
2. Иллюстрации `ILL-DAY-01…30` на экране дня (`dayIllustration.ts`).  
3. Визуал: ghost-border / blur у карточек, фокус поля отчёта (`sp-field`).  
4. Тосты: `lib/toast.ts` + `ToastHost` — день и контрольная.  
5. Схема в библиотеке: ссылка «Скачать SVG».  
6. PTI-баннер на днях 9, 10, 16, 17 при наличии уровня PTI.  
7. Сборка `npm run build`, пакет Netlify Drop: `npm run pack:netlify` → `for-netlify-drop/`.
