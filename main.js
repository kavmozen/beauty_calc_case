import { computeBeforeAfter } from "./model.js";
import { calcRisks } from "./risks.js";
import { fmtRub, fmtSignedRub, num, int, clamp, setText, getEl } from "./utils.js";

let lastResult = null;
let lastRegime = "usn6";
let lastShowFixed = false;
let lastShowVat = false;

const els = {
  regime: getEl("regime"),
  turnover: getEl("turnover"),
  acquiring: getEl("acquiring"),
  hasEmployees: getEl("hasEmployees"),
  empCount: getEl("empCount"),
  empSalary: getEl("empSalary"),
  empContribSum: getEl("empContribSum"),
  fixedContrib: getEl("fixedContrib"),
  splitMaster: getEl("splitMaster"),
  splitSalon: getEl("splitSalon"),
  patentFee: getEl("patentFee"),
  extra: getEl("extra"),
  extra15: getEl("extra15"),
  empContribWrap: getEl("empContribWrap"),
  extra15Wrap: getEl("extra15Wrap"),
  extraLabel: getEl("extraLabel"),
  osnVat: getEl("osnVat"),
  osnTypeWrap: getEl("osnTypeWrap"),
  osnType: getEl("osnType"),
  osnVatWrap: getEl("osnVatWrap"),
  includeOnePct: getEl("includeOnePct"),
  platformFeeRate: getEl("platformFeeRate"),
  cashWithdrawal: getEl("cashWithdrawal"),
  showFormulas: getEl("showFormulas"),

  revBefore: getEl("revBefore"),
  payMasterBefore: getEl("payMasterBefore"),
  acqBefore: getEl("acqBefore"),
  cashBefore: getEl("cashBefore"),
  taxBefore: getEl("taxBefore"),
  taxLabelBefore: getEl("taxLabelBefore"),
  onePctBefore: getEl("onePctBefore"),
  empContribBefore: getEl("empContribBefore"),
  fixedContribBefore: getEl("fixedContribBefore"),
  expBefore: getEl("expBefore"),
  netBefore: getEl("netBefore"),

  rowVatOutputBefore: getEl("rowVatOutputBefore"),
  rowVatInputBefore: getEl("rowVatInputBefore"),
  rowVatPayableBefore: getEl("rowVatPayableBefore"),
  rowProfitTaxBefore: getEl("rowProfitTaxBefore"),
  vatOutputBefore: getEl("vatOutputBefore"),
  vatInputBefore: getEl("vatInputBefore"),
  vatPayableBefore: getEl("vatPayableBefore"),
  profitTaxBefore: getEl("profitTaxBefore"),

  rowFixedContribBefore: getEl("rowFixedContribBefore"),
  rowTaxBefore: getEl("rowTaxBefore"),
  rowEmpContribBefore: getEl("rowEmpContribBefore"),

  revAfter: getEl("revAfter"),
  platformFeeAfter: getEl("platformFeeAfter"),
  taxAfter: getEl("taxAfter"),
  taxLabelAfter: getEl("taxLabelAfter"),
  onePctAfter: getEl("onePctAfter"),
  fixedContribAfter: getEl("fixedContribAfter"),
  expAfter: getEl("expAfter"),
  netAfter: getEl("netAfter"),

  rowVatOutputAfter: getEl("rowVatOutputAfter"),
  rowVatInputAfter: getEl("rowVatInputAfter"),
  rowVatPayableAfter: getEl("rowVatPayableAfter"),
  rowProfitTaxAfter: getEl("rowProfitTaxAfter"),
  vatOutputAfter: getEl("vatOutputAfter"),
  vatInputAfter: getEl("vatInputAfter"),
  vatPayableAfter: getEl("vatPayableAfter"),
  profitTaxAfter: getEl("profitTaxAfter"),

  rowFixedContribAfter: getEl("rowFixedContribAfter"),
  rowExpAfter: getEl("rowExpAfter"),

  diffTax: getEl("diffTax"),
  diffNet: getEl("diffNet"),
  diffBox: getEl("diffBox"),

  mixedIncomeWrap: getEl("mixedIncomeWrap"),
  incomePatent: getEl("incomePatent"),
  incomeUsn: getEl("incomeUsn"),
  mixedAfterFromSalonIncome: getEl("mixedAfterFromSalonIncome"),
};

const formulaMap = {
  fPayMasterB: { side: "before", key: "payMaster" },
  fAcqB: { side: "before", key: "acquiring" },
  fCashB: { side: "before", key: "cashWithdrawal" },
  fTaxB: { side: "before", key: "tax" },
  fOnePctB: { side: "before", key: "onePct" },
  fEmpContribB: { side: "before", key: "empContrib" },
  fFixedContribB: { side: "before", key: "fixedContrib" },
  fNetB: { side: "before", key: "net" },
  fVatOutputB: { side: "before", key: "vatOutput" },
  fVatInputB: { side: "before", key: "vatInput" },
  fVatPayableB: { side: "before", key: "vatPayable" },
  fProfitTaxB: { side: "before", key: "profitTax" },
  fRevA: { side: "after", key: "revenue" },
  fPlatformA: { side: "after", key: "platformFee" },
  fTaxA: { side: "after", key: "tax" },
  fOnePctA: { side: "after", key: "onePct" },
  fFixedContribA: { side: "after", key: "fixedContrib" },
  fNetA: { side: "after", key: "net" },
  fVatOutputA: { side: "after", key: "vatOutput" },
  fVatInputA: { side: "after", key: "vatInput" },
  fVatPayableA: { side: "after", key: "vatPayable" },
  fProfitTaxA: { side: "after", key: "profitTax" },
};

function togglePatent() {
  if (!els.patentFee) return;
  const r = els.regime?.value;
  const need = (r === "patent" || r === "patent_usn6");
  els.patentFee.disabled = !need;
  if (!need) els.patentFee.value = 0;
}

function toggleModeUI() {
  const regime = els.regime?.value || "usn6";
  const isUsn15 = regime === "usn15";
  const isOsn = regime === "osn";
  const isMixed = regime === "patent_usn6";

  if (els.empContribWrap) els.empContribWrap.classList.add("hidden");
  if (els.extra15Wrap) els.extra15Wrap.classList.toggle("hidden", !isUsn15);
  if (els.extraLabel) els.extraLabel.classList.toggle("hidden", !!isUsn15);
  if (els.osnTypeWrap) els.osnTypeWrap.classList.toggle("hidden", !isOsn);
  if (els.osnVatWrap) els.osnVatWrap.classList.toggle("hidden", !isOsn);
  if (els.mixedIncomeWrap) els.mixedIncomeWrap.classList.toggle("hidden", !isMixed);
  if (els.turnover) els.turnover.readOnly = isMixed;
}

function syncSplits() {
  if (!els.splitMaster || !els.splitSalon) return;
  if (document.activeElement === els.splitMaster) {
    els.splitSalon.value = clamp(100 - clamp(num(els.splitMaster.value, 0), 0, 100), 0, 100);
  } else if (document.activeElement === els.splitSalon) {
    els.splitMaster.value = clamp(100 - clamp(num(els.splitSalon.value, 0), 0, 100), 0, 100);
  }
  els.splitSalon.value = clamp(100 - clamp(num(els.splitMaster.value, 0), 0, 100), 0, 100);
}

function getTurnover(regime) {
  if (regime !== "patent_usn6") return Math.max(0, num(els.turnover?.value, 0));
  const sum = Math.max(0, num(els.incomePatent?.value, 0)) + Math.max(0, num(els.incomeUsn?.value, 0));
  if (els.turnover) els.turnover.value = String(sum);
  return sum;
}

function setFormula(id, text) {
  const el = getEl(id);
  if (el) el.textContent = text || "";
}

function run() {
  syncSplits();

  const regime = els.regime?.value || "usn6";
  const result = computeBeforeAfter({
    regime,
    turnover: getTurnover(regime),
    acquiringRate: num(els.acquiring?.value, 0),
    hasEmployees: !!els.hasEmployees?.checked,
    empCount: int(els.empCount?.value, 0),
    empSalary: num(els.empSalary?.value, 0),
    empContribSum: num(els.empContribSum?.value, 0),
    fixedContrib: num(els.fixedContrib?.value, 0),
    splitMaster: num(els.splitMaster?.value, 0),
    splitSalon: num(els.splitSalon?.value, 0),
    patentFee: num(els.patentFee?.value, 0),
    extra: num(els.extra?.value, 0),
    extra15: num(els.extra15?.value, 0),
    includeVat: !!els.osnVat?.checked,
    osnType: els.osnType?.value || "ooo25",
    includeOnePct: !!els.includeOnePct?.checked,
    platformFeeRate: num(els.platformFeeRate?.value, 0),
    cashWithdrawal: num(els.cashWithdrawal?.value, 0),
    incomePatent: num(els.incomePatent?.value, 0),
    incomeUsn: num(els.incomeUsn?.value, 0),
    mixedAfterFromSalonIncome: !!els.mixedAfterFromSalonIncome?.checked,
  });

  const b = result.before;
  const a = result.after;
  const isOsn = regime === "osn";
  const isUsn15 = regime === "usn15";
  const showFixed = (isUsn15 || isOsn) && b.fixedContrib > 0;
  const showVat = isOsn && !!els.osnVat?.checked;

  lastResult = result;
  lastRegime = regime;
  lastShowFixed = showFixed;
  lastShowVat = showVat;

  setText(els.revBefore, fmtRub(b.revenue));
  setText(els.payMasterBefore, fmtRub(b.payMaster));
  setText(els.acqBefore, fmtRub(b.acquiring));
  setText(els.cashBefore, fmtRub(b.cashWithdrawal));
  setText(els.onePctBefore, fmtRub(b.onePct));
  setText(els.empContribBefore, fmtRub(b.empContrib));
  setText(els.fixedContribBefore, fmtRub(b.fixedContrib));
  setText(els.expBefore, fmtRub(b.extra));
  setText(els.netBefore, fmtRub(b.net));

  if (isOsn && showVat) {
    hide(els.rowTaxBefore);
    show(els.rowVatOutputBefore); show(els.rowVatInputBefore);
    show(els.rowVatPayableBefore); show(els.rowProfitTaxBefore);
    setText(els.vatOutputBefore, fmtRub(b.vatOutput));
    setText(els.vatInputBefore, fmtRub(b.vatInput));
    setText(els.vatPayableBefore, fmtRub(b.vatPayable));
    setText(els.profitTaxBefore, fmtRub(b.profitTax));
  } else if (isOsn) {
    show(els.rowTaxBefore);
    hide(els.rowVatOutputBefore); hide(els.rowVatInputBefore);
    hide(els.rowVatPayableBefore); hide(els.rowProfitTaxBefore);
    setText(els.taxLabelBefore, "Налог на прибыль");
    setText(els.taxBefore, fmtRub(b.tax));
  } else {
    show(els.rowTaxBefore);
    hide(els.rowVatOutputBefore); hide(els.rowVatInputBefore);
    hide(els.rowVatPayableBefore); hide(els.rowProfitTaxBefore);
    setText(els.taxLabelBefore, isUsn15 ? "УСН 15%" : "УСН (после вычета)");
    setText(els.taxBefore, fmtRub(b.tax));
  }

  toggle(els.rowFixedContribBefore, showFixed);
  toggle(els.rowEmpContribBefore, b.empContrib > 0);

  setText(els.revAfter, fmtRub(a.revenue));
  setText(els.platformFeeAfter, fmtRub(a.platformFee));
  setText(els.onePctAfter, fmtRub(a.onePct));
  setText(els.fixedContribAfter, fmtRub(a.fixedContrib));
  setText(els.expAfter, fmtRub(a.extra));
  setText(els.netAfter, fmtRub(a.net));

  if (isOsn && showVat) {
    hide(getEl("rowTaxAfter"));
    show(els.rowVatOutputAfter); show(els.rowVatInputAfter);
    show(els.rowVatPayableAfter); show(els.rowProfitTaxAfter);
    setText(els.vatOutputAfter, fmtRub(a.vatOutput));
    setText(els.vatInputAfter, fmtRub(a.vatInput));
    setText(els.vatPayableAfter, fmtRub(a.vatPayable));
    setText(els.profitTaxAfter, fmtRub(a.profitTax));
  } else if (isOsn) {
    show(getEl("rowTaxAfter"));
    hide(els.rowVatOutputAfter); hide(els.rowVatInputAfter);
    hide(els.rowVatPayableAfter); hide(els.rowProfitTaxAfter);
    setText(els.taxLabelAfter, "Налог на прибыль");
    setText(els.taxAfter, fmtRub(a.tax));
  } else {
    show(getEl("rowTaxAfter"));
    hide(els.rowVatOutputAfter); hide(els.rowVatInputAfter);
    hide(els.rowVatPayableAfter); hide(els.rowProfitTaxAfter);
    setText(els.taxLabelAfter, isUsn15 ? "УСН 15%" : "УСН (после вычета)");
    setText(els.taxAfter, fmtRub(a.tax));
  }

  toggle(els.rowFixedContribAfter, showFixed);
  toggle(els.rowExpAfter, a.extra > 0);

  const fm = result.formulas;
  for (const [id, { side, key }] of Object.entries(formulaMap)) {
    setFormula(id, fm[side]?.[key] || "");
  }

  setText(els.diffTax, fmtSignedRub(result.diff.tax));
  setText(els.diffNet, fmtSignedRub(result.diff.net));
  if (els.diffBox) els.diffBox.classList.toggle("danger", result.diff.net < 0);

  // --- Риски ---
  renderRisks(result);
}

function show(el) { if (el) el.classList.remove("hidden"); }
function hide(el) { if (el) el.classList.add("hidden"); }
function toggle(el, visible) { if (el) el.classList.toggle("hidden", !visible); }

function renderRisks(result) {
  const container = getEl("risksContainer");
  if (!container) return;

  const { risks, grandTotal } = calcRisks({
    turnover: result.before.revenue,
    payToMaster: result.before.payMaster,
    empCount: result.inputs?.empCount || 5,
    hasEmployees: result.inputs?.hasEmployees,
    regime: result.inputs?.regime || "usn6",
  });

  function fmt(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  let html = `<div class="risks-header">
    <div class="risks-title">Риски при работе «в серую»</div>
    <div class="risks-grand">Потенциальные потери: <strong>${fmt(grandTotal)} ₽</strong></div>
  </div>`;

  for (const risk of risks) {
    html += `<div class="risk-block">
      <div class="risk-top">
        <div>
          <div class="risk-name">${risk.title}</div>
          <div class="risk-sub">${risk.subtitle}</div>
        </div>
        <div class="risk-total">${fmt(risk.total)} ₽</div>
      </div>
      <div class="risk-items">`;

    for (const item of risk.items) {
      html += `<div class="risk-item">
        <span>${item.label}</span>
        <span>${fmt(item.value)} ₽</span>
      </div>`;
    }

    html += `</div>
      <div class="risk-legal">${risk.legal}</div>`;

    if (risk.criminal) {
      html += `<div class="risk-criminal">⚠ ${risk.criminal}</div>`;
    }

    html += `</div>`;
  }

  html += `<div class="risks-footer">
    <a href="precedents.html" class="risks-link">→ Прецеденты штрафов и доначислений</a>
  </div>`;

  container.innerHTML = html;
}

if (els.showFormulas) {
  els.showFormulas.addEventListener("change", () => {
    document.body.classList.toggle("formulas-visible", els.showFormulas.checked);
  });
}

// --- Theme toggle ---
const themeBtn = getEl("themeToggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const isModern = document.body.classList.toggle("theme-modern");
    themeBtn.textContent = isModern ? "◐ Брутализм" : "◑ Сменить стиль";
  });
}

const ids = [
  "regime", "turnover", "acquiring", "fixedContrib", "empContribSum", "hasEmployees",
  "empCount", "empSalary", "patentFee", "extra", "extra15", "osnVat", "osnType",
  "splitMaster", "splitSalon", "includeOnePct",
  "platformFeeRate", "cashWithdrawal",
  "incomePatent", "incomeUsn", "mixedAfterFromSalonIncome"
];

ids.forEach((id) => {
  const el = getEl(id);
  if (!el) return;
  el.addEventListener("input", run);
  el.addEventListener("change", run);
});

if (els.regime) {
  els.regime.addEventListener("change", togglePatent);
  els.regime.addEventListener("change", toggleModeUI);
  els.regime.addEventListener("change", run);
}

togglePatent();
toggleModeUI();
run();

// =========================================================
//  ЭКСПОРТ В EXCEL С ЖИВЫМИ ФОРМУЛАМИ
// =========================================================
/**
 * Структура листа:
 *   A1-B1: Заголовок
 *   Строки 3-13: ВВОДНЫЕ (A=название, B=значение, синий шрифт — редактируемые)
 *   Строка 15+: ДО ВНЕДРЕНИЯ (A=показатель, B=формула, C=пояснение)
 *   Далее: ПОСЛЕ ВНЕДРЕНИЯ
 *   Далее: РАЗНИЦА
 *
 * Все расчётные ячейки — Excel-формулы, ссылаются на вводные.
 * Бухгалтер меняет B3..B13 → весь расчёт пересчитывается.
 */
function exportToXlsx() {
  if (!lastResult || typeof XLSX === "undefined") return;

  const inp = lastResult.inputs;
  const regimeNames = { usn6: "УСН 6%", usn15: "УСН 15%", osn: "ОСН" };

  const wb = XLSX.utils.book_new();
  const rows = [];   // [row][col] — значения/формулы
  const merges = [];
  const styles = {};  // cell ref → style info (мы пометим, потом применим)

  let r = 0; // текущая строка (0-based)

  function add(a, b, c, d) { rows[r] = [a ?? "", b ?? "", c ?? "", d ?? ""]; r++; }
  function blank() { rows[r] = ["", "", "", ""]; r++; }
  // Excel row (1-based) для текущей r
  function R() { return r + 1; }

  // ===== ЗАГОЛОВОК =====
  add("КАЛЬКУЛЯТОР НАЛОГОВОЙ НАГРУЗКИ", "", "", "");
  add("Режим:", regimeNames[lastRegime] || lastRegime, "", "");
  blank();

  // ===== ВВОДНЫЕ =====
  add("ВВОДНЫЕ ДАННЫЕ", "", "", "Измените значения в столбце B для пересчёта");
  const inputStartRow = R(); // строка первого вводного (1-based)

  // Каждый вводной: [название, значение]
  // Мы запоминаем строку каждого для ссылок
  const iRows = {};
  function addInput(key, label, value) {
    iRows[key] = R();
    add(label, value, "", "");
  }

  addInput("turnover",     "Оборот (выручка)", inp.turnover);
  addInput("acqRate",      "Эквайринг, %", inp.acquiringRate);
  addInput("cash",         "Вывод наличных", inp.cashWithdrawal);
  addInput("platformRate", "Комиссия платформы, %", inp.platformFeeRate);
  addInput("fixedContrib", "Фикс. взносы ИП", inp.fixedContrib);
  addInput("splitMaster",  "Доля мастера, %", inp.splitMaster);
  addInput("splitSalon",   "Сплит салону, %", { t: "n", f: `=100-B${iRows.splitMaster}` });
  addInput("hasEmp",       "Есть сотрудники (1=да, 0=нет)", inp.hasEmployees ? 1 : 0);
  addInput("empCount",     "Кол-во сотрудников", inp.empCount);
  addInput("empSalary",    "Средняя зарплата", inp.empSalary);
  addInput("extra",        "Доп. расходы", lastRegime === "usn15" ? inp.extraUsn15 : inp.extraCommon);

  blank();

  // Ссылки на ячейки вводных
  const $ = {};
  for (const [key, row] of Object.entries(iRows)) {
    $[key] = `B${row}`;
  }

  // ===== ДО ВНЕДРЕНИЯ =====
  add("ДО ВНЕДРЕНИЯ", "Значение", "Формула (пояснение)", "");
  const bRows = {};
  function addBefore(key, label, formula, comment) {
    bRows[key] = R();
    add(label, formula, comment || "", "");
  }

  addBefore("rev", "Оборот", { t: "n", f: `=${$.turnover}` }, "= Оборот из вводных");
  addBefore("master", "Выплаты мастерам", { t: "n", f: `=${$.turnover}*${$.splitMaster}/100` }, "Оборот × Доля мастера %");
  addBefore("acq", "Эквайринг", { t: "n", f: `=${$.turnover}*${$.acqRate}/100` }, "Оборот × Ставка %");
  addBefore("cash", "Вывод наличных", { t: "n", f: `=${$.cash}` }, "Из вводных");
  addBefore("empContrib", "Страх. взносы сотр.", { t: "n", f: `=IF(${$.hasEmp},${$.empCount}*${$.empSalary}*0.3,0)` }, "Кол-во × ЗП × 30%");

  if (lastRegime === "usn6") {
    addBefore("onePct", "1% взнос", { t: "n", f: `=MIN(MAX(${$.turnover}-300000,0)*0.01,277571)` }, "(Доход − 300 000) × 1%");
    addBefore("contribAll", "Взносы для вычета", { t: "n", f: `=${$.fixedContrib}+B${bRows.onePct}+B${bRows.empContrib}` }, "Фикс + 1% + Сотр");
    addBefore("baseTax", "База УСН 6%", { t: "n", f: `=${$.turnover}*0.06` }, "Оборот × 6%");
    addBefore("deductCap", "Лимит вычета", { t: "n", f: `=IF(${$.hasEmp},B${bRows.baseTax}*0.5,B${bRows.baseTax})` }, "50% если сотр, иначе 100%");
    addBefore("deduct", "Вычет", { t: "n", f: `=MIN(B${bRows.contribAll},B${bRows.deductCap})` }, "min(Взносы, Лимит)");
    addBefore("tax", "УСН (после вычета)", { t: "n", f: `=B${bRows.baseTax}-B${bRows.deduct}` }, "База − Вычет");
    addBefore("net", "ЧИСТО САЛОНА", { t: "n", f: `=B${bRows.rev}-B${bRows.master}-B${bRows.acq}-B${bRows.cash}-B${bRows.tax}-B${bRows.onePct}-B${bRows.empContrib}-${$.extra}` }, "Оборот − все расходы (фикс.взносы не вычитаются — вернулись через вычет)");

  } else if (lastRegime === "usn15") {
    addBefore("expNo1Pct", "Расходы (без 1%)", { t: "n", f: `=B${bRows.master}+B${bRows.acq}+B${bRows.cash}+B${bRows.empContrib}+${$.fixedContrib}+${$.extra}` }, "Мастерам+Экв+Наличка+Сотр+Фикс+Доп");
    addBefore("profitFor1Pct", "Прибыль для 1%", { t: "n", f: `=MAX(${$.turnover}-B${bRows.expNo1Pct},0)` }, "Доход − Расходы (без 1%)");
    addBefore("onePct", "1% взнос", { t: "n", f: `=MIN(MAX(B${bRows.profitFor1Pct}-300000,0)*0.01,277571)` }, "(Прибыль − 300 000) × 1%");
    addBefore("expAll", "Расходы итого", { t: "n", f: `=B${bRows.expNo1Pct}+B${bRows.onePct}` }, "Расходы + 1%");
    addBefore("taxBase", "Налоговая база", { t: "n", f: `=MAX(${$.turnover}-B${bRows.expAll},0)` }, "Доход − Расходы");
    addBefore("mainTax", "Налог 15%", { t: "n", f: `=B${bRows.taxBase}*0.15` }, "База × 15%");
    addBefore("minTax", "Мин. налог 1%", { t: "n", f: `=${$.turnover}*0.01` }, "Оборот × 1%");
    addBefore("tax", "УСН 15%", { t: "n", f: `=MAX(B${bRows.mainTax},B${bRows.minTax})` }, "max(15%, Мин)");
    addBefore("net", "ЧИСТО САЛОНА", { t: "n", f: `=${$.turnover}-B${bRows.master}-B${bRows.acq}-B${bRows.cash}-B${bRows.tax}-B${bRows.onePct}-B${bRows.empContrib}-${$.fixedContrib}-${$.extra}` }, "Оборот − все расходы − налог");

  } else if (lastRegime === "osn") {
    const ratePct = inp.osnRate;
    addBefore("onePct", "1% взнос", { t: "n", f: inp.isOsnIP ? `=MIN(MAX(${$.turnover}-300000,0)*0.01,277571)` : "=0" }, inp.isOsnIP ? "(Доход − 300 000) × 1%" : "ООО — не применяется");
    addBefore("expAll", "Расходы всего", { t: "n", f: `=B${bRows.master}+B${bRows.acq}+B${bRows.cash}+B${bRows.empContrib}+${inp.needsFC ? $.fixedContrib : "0"}+B${bRows.onePct}+${$.extra}` }, "Все расходы");

    if (inp.includeVat) {
      addBefore("vatOut", "НДС исходящий", { t: "n", f: `=${$.turnover}*22/122` }, "Оборот × 22/122");
      addBefore("vatIn", "НДС входящий", { t: "n", f: `=(B${bRows.acq}+${$.extra})*22/122` }, "Расх.с НДС × 22/122");
      addBefore("vatPay", "НДС к уплате", { t: "n", f: `=MAX(B${bRows.vatOut}-B${bRows.vatIn},0)` }, "Исходящий − Входящий");
      addBefore("revExVat", "Выручка без НДС", { t: "n", f: `=${$.turnover}-B${bRows.vatOut}` }, "");
      addBefore("expExVat", "Расходы без НДС", { t: "n", f: `=B${bRows.expAll}-B${bRows.vatIn}` }, "");
      addBefore("profitBase", "Прибыль", { t: "n", f: `=MAX(B${bRows.revExVat}-B${bRows.expExVat},0)` }, "");
      addBefore("profitTax", "Налог на прибыль", { t: "n", f: `=B${bRows.profitBase}*${ratePct}` }, `Прибыль × ${ratePct * 100}%`);
      addBefore("tax", "ИТОГО НАЛОГОВ", { t: "n", f: `=B${bRows.vatPay}+B${bRows.profitTax}` }, "НДС + Налог на прибыль");
    } else {
      addBefore("profitBase", "Прибыль", { t: "n", f: `=MAX(${$.turnover}-B${bRows.expAll},0)` }, "Доход − Расходы");
      addBefore("tax", "Налог на прибыль", { t: "n", f: `=B${bRows.profitBase}*${ratePct}` }, `Прибыль × ${ratePct * 100}%`);
    }
    addBefore("net", "ЧИСТО САЛОНА", { t: "n", f: `=${$.turnover}-B${bRows.expAll}-B${bRows.tax}` }, "Доход − Расходы − Налог");
  }

  blank();

  // ===== ПОСЛЕ ВНЕДРЕНИЯ =====
  add("ПОСЛЕ ВНЕДРЕНИЯ", "Значение", "Формула (пояснение)", "");
  const aRows = {};
  function addAfter(key, label, formula, comment) {
    aRows[key] = R();
    add(label, formula, comment || "", "");
  }

  addAfter("rev", "Доход салона (аренда)", { t: "n", f: `=${$.turnover}*${$.splitSalon}/100` }, "Оборот × Сплит салону %");
  addAfter("platform", "Комиссия платформы", { t: "n", f: `=${$.turnover}*${$.platformRate}/100` }, "Оборот × Ставка %");

  if (lastRegime === "usn6") {
    addAfter("onePct", "1% взнос", { t: "n", f: `=MIN(MAX(B${aRows.rev}-300000,0)*0.01,277571)` }, "(Доход − 300 000) × 1%");
    addAfter("contribAll", "Взносы для вычета", { t: "n", f: `=${$.fixedContrib}+B${aRows.onePct}` }, "Фикс + 1% (нет сотр.)");
    addAfter("baseTax", "База УСН 6%", { t: "n", f: `=B${aRows.rev}*0.06` }, "Доход × 6%");
    addAfter("deduct", "Вычет", { t: "n", f: `=MIN(B${aRows.contribAll},B${aRows.baseTax})` }, "100% (нет сотрудников)");
    addAfter("tax", "УСН (после вычета)", { t: "n", f: `=B${aRows.baseTax}-B${aRows.deduct}` }, "");
    addAfter("net", "ЧИСТО САЛОНА", { t: "n", f: `=B${aRows.rev}-B${aRows.platform}-B${aRows.tax}-B${aRows.onePct}` }, "Доход − Мозен − Налог − 1%");

  } else if (lastRegime === "usn15") {
    addAfter("expNo1Pct", "Расходы (без 1%)", { t: "n", f: `=B${aRows.platform}+${$.fixedContrib}+${$.extra}` }, "Мозен+Фикс+Доп");
    addAfter("profitFor1Pct", "Прибыль для 1%", { t: "n", f: `=MAX(B${aRows.rev}-B${aRows.expNo1Pct},0)` }, "Доход − Расходы (без 1%)");
    addAfter("onePct", "1% взнос", { t: "n", f: `=MIN(MAX(B${aRows.profitFor1Pct}-300000,0)*0.01,277571)` }, "(Прибыль − 300 000) × 1%");
    addAfter("expAll", "Расходы итого", { t: "n", f: `=B${aRows.expNo1Pct}+B${aRows.onePct}` }, "");
    addAfter("taxBase", "Налоговая база", { t: "n", f: `=MAX(B${aRows.rev}-B${aRows.expAll},0)` }, "");
    addAfter("mainTax", "Налог 15%", { t: "n", f: `=B${aRows.taxBase}*0.15` }, "");
    addAfter("minTax", "Мин. налог 1%", { t: "n", f: `=B${aRows.rev}*0.01` }, "");
    addAfter("tax", "УСН 15%", { t: "n", f: `=MAX(B${aRows.mainTax},B${aRows.minTax})` }, "");
    addAfter("net", "ЧИСТО САЛОНА", { t: "n", f: `=B${aRows.rev}-B${aRows.platform}-B${aRows.tax}-B${aRows.onePct}-${$.fixedContrib}-${$.extra}` }, "");

  } else if (lastRegime === "osn") {
    const ratePct = inp.osnRate;
    addAfter("onePct", "1% взнос", { t: "n", f: inp.isOsnIP ? `=MIN(MAX(B${aRows.rev}-300000,0)*0.01,277571)` : "=0" }, "");
    addAfter("expAll", "Расходы всего", { t: "n", f: `=B${aRows.platform}+${inp.needsFC ? $.fixedContrib : "0"}+B${aRows.onePct}+${$.extra}` }, "");

    if (inp.includeVat) {
      addAfter("vatOut", "НДС исходящий", { t: "n", f: `=B${aRows.rev}*22/122` }, "");
      addAfter("vatIn", "НДС входящий", { t: "n", f: `=(B${aRows.platform}+${$.extra})*22/122` }, "");
      addAfter("vatPay", "НДС к уплате", { t: "n", f: `=MAX(B${aRows.vatOut}-B${aRows.vatIn},0)` }, "");
      addAfter("revExVat", "Выручка без НДС", { t: "n", f: `=B${aRows.rev}-B${aRows.vatOut}` }, "");
      addAfter("expExVat", "Расходы без НДС", { t: "n", f: `=B${aRows.expAll}-B${aRows.vatIn}` }, "");
      addAfter("profitBase", "Прибыль", { t: "n", f: `=MAX(B${aRows.revExVat}-B${aRows.expExVat},0)` }, "");
      addAfter("profitTax", "Налог на прибыль", { t: "n", f: `=B${aRows.profitBase}*${ratePct}` }, "");
      addAfter("tax", "ИТОГО НАЛОГОВ", { t: "n", f: `=B${aRows.vatPay}+B${aRows.profitTax}` }, "");
    } else {
      addAfter("profitBase", "Прибыль", { t: "n", f: `=MAX(B${aRows.rev}-B${aRows.expAll},0)` }, "");
      addAfter("tax", "Налог на прибыль", { t: "n", f: `=B${aRows.profitBase}*${ratePct}` }, "");
    }
    addAfter("net", "ЧИСТО САЛОНА", { t: "n", f: `=B${aRows.rev}-B${aRows.expAll}-B${aRows.tax}` }, "");
  }

  blank();

  // ===== РАЗНИЦА =====
  add("РАЗНИЦА", "Значение", "", "");
  const diffR1 = R();
  add("По чистой прибыли", { t: "n", f: `=B${aRows.net}-B${bRows.net}` }, "После − До", "");

  // ===== Создаём лист =====
  const ws = XLSX.utils.aoa_to_sheet(rows.map(row =>
    row.map(cell => {
      if (cell && typeof cell === "object" && cell.f) return cell;
      return cell;
    })
  ));

  // Формулы: SheetJS принимает {t:"n", f:"=..."} напрямую в aoa_to_sheet
  // Перезаписываем ячейки с формулами
  for (let ri = 0; ri < rows.length; ri++) {
    for (let ci = 0; ci < rows[ri].length; ci++) {
      const cell = rows[ri][ci];
      if (cell && typeof cell === "object" && cell.f) {
        const ref = XLSX.utils.encode_cell({ r: ri, c: ci });
        ws[ref] = { t: "n", f: cell.f };
      }
    }
  }

  ws["!cols"] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 50 },
    { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Расчёт");
  XLSX.writeFile(wb, `Налоговый_расчёт_${(regimeNames[lastRegime] || lastRegime).replace(/\s/g, "_")}.xlsx`);
}

const exportBtn = getEl("exportXlsx");
if (exportBtn) exportBtn.addEventListener("click", exportToXlsx);

// =========================================================
//  ГРАФИК ЭКОНОМИИ ЗА 12 МЕСЯЦЕВ
// =========================================================
let savingsChartInstance = null;

function renderChart(monthlyDiff) {
  const canvas = getEl("savingsChart");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const data = labels.map((_, i) => Math.round(monthlyDiff * (i + 1)));

  const isDark = document.body.classList.contains("theme-modern");
  const barColor = monthlyDiff >= 0
    ? (isDark ? "rgba(52,211,153,0.7)" : "rgba(22,163,106,0.6)")
    : (isDark ? "rgba(248,113,113,0.7)" : "rgba(220,38,38,0.6)");
  const textColor = isDark ? "#71717a" : "#888";

  if (savingsChartInstance) savingsChartInstance.destroy();

  savingsChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Накопленная экономия, ₽",
        data,
        backgroundColor: barColor,
        borderRadius: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ctx.parsed.y.toLocaleString("ru") + " ₽"
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: textColor,
            callback: v => (v / 1000).toFixed(0) + "k",
          },
          grid: { color: isDark ? "#27272a" : "#e7e5e4" },
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false },
        }
      }
    }
  });
}

// =========================================================
//  ОКУПАЕМОСТЬ ВНЕДРЕНИЯ
// =========================================================
function renderPayback() {
  if (!lastResult) return;

  const mozenEl = getEl("paybackMozen");
  const savingEl = getEl("paybackSaving");
  const monthsEl = getEl("paybackMonths");
  const profitEl = getEl("profitYear");
  const explainEl = getEl("paybackExplain");
  if (!monthsEl || !profitEl) return;

  const b = lastResult.before;
  const a = lastResult.after;

  // Комиссия Мозен в месяц (стоимость внедрения)
  const mozenCost = a.platformFee || 0;

  // Экономия: что салон перестаёт платить
  const savingAcq = b.acquiring || 0;         // эквайринг
  const savingCash = b.cashWithdrawal || 0;    // наличка
  const savingEmp = b.empContrib || 0;         // страховые за сотрудников
  const savingTax = (b.tax + b.onePct) - (a.tax + a.onePct); // разница налогов
  const totalSaving = savingAcq + savingCash + savingEmp + savingTax;

  // Чистая выгода в месяц
  const netBenefit = totalSaving - mozenCost;

  if (mozenEl) mozenEl.textContent = fmtRub(mozenCost);
  if (savingEl) savingEl.textContent = fmtRub(totalSaving);

  if (netBenefit > 0) {
    monthsEl.textContent = "Сразу";
    monthsEl.style.color = "var(--accent-green)";
    profitEl.textContent = fmtSignedRub(netBenefit * 12);

    if (explainEl) {
      explainEl.textContent = `Мозен окупается с первого месяца. Экономия (${fmtRub(totalSaving)}) превышает комиссию (${fmtRub(mozenCost)}) на ${fmtRub(netBenefit)} ежемесячно.`;
    }
  } else if (netBenefit === 0) {
    monthsEl.textContent = "В ноль";
    monthsEl.style.color = "var(--text)";
    profitEl.textContent = "0 ₽";
    if (explainEl) explainEl.textContent = "Экономия равна комиссии — вы не теряете и не выигрываете.";
  } else {
    monthsEl.textContent = "Не окупается";
    monthsEl.style.color = "var(--accent)";
    profitEl.textContent = fmtSignedRub(netBenefit * 12);
    profitEl.style.color = "var(--accent)";
    if (explainEl) {
      explainEl.textContent = `Комиссия Мозен (${fmtRub(mozenCost)}) превышает экономию (${fmtRub(totalSaving)}) на ${fmtRub(Math.abs(netBenefit))} в месяц. Рассмотрите другой сплит.`;
    }
  }
}

// =========================================================
//  СРАВНЕНИЕ СЦЕНАРИЕВ
// =========================================================
function renderScenarios() {
  if (!lastResult) return;
  const turnover = lastResult.before.revenue;
  const regime = lastRegime;
  const fixedContrib = Math.max(0, num(getEl("fixedContrib")?.value, 0));

  function calcScenario(prefix) {
    const split = Math.max(0, Math.min(100, num(getEl(prefix + "_split")?.value, 60)));
    const platRate = Math.max(0, num(getEl(prefix + "_platform")?.value, 5));

    const rev = turnover * split / 100;
    const mozen = turnover * platRate / 100;
    const onePct = Math.max(0, (rev - 300000) * 0.01);
    const cappedOnePct = Math.min(onePct, 277571);

    let tax;
    if (regime === "usn6") {
      const contribAll = fixedContrib + cappedOnePct;
      const base = rev * 0.06;
      const ded = Math.min(contribAll, base); // no employees after
      tax = Math.max(base - ded, 0);
    } else {
      tax = rev * 0.06; // fallback
    }

    const net = rev - mozen - tax - cappedOnePct;

    setText(getEl(prefix + "_rev"), fmtRub(rev));
    setText(getEl(prefix + "_tax"), fmtRub(tax + cappedOnePct));
    setText(getEl(prefix + "_mozen"), fmtRub(mozen));
    setText(getEl(prefix + "_net"), fmtRub(net));

    return net;
  }

  const netA = calcScenario("scA");
  const netB = calcScenario("scB");
  const diff = netA - netB;
  setText(getEl("scDiff"), fmtSignedRub(diff));
}

["scA_split","scA_platform","scB_split","scB_platform"].forEach(id => {
  const el = getEl(id);
  if (el) {
    el.addEventListener("input", renderScenarios);
    el.addEventListener("change", renderScenarios);
  }
});

// =========================================================
//  PDF ЭКСПОРТ
// =========================================================
function exportPdf() {
  if (!lastResult || typeof html2pdf === "undefined") return;

  const b = lastResult.before;
  const a = lastResult.after;
  const d = lastResult.diff;
  const regimeNames = { usn6: "УСН 6%", usn15: "УСН 15%", osn: "ОСН" };
  const regime = regimeNames[lastRegime] || lastRegime;

  const f = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const signed = n => (n >= 0 ? "+" : "") + f(n);

  // Собираем чистый HTML для PDF
  const html = `
  <div style="font-family:'IBM Plex Mono','Courier New',monospace;color:#111;padding:32px;width:100%;">

    <div style="border:3px solid #111;padding:20px 28px;margin-bottom:24px;">
      <div style="font-family:'Bebas Neue','Impact',sans-serif;font-size:36px;letter-spacing:2px;text-transform:uppercase;">НАЛОГОВАЯ НАГРУЗКА</div>
      <div style="font-size:11px;color:#777;margin-top:4px;">Режим: ${regime} | Сравнение «до» и «после» внедрения платформы</div>
    </div>

    <div style="display:flex;gap:0;">
      <div style="flex:1;border:3px solid #111;padding:20px;">
        <div style="font-family:'Bebas Neue','Impact',sans-serif;font-size:20px;letter-spacing:2px;text-transform:uppercase;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px;">ДО ВНЕДРЕНИЯ</div>
        ${pdfRow("Оборот", f(b.revenue))}
        ${pdfRow("Выплаты мастерам", f(b.payMaster))}
        ${pdfRow("Эквайринг", f(b.acquiring))}
        ${pdfRow("Вывод наличных", f(b.cashWithdrawal))}
        ${pdfRow("УСН (после вычета)", f(b.tax))}
        ${pdfRow("1% взнос", f(b.onePct))}
        ${b.empContrib > 0 ? pdfRow("Страховые сотр.", f(b.empContrib)) : ""}
        ${b.fixedContrib > 0 ? pdfRow("Фикс. взносы ИП", f(b.fixedContrib)) : ""}
        ${pdfRow("Доп. расходы", f(b.extra))}
        ${pdfTotal("Чисто салона", f(b.net))}
      </div>

      <div style="flex:1;border:3px solid #111;border-left:none;padding:20px;background:#111;color:#f0ece4;">
        <div style="font-family:'Bebas Neue','Impact',sans-serif;font-size:20px;letter-spacing:2px;text-transform:uppercase;border-bottom:2px solid #444;padding-bottom:10px;margin-bottom:14px;color:#f0ece4;">ПОСЛЕ ВНЕДРЕНИЯ</div>
        ${pdfRow("Доход салона", f(a.revenue), true)}
        ${pdfRow("Комиссия Мозен", f(a.platformFee), true)}
        ${pdfRow("УСН (после вычета)", f(a.tax), true)}
        ${pdfRow("1% взнос", f(a.onePct), true)}
        ${a.fixedContrib > 0 ? pdfRow("Фикс. взносы ИП", f(a.fixedContrib), true) : ""}
        ${pdfTotal("Чисто салона", f(a.net), true)}
      </div>
    </div>

    <div style="border:3px solid #111;border-top:none;padding:20px 28px;display:flex;justify-content:space-between;">
      <div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#888;">Разница по нагрузке</div>
        <div style="font-family:'Bebas Neue','Impact',sans-serif;font-size:32px;color:${d.tax<=0?'#16a34a':'#dc2626'};">${signed(d.tax)} ₽</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#888;">Разница по чистой прибыли</div>
        <div style="font-family:'Bebas Neue','Impact',sans-serif;font-size:32px;color:${d.net>=0?'#16a34a':'#dc2626'};">${signed(d.net)} ₽</div>
      </div>
    </div>

    <div style="border:3px solid #111;border-top:none;padding:20px 28px;">
      <div style="font-family:'Bebas Neue','Impact',sans-serif;font-size:20px;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Экономия за 12 месяцев</div>
      <div style="display:flex;justify-content:space-between;gap:8px;height:120px;align-items:flex-end;">
        ${[1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
          const val = d.net * i;
          const maxVal = Math.abs(d.net * 12);
          const pct = maxVal > 0 ? Math.abs(val) / maxVal * 100 : 0;
          const color = val >= 0 ? "#16a34a" : "#dc2626";
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
            <div style="font-size:8px;color:#888;margin-bottom:2px;">${f(val)}</div>
            <div style="width:100%;height:${pct}%;background:${color};opacity:0.5;min-height:2px;"></div>
          </div>`;
        }).join("")}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        ${["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"].map(m=>`<div style="flex:1;text-align:center;font-size:8px;color:#888;">${m}</div>`).join("")}
      </div>
    </div>

    <div style="text-align:center;margin-top:24px;font-size:10px;color:#ccc;letter-spacing:3px;text-transform:uppercase;">
      Сформировано: ${new Date().toLocaleDateString("ru")}
    </div>
  </div>`;

  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "1100px";
  document.body.appendChild(container);

  html2pdf()
    .set({
      margin: 8,
      filename: "Налоговый_расчёт_" + regime.replace(/\s/g, "_") + ".pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, width: 1100 },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    })
    .from(container.firstElementChild)
    .save()
    .then(() => {
      document.body.removeChild(container);
    });
}

function pdfRow(label, value, dark) {
  const borderColor = dark ? "#333" : "#ccc";
  const labelColor = dark ? "#999" : "#888";
  const valColor = dark ? "#f0ece4" : "#111";
  return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid ${borderColor};">
    <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${labelColor};">${label}</span>
    <span style="font-size:14px;font-weight:700;color:${valColor};">${value} ₽</span>
  </div>`;
}

function pdfTotal(label, value, dark) {
  const borderColor = dark ? "#f0ece4" : "#111";
  const valColor = dark ? "#f0ece4" : "#111";
  return `<div style="display:flex;justify-content:space-between;padding:12px 0 0;margin-top:6px;border-top:3px solid ${borderColor};">
    <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${valColor};">${label}</span>
    <span style="font-family:'Bebas Neue','Impact',sans-serif;font-size:28px;letter-spacing:1px;color:${valColor};">${value} ₽</span>
  </div>`;
}

const pdfBtn = getEl("exportPdf");
if (pdfBtn) pdfBtn.addEventListener("click", exportPdf);

// =========================================================
//  РЕЖИМ ПРЕЗЕНТАЦИИ
// =========================================================
const presBtn = getEl("presentationToggle");
if (presBtn) {
  presBtn.addEventListener("click", () => {
    const active = document.body.classList.toggle("presentation-mode");
    presBtn.textContent = active ? "▣ Редактирование" : "▣ Презентация";
  });
}

// =========================================================
//  ХУКИ: обновляем график/окупаемость/сценарии при пересчёте
// =========================================================
const origRun = run;
const ids2 = [
  "regime", "turnover", "acquiring", "fixedContrib", "empContribSum", "hasEmployees",
  "empCount", "empSalary", "patentFee", "extra", "extra15", "osnVat", "osnType",
  "splitMaster", "splitSalon", "includeOnePct",
  "platformFeeRate", "cashWithdrawal",
  "incomePatent", "incomeUsn", "mixedAfterFromSalonIncome"
];

// Wrap run with post-hooks
function runWithExtras() {
  // run() already called by original listeners
  if (!lastResult) return;
  renderChart(lastResult.diff.net);
  renderPayback();
  renderScenarios();
}

// Add extra listener to trigger chart/payback after calculation
ids2.forEach(id => {
  const el = getEl(id);
  if (el) {
    el.addEventListener("input", runWithExtras);
    el.addEventListener("change", runWithExtras);
  }
});

// Initial render
setTimeout(() => {
  if (lastResult) {
    renderChart(lastResult.diff.net);
    renderPayback();
    renderScenarios();
  }
}, 100);
