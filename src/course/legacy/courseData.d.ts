export const dayContentMap: Record<number, { title: string; theory: string }>
export const reportPrompts: Record<number, { focus: string; placeholder: string }>
export const uniqueTasks: Record<
  number,
  { title: string; duration: string; steps: string[]; success: string }
>
export const libraryContent: {
  schemes: Array<{
    id: string
    title: string
    icon: string
    desc: string
    file: string
    theoryId: string
  }>
  theory: Array<{
    id: string
    title: string
    icon: string
    content: string
    /** Относительный путь от BASE_URL к HTML-фрагменту главы (bookv1) */
    externalHtml?: string
  }>
}
