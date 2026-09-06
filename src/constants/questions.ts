import type { AnswerKey } from '../types'

export const QUESTIONS: Array<{ key: AnswerKey; label: string; placeholder: string }> = [
  {
    key: 'worshipSongs',
    label: 'Які пісні сьогодні були на прославленні?',
    placeholder: 'Напиши назви пісень або кілька слів, які памʼятаєш',
  },
  {
    key: 'biblePassage',
    label: 'Місце з Біблії',
    placeholder: 'Наприклад: Івана 3:16 або Матвія 5',
  },
  {
    key: 'sermonTheme',
    label: 'Головна думка / тема проповіді',
    placeholder: 'Про що була сьогоднішня проповідь?',
  },
  {
    key: 'personalInsight',
    label: 'Яка думка запамʼяталась тобі по-особливому?',
    placeholder: 'Напиши своє особисте відкриття',
  },
  {
    key: 'actionStep',
    label: 'Що я зроблю після цієї проповіді?',
    placeholder: 'Одна практична дія на цей тиждень',
  },
]

export const EMPTY_ANSWERS = Object.fromEntries(QUESTIONS.map((question) => [question.key, ''])) as Record<AnswerKey, string>
