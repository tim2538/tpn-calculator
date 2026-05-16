let currentPrintMethod = "1";

function printReport() {
  if (!window.lastResult) return;
  currentPrintMethod = "1";
  document.getElementById("methodBtn1").classList.add("active");
  document.getElementById("methodBtn2").classList.remove("active");
  const canvas = document.getElementById("previewCanvas");
  drawExportCanvas(canvas, currentPrintMethod);
  document
    .getElementById("printPreviewModal")
    .classList.add("active");
  document.body.style.overflow = "hidden";
  lucide.createIcons();
}

function selectPrintMethod(method) {
  currentPrintMethod = method;
  document
    .getElementById("methodBtn1")
    .classList.toggle("active", method === "1");
  document
    .getElementById("methodBtn2")
    .classList.toggle("active", method === "2");
  drawExportCanvas(document.getElementById("previewCanvas"), method);
}

function closePrintModal() {
  document
    .getElementById("printPreviewModal")
    .classList.remove("active");
  document.body.style.overflow = "";
}

function downloadPNG() {
  const canvas = document.getElementById("previewCanvas");
  canvas.toBlob(function (blob) {
    const r = window.lastResult;
    const dateStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    const idStr = r.patientId || "report";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "TPN_" + idStr + "_" + dateStr + ".png";
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

function drawExportCanvas(canvas, method) {
  const r = window.lastResult;
  if (!r) return;
  const elec = method === "1" ? r.electrolytes1 : r.electrolytes2;
  const ctx = canvas.getContext("2d");
  const W = 900,
    H = 1200;
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const FONT = "Sarabun, sans-serif";
  const BLACK = "#1a1a1a";
  const GREY = "#888888";

  function rowLine(label, value, unit, y, leftX, valX) {
    ctx.textAlign = "left";
    ctx.fillStyle = BLACK;
    ctx.font = "18px " + FONT;
    ctx.fillText(label, leftX, y);
    ctx.textAlign = "right";
    ctx.font = "600 18px " + FONT;
    ctx.fillText(
      (typeof value === "number" ? value.toFixed(2) : value) +
        "  " +
        unit,
      valX,
      y,
    );
  }

  // ── Header ──
  ctx.textAlign = "left";
  ctx.font = "600 22px " + FONT;
  ctx.fillStyle = BLACK;
  const hn = r.patientId || "—";
  const name = r.patientName || "—";
  ctx.fillText("HN  " + hn + "      ชื่อ-สกุล  " + name, 50, 70);
  ctx.fillText("BW  " + r.weight + "  kg", 50, 108);

  // ── Access type (selected only, large) ──
  const isCentral = r.venousAccess === "central";
  const accessLabel = isCentral
    ? "****** Central Line Use Only ******"
    : "Peripheral Line Use";
  ctx.textAlign = "center";
  ctx.font = "700 26px " + FONT;
  ctx.fillStyle = BLACK;
  ctx.fillText(accessLabel, W / 2, 152);

  // ── Horizontal rule ──
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 172);
  ctx.lineTo(W - 50, 172);
  ctx.stroke();

  // ── Vertical divider ──
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(448, 172);
  ctx.lineTo(448, 1155);
  ctx.stroke();

  // ─── LEFT COLUMN ───
  const LX = 50,
    LVAL = 420;

  ctx.textAlign = "left";
  ctx.font = "700 20px " + FONT;
  ctx.fillStyle = BLACK;
  ctx.fillText("Ingredients:", LX, 196);

  const proteinLabel =
    r.proteinProduct === "amiparen"
      ? "Protein as Amiparen"
      : "Protein as Aminoplasmal";

  const leftRows = [
    ["Sterile water", r.sterileWater, "ml", 242],
    ["50% Glucose", r.dextroseSolution, "ml", 282],
    [proteinLabel, r.proteinSolution, "ml", 322],
  ];
  leftRows.forEach(([lbl, val, unit, y]) =>
    rowLine(lbl, val, unit, y, LX, LVAL),
  );

  const elecRows = [
    ["8.71% K₂HPO₄", elec["8.71% K₂HPO₄"] ?? 0, "ml", 390],
    ["Glycophos", elec["Glycophos"] ?? 0, "ml", 430],
    ["15% KCl", elec["15% KCl"] ?? 0, "ml", 470],
    ["3% NaCl", elec["3% NaCl"] ?? 0, "ml", 510],
    ["24.6% Na Ac", elec["24.6% NaAc"] ?? 0, "ml", 550],
    ["50% MgSO₄", elec["50% MgSO₄"] ?? 0, "ml", 590],
    ["Addamel", r.addamelVol, "ml", 630],
    ["10% Ca gluconate", elec["10% Ca Gluconate"] ?? 0, "ml", 670],
  ];
  elecRows.forEach(([lbl, val, unit, y]) =>
    rowLine(lbl, val, unit, y, LX, LVAL),
  );

  ctx.textAlign = "left";
  ctx.font = "700 20px " + FONT;
  ctx.fillStyle = BLACK;
  ctx.fillText("Add before administration", LX, 728);

  const addRows = [
    ["Soluvit", r.soluvitVol, "ml", 778],
    ["Cernevit", r.cernevitVol, "ml", 818],
    ["B complex", r.bcomplexVol, "ml", 858],
  ];
  addRows.forEach(([lbl, val, unit, y]) =>
    rowLine(lbl, val, unit, y, LX, LVAL),
  );

  // ─── RIGHT COLUMN ───
  const RX = 468,
    RVAL = 858;

  ctx.textAlign = "left";
  ctx.font = "700 20px " + FONT;
  ctx.fillStyle = BLACK;
  ctx.fillText("Summary:", RX, 196);

  const summaryRows = [
    ["Protein", r.protein, "g", 242],
    ["Glucose", r.dextrose, "g", 282],
    ["Na", r.na, "mEq", 322],
    ["K", r.k, "mEq", 362],
    ["Cl", r.cl, "mEq", 402],
    ["Ca", r.ca, "mEq", 442],
    ["Mg", r.mg, "mEq", 482],
    ["PO₄", r.po4, "mmol", 522],
  ];
  summaryRows.forEach(([lbl, val, unit, y]) =>
    rowLine(lbl, val, unit, y, RX, RVAL),
  );

  // ── Rate (right column, below summary) ──
  const rate = method === "1" ? r.flowRate1 : r.flowRate2;
  if (rate != null) {
    ctx.textAlign = "left";
    ctx.font = "600 20px " + FONT;
    ctx.fillStyle = BLACK;
    ctx.fillText("Rate", RX, 572);
    ctx.textAlign = "right";
    ctx.font = "700 36px " + FONT;
    ctx.fillText(rate.toFixed(1), RVAL - 56, 620);
    ctx.textAlign = "left";
    ctx.font = "18px " + FONT;
    ctx.fillStyle = GREY;
    ctx.fillText("ml/hr", RVAL - 50, 620);
  }

  // ── Footer ──
  const now = new Date();
  const dateLabel = now.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeLabel = now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  ctx.textAlign = "center";
  ctx.font = "13px " + FONT;
  ctx.fillStyle = GREY;
  ctx.fillText("TPN Calculator  |  " + dateLabel + "  " + timeLabel, W / 2, 1175);
}
