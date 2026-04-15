/** Вводные модули — введение в метод Джаана */

export const INTRO_DAYS: { id: number; slug: string; title: string; theory: string }[] = [
  {
    id: -3,
    slug: '1',
    title: 'Откуда это всё взялось',
    theory: `
      <h2>Моя история</h2>

      <!-- ВОПРОС К ДЖААНУ: Расскажи свою историю — откуда ты, как ты столкнулся с ПЭ лично,
           что пережил, что изменилось. Это вводное слово. Максимально живо, без приукрашиваний.
           Примерно 300–500 слов. Можно записать аудио — я интегрирую его сюда. -->

      <p style="padding: 16px; background: rgba(153,247,255,0.08); border-radius: 10px; border-left: 3px solid var(--sp-primary-from);">
        <em>Джаан записывает свою историю. Скоро она появится здесь.</em>
      </p>

      <h2>Почему ПЭ — это не приговор</h2>

      <!-- ВОПРОС К ДЖААНУ: Объясни своими словами: почему ПЭ — это решаемая ситуация?
           Что ты знаешь сейчас, чего не знал раньше? Без научных терминов — живым языком. -->

      <p style="padding: 16px; background: rgba(153,247,255,0.08); border-radius: 10px; border-left: 3px solid var(--sp-primary-from);">
        <em>Здесь будет объяснение от Джаана — почему это решается и как именно.</em>
      </p>

      <h2>Про этот курс</h2>
      <p>30 дней. Каждый день — одна практика. Никакой воды, только то, что работает.</p>
      <p>Ты не один с этим — до 40% мужчин сталкиваются с этим хотя бы раз. Просто большинство молчит.</p>
      <p>Ты не молчишь. Ты уже здесь.</p>

      <div style="margin-top: 20px; padding: 14px; background: rgba(153,247,255,0.12); border-radius: 10px; font-size: 0.95em;">
        <strong>Главное:</strong> читай медленно. Не торопись переходить к следующему модулю.
        Дай словам осесть.
      </div>
    `,
  },
  {
    id: -2,
    slug: '2',
    title: 'Как устроен мой метод',
    theory: `
      <h2>Не контроль — встреча</h2>

      <!-- ВОПРОС К ДЖААНУ: Объясни ключевую философию своего метода.
           В чём разница между "контролировать возбуждение" и "встречать его"?
           Как ты пришёл к этому пониманию? Что изменилось в практике, когда ты это понял?
           Примерно 300–400 слов. -->

      <p style="padding: 16px; background: rgba(153,247,255,0.08); border-radius: 10px; border-left: 3px solid var(--sp-primary-from);">
        <em>Джаан объяснит свой подход здесь. Аудио скоро.</em>
      </p>

      <h2>Три кита метода</h2>

      <!-- ВОПРОС К ДЖААНУ: Назови и объясни 2–4 главных принципа твоего метода.
           Не техники — именно принципы, подход. Как это звучит для тебя? -->

      <div style="padding: 16px; background: rgba(153,247,255,0.08); border-radius: 10px; border-left: 3px solid var(--sp-primary-from); margin-bottom: 12px;">
        <em>Здесь будут принципы метода Джаана.</em>
      </div>

      <h2>Про «стоп-старт» и что с этим не так</h2>

      <!-- ВОПРОС К ДЖААНУ: Расскажи как ты используешь технику "стоп-старт" —
           она у тебя применяется не так, как описывается классически.
           В чём разница? Как правильно? Почему классическое объяснение сбивает? -->

      <p style="padding: 16px; background: rgba(153,247,255,0.08); border-radius: 10px; border-left: 3px solid var(--sp-primary-from);">
        <em>Джаан объяснит свой подход к технике. Это важно.</em>
      </p>

      <div style="margin-top: 20px; padding: 14px; background: rgba(153,247,255,0.12); border-radius: 10px; font-size: 0.95em;">
        <strong>Запомни:</strong> метод — это не набор упражнений. Это новый способ быть в своём теле.
      </div>
    `,
  },
  {
    id: -1,
    slug: '3',
    title: 'Карта 30 дней',
    theory: `
      <!-- ВОПРОС К ДЖААНУ: Запиши короткое аудио — как ты видишь эти 30 дней.
           Не схему, а путешествие. Что происходит внутри человека на каждом этапе?
           Где обычно бывает сложно? Почему это работает? 3–5 минут. -->

      <p style="padding: 16px; background: rgba(153,247,255,0.08); border-radius: 10px; border-left: 3px solid var(--sp-primary-from);">
        <em>Джаан расскажет про эти 30 дней — здесь будет аудио.</em>
      </p>

      <div style="margin: 20px 0;">
        <div style="margin-bottom: 10px; padding: 12px 14px; background: rgba(153,247,255,0.1); border-radius: 10px;">
          <strong>Дни 1–7</strong> &nbsp;·&nbsp; <span style="opacity:0.75">Тело и дыхание</span>
        </div>
        <div style="margin-bottom: 10px; padding: 12px 14px; background: rgba(109,144,134,0.15); border-radius: 10px;">
          <strong>Дни 8–14</strong> &nbsp;·&nbsp; <span style="opacity:0.75">Триггеры и карта</span>
        </div>
        <div style="margin-bottom: 10px; padding: 12px 14px; background: rgba(157,78,221,0.15); border-radius: 10px;">
          <strong>Дни 15–21</strong> &nbsp;·&nbsp; <span style="opacity:0.75">Техники в работе</span>
        </div>
        <div style="margin-bottom: 10px; padding: 12px 14px; background: rgba(255,152,0,0.15); border-radius: 10px;">
          <strong>Дни 22–28</strong> &nbsp;·&nbsp; <span style="opacity:0.75">Реальные условия</span>
        </div>
        <div style="padding: 12px 14px; background: rgba(76,175,80,0.15); border-radius: 10px;">
          <strong>Дни 29–30</strong> &nbsp;·&nbsp; <span style="opacity:0.75">Финал и дальше</span>
        </div>
      </div>

      <p style="font-size: 0.95em; opacity: 0.8; margin: 0;">
        Перед первым днём — короткая диагностика. Это важно: результаты влияют на твой персональный протокол.
      </p>
    `,
  },
]
