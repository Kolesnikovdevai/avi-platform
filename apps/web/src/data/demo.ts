/** Synthetic, presentation-only fixture. No Avito contract or client-side CPL calculation. */
export const demo = {
  organization_id: "00000000-0000-4000-8000-000000000001",
  provenance: "synthetic-design-fixture-v1",
  isDemo: true,
  periods: {
    week: {
      label: "26 окт — 1 ноя 2026",
      short: "Последние 7 дней",
      spend: "12 000 ₽",
      leads: "40",
      cpl: "300 ₽",
      axis: ["26 окт", "27 окт", "28 окт", "29 окт", "30 окт", "31 окт", "1 ноя"],
      spendPoints: "40,139 140,106 240,128 340,78.5 440,117 540,89.5 640,117",
      leadsPoints: "40,150 140,122.5 240,136.25 340,95 440,136.25 540,108.75 640,136.25",
      rows: [
        {
          name: "Мастерская мебели",
          initials: "ММ",
          category: "Мебель и интерьер",
          spend: "7 500 ₽",
          leads: "25",
          cpl: "300 ₽",
          color: "blue",
        },
        {
          name: "Дом и ремонт",
          initials: "ДР",
          category: "Услуги для дома",
          spend: "4 500 ₽",
          leads: "15",
          cpl: "300 ₽",
          color: "coral",
        },
      ],
      accessibleSeries:
        "Расходы по дням: 1 200, 1 800, 1 400, 2 300, 1 600, 2 100, 1 600 рублей. Обращения: 4, 6, 5, 8, 5, 7, 5.",
    },
    month: {
      label: "1 — 31 окт 2026",
      short: "Октябрь 2026",
      spend: "48 000 ₽",
      leads: "160",
      cpl: "300 ₽",
      axis: ["1 окт", "6 окт", "11 окт", "16 окт", "21 окт", "26 окт", "31 окт"],
      spendPoints: "40,180 140,140 240,160 340,100 440,115 540,55 640,85",
      leadsPoints: "40,190 140,150 240,140 340,120 440,100 540,90 640,65",
      rows: [
        {
          name: "Мастерская мебели",
          initials: "ММ",
          category: "Мебель и интерьер",
          spend: "30 000 ₽",
          leads: "100",
          cpl: "300 ₽",
          color: "blue",
        },
        {
          name: "Дом и ремонт",
          initials: "ДР",
          category: "Услуги для дома",
          spend: "18 000 ₽",
          leads: "60",
          cpl: "300 ₽",
          color: "coral",
        },
      ],
      accessibleSeries:
        "Условная форма тренда за октябрь. Итоги: 48 000 рублей и 160 обращений. Точки кривой иллюстративные и не задают дневные значения.",
    },
  },
} as const;

export type Period = keyof typeof demo.periods;
