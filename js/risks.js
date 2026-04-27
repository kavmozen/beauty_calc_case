/**
 * Расчёт рисков для салона красоты при работе «в серую».
 *
 * Основание:
 * - ст. 122 НК РФ: штраф 20% (неосторожность) / 40% (умысел) от неуплаченной суммы
 * - ст. 123 НК РФ: штраф 20% от невыплаченного НДФЛ
 * - ст. 5.27 КоАП: штраф за незаключение трудового договора
 * - ст. 198, 199 УК РФ: уголовная ответственность при крупной недоимке
 * - Письмо ФНС от 11.08.2017 № СА-4-7/15895@: критерии дробления
 *
 * Период проверки ФНС: 3 года (ст. 89 НК РФ)
 */

export function calcRisks({ turnover, payToMaster, empCount, hasEmployees, regime }) {
  const months = 12;
  const years = 3;  // глубина выездной проверки ФНС

  const annualTurnover = turnover * months;
  const annualMasterPay = payToMaster * months;

  const risks = [];

  // =========================================================
  // РИСК 1: Наличные расчёты с мастерами (серая зарплата)
  // =========================================================
  // Если мастерам платят наличными без оформления — ФНС переквалифицирует
  // в трудовые отношения и доначислит НДФЛ + взносы за 3 года
  const ndflRate = 0.13;
  const contribRate = 0.30;

  const ndfl3y = annualMasterPay * years * ndflRate;
  const contrib3y = annualMasterPay * years * contribRate;
  const baseTaxDebt = ndfl3y + contrib3y;

  // Штраф 40% за умышленную неуплату (ст. 122 НК РФ п.3)
  const penaltyRate = 0.40;
  const penalty = baseTaxDebt * penaltyRate;

  // Пени ~18% годовых (ключевая ставка / 150 в день × 365)
  const peniRate = 0.18;
  const avgPeriod = 1.5; // средний срок задолженности ~1.5 года
  const peni = baseTaxDebt * peniRate * avgPeriod;

  // Штраф за незаключение трудовых договоров (ст. 5.27 КоАП)
  // ООО: 50 000–100 000₽ за каждого, ИП: 5 000–10 000₽
  const masterCount = Math.max(1, Math.round(payToMaster > 0 ? empCount || 5 : 0));
  const perPersonFine = 100000; // берём максимальный
  const laborFine = masterCount * perPersonFine;

  const totalCash = Math.round(baseTaxDebt + penalty + peni + laborFine);

  risks.push({
    id: "cash",
    title: "Наличные расчёты с мастерами",
    subtitle: "Переквалификация в трудовые отношения",
    items: [
      { label: `НДФЛ за ${years} года (${annualMasterPay > 0 ? Math.round(annualMasterPay).toLocaleString("ru") : 0} × ${years} × ${ndflRate * 100}%)`, value: ndfl3y },
      { label: `Страховые взносы за ${years} года (${contribRate * 100}%)`, value: contrib3y },
      { label: `Штраф за умышленную неуплату (${penaltyRate * 100}%)`, value: penalty },
      { label: "Пени (~18% годовых)", value: peni },
      { label: `Штраф за незаключение трудовых (${masterCount} чел. × ${(perPersonFine / 1000).toFixed(0)} тыс.)`, value: laborFine },
    ],
    total: totalCash,
    legal: "ст. 122, 123 НК РФ, ст. 5.27 КоАП РФ",
  });

  // =========================================================
  // РИСК 2: Дробление бизнеса
  // =========================================================
  // Если салон дробит бизнес на несколько ИП/ООО для сохранения УСН,
  // ФНС объединяет и доначисляет по ОСНО: НДС 22% + налог на прибыль 25%
  const vatRate = 0.22;
  const profitTaxRate = 0.25;

  // НДС исходящий за 3 года (от выручки)
  const vat3y = annualTurnover * years * vatRate / (1 + vatRate);

  // Прибыль для налога (грубо: выручка − 60% расходов)
  const estExpenseRate = 0.60;
  const estProfit3y = annualTurnover * years * (1 - estExpenseRate);
  const profitTax3y = estProfit3y * profitTaxRate;

  const splitBaseTax = vat3y + profitTax3y;
  const splitPenalty = splitBaseTax * penaltyRate;
  const splitPeni = splitBaseTax * peniRate * avgPeriod;

  const totalSplit = Math.round(splitBaseTax + splitPenalty + splitPeni);

  // Уголовная ответственность
  let criminal = "";
  if (splitBaseTax > 56250000) {
    criminal = "Особо крупный размер (>56,25 млн): до 6 лет лишения свободы (ст. 199 УК РФ)";
  } else if (splitBaseTax > 18750000) {
    criminal = "Крупный размер (>18,75 млн): до 2 лет лишения свободы (ст. 199 УК РФ)";
  } else if (splitBaseTax > 2700000) {
    criminal = "Возможна уголовная ответственность для ИП (ст. 198 УК РФ)";
  }

  risks.push({
    id: "split",
    title: "Дробление бизнеса",
    subtitle: "Объединение и пересчёт по ОСНО",
    items: [
      { label: `НДС за ${years} года (${vatRate * 100}% от оборота)`, value: vat3y },
      { label: `Налог на прибыль за ${years} года (${profitTaxRate * 100}%)`, value: profitTax3y },
      { label: `Штраф (${penaltyRate * 100}%)`, value: splitPenalty },
      { label: "Пени", value: splitPeni },
    ],
    total: totalSplit,
    criminal,
    legal: "ст. 54.1, 122 НК РФ, ст. 198/199 УК РФ",
  });

  // =========================================================
  // РИСК 3: Работа без ККТ / неприменение кассы
  // =========================================================
  const kktFine = Math.round(annualTurnover * 0.5); // до 50% от суммы (мин 30 000₽)
  const kktMin = Math.max(kktFine, 30000);

  risks.push({
    id: "kkt",
    title: "Неприменение ККТ",
    subtitle: "Приём наличных без кассы",
    items: [
      { label: "Штраф 25–50% от суммы расчёта", value: kktFine },
    ],
    total: kktFine,
    legal: "ст. 14.5 КоАП РФ",
  });

  const grandTotal = totalCash + totalSplit;

  return { risks, grandTotal };
}
