let currentPrintMethod = "1";

function printReport() {
  if (!window.lastResult) return;
  currentPrintMethod = "1";
  document.getElementById("methodBtn1").classList.add("active");
  document.getElementById("methodBtn2").classList.remove("active");
  renderVolumeInputs();
  const canvas = document.getElementById("previewCanvas");
  drawExportCanvas(canvas, currentPrintMethod);
  document.getElementById("printPreviewModal").classList.add("active");
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
  renderVolumeInputs();
  drawExportCanvas(document.getElementById("previewCanvas"), method);
}

// ข้อมูลของฉลากแต่ละใบ (bagNum = null สำหรับถุงเดียว, "1" / "2" เมื่อแบ่งถุง)
function getLabelParts(r, method, bagNum) {
  const key = method + "-" + (bagNum || "single");
  if (!bagNum) {
    return {
      key,
      bagData: null,
      bagTitle: null,
      summaryData: { protein: r.protein, dextrose: r.dextrose, na: r.na, k: r.k, cl: r.cl, ca: r.ca, mg: r.mg, po4: r.po4 },
      osm: r.osmolarity,
      baseVolume: method === "1" ? r.baseVolume1 : r.baseVolume2,
      minVolume: method === "1" ? r.minVolume1 : r.minVolume2,
    };
  }
  const s = r.split;
  const bagData = bagNum === "1"
    ? (method === "1" ? s.bagA1 : s.bagA2)
    : (method === "1" ? s.bagB1 : s.bagB2);
  const summaryData = bagNum === "1"
    ? { protein: s.proteinA, dextrose: s.dextroseA, na: s.naA, k: s.kA, cl: s.clA, ca: s.caA, mg: s.mgA, po4: s.po4A }
    : { protein: s.proteinB, dextrose: s.dextroseB, na: s.naB, k: s.kB, cl: s.clB, ca: s.caB, mg: s.mgB, po4: s.po4B };
  return {
    key,
    bagData,
    bagTitle: "ถุงที่ " + bagNum,
    summaryData,
    osm: bagData.osm,
    baseVolume: bagData.baseVolume,
    minVolume: bagData.volume,
  };
}

function getLabelBagNums(r) {
  return r.needsSplit && r.split ? ["1", "2"] : [null];
}

// ปริมาตรสุดท้าย = max(ค่าที่กรอกเอง, ค่าขั้นต่ำจากสูตร); ส่วนที่เกิน V_base เติมเป็น Sterile water
function getBagFigures(r, parts) {
  const custom = (r.customVolumes || {})[parts.key];
  const finalVolume = custom != null ? Math.max(custom, parts.minVolume) : parts.minVolume;
  return {
    finalVolume,
    sterileWater: Math.max(finalVolume - parts.baseVolume, 0),
    flowRate: finalVolume / r.infusionDuration,
    finalOsm: finalVolume > 0 ? (parts.osm * 1000) / finalVolume : 0,
  };
}

function volumeHintText(parts, fig, belowMin) {
  const prefix = belowMin
    ? "ต่ำกว่าขั้นต่ำ — ใช้ " + parts.minVolume.toFixed(1) + " mL"
    : "ขั้นต่ำ " + parts.minVolume.toFixed(1) + " mL";
  return prefix + " · น้ำ " + fig.sterileWater.toFixed(1) + " mL · " + fig.finalOsm.toFixed(0) + " mOsm/L";
}

function renderVolumeInputs() {
  const r = window.lastResult;
  const container = document.getElementById("printVolumeInputs");
  if (!r || !container) return;
  r.customVolumes = r.customVolumes || {};
  container.innerHTML = getLabelBagNums(r)
    .map(function (bagNum) {
      const parts = getLabelParts(r, currentPrintMethod, bagNum);
      const fig = getBagFigures(r, parts);
      const custom = r.customVolumes[parts.key];
      const value = custom != null ? custom : parts.minVolume.toFixed(1);
      const label = bagNum ? "ปริมาตรรวม ถุงที่ " + bagNum + " (mL)" : "ปริมาตรรวม (mL)";
      return `
        <div class="form-group">
          <label for="customVol-${parts.key}">${label}</label>
          <input type="number" id="customVol-${parts.key}" inputmode="decimal" step="0.1"
            min="${parts.minVolume.toFixed(1)}" value="${value}"
            oninput="onCustomVolumeInput('${bagNum || ""}', this)"
            onchange="onCustomVolumeChange('${bagNum || ""}', this)" />
          <small id="customVolHint-${parts.key}" class="helper-text">${volumeHintText(parts, fig, false)}</small>
        </div>`;
    })
    .join("");
}

function onCustomVolumeInput(bagNum, el) {
  const r = window.lastResult;
  if (!r) return;
  const parts = getLabelParts(r, currentPrintMethod, bagNum || null);
  const val = parseFloat(el.value);
  // ยอมให้ต่ำกว่าได้ 0.05 เพราะค่าขั้นต่ำแสดงเป็นทศนิยม 1 ตำแหน่ง
  const belowMin = !isNaN(val) && val < parts.minVolume - 0.05;
  if (isNaN(val) || belowMin) {
    delete r.customVolumes[parts.key];
  } else {
    r.customVolumes[parts.key] = val;
  }
  const hint = document.getElementById("customVolHint-" + parts.key);
  hint.textContent = volumeHintText(parts, getBagFigures(r, parts), belowMin);
  hint.className = belowMin ? "helper-text warn" : "helper-text";
  drawExportCanvas(document.getElementById("previewCanvas"), currentPrintMethod);
}

function onCustomVolumeChange(bagNum, el) {
  const r = window.lastResult;
  if (!r) return;
  const parts = getLabelParts(r, currentPrintMethod, bagNum || null);
  if (r.customVolumes[parts.key] == null) {
    el.value = parts.minVolume.toFixed(1);
    onCustomVolumeInput(bagNum, el);
  }
}

function closePrintModal() {
  document.getElementById("printPreviewModal").classList.remove("active");
  document.body.style.overflow = "";
}

function printCanvas() {
  const r = window.lastResult;

  function doPrint(canvases) {
    const existing = document.getElementById("print-frame");
    if (existing) existing.parentNode.removeChild(existing);

    const frame = document.createElement("div");
    frame.id = "print-frame";
    frame.style.display = "none";
    document.body.appendChild(frame);

    var loaded = 0;
    var total = canvases.length;

    function onAllLoaded() {
      // Show/hide is handled entirely by the @media print CSS rules — no JS
      // display-swapping or teardown timer, which on mobile could remove the
      // content before the OS rasterized the final output (blank pages).
      window.focus();
      window.print();
    }

    function onImgReady() {
      loaded += 1;
      if (loaded === total) onAllLoaded();
    }

    canvases.forEach(function (canvas) {
      var url = canvas.toDataURL("image/png");
      var img = document.createElement("img");
      img.onload = onImgReady;
      img.src = url;
      frame.appendChild(img);
      // data: URLs may decode synchronously — img.complete already true
      if (img.complete) {
        img.onload = null;
        onImgReady();
      }
    });
  }

  if (r && r.needsSplit && r.split) {
    const method = currentPrintMethod;
    const canvases = ["1", "2"].map(function (bagNum) {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = 900;
      offCanvas.height = 1200;
      const ctx = offCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 900, 1200);
      drawLabel(ctx, 900, 0, getLabelParts(r, method, bagNum), method, r);
      return offCanvas;
    });
    doPrint(canvases);
  } else {
    const canvas = document.getElementById("previewCanvas");
    doPrint([canvas]);
  }
}

function downloadPNG() {
  const r = window.lastResult;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const idStr = r.patientId || "report";

  if (r.needsSplit && r.split) {
    // Render and download each bag as a separate image
    ["1", "2"].forEach((bagNum) => {
      const offCanvas = document.createElement("canvas");
      const method = currentPrintMethod;
      offCanvas.width = 900;
      offCanvas.height = 1200;
      const ctx = offCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 900, 1200);
      drawLabel(ctx, 900, 0, getLabelParts(r, method, bagNum), method, r);

      offCanvas.toBlob(function (blob) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "TPN_" + idStr + "_Bag" + bagNum + "_" + dateStr + ".png";
        a.click();
        URL.revokeObjectURL(a.href);
      });
    });
  } else {
    const canvas = document.getElementById("previewCanvas");
    canvas.toBlob(function (blob) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "TPN_" + idStr + "_" + dateStr + ".png";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
}

function drawLabel(ctx, W, yOff, parts, method, r) {
  const { bagData, summaryData, bagTitle } = parts;
  const FONT = "Sarabun, sans-serif";
  const BLACK = "#1a1a1a";
  const GREY = "#888888";

  const elec = bagData ? bagData.electrolytes : (method === "1" ? r.electrolytes1 : r.electrolytes2);
  const proteinSolution = bagData ? bagData.proteinSolution : r.proteinSolution;
  const dextroseSolution = bagData ? bagData.dextroseSolution : r.dextroseSolution;
  const fig = getBagFigures(r, parts);
  const sterileWater = fig.sterileWater;
  const flowRate = fig.flowRate;

  const protein = summaryData.protein;
  const dextrose = summaryData.dextrose;
  const na = summaryData.na;
  const k = summaryData.k;
  const cl = summaryData.cl;
  const ca = summaryData.ca;
  const mg = summaryData.mg;
  const po4 = summaryData.po4;

  function rowLine(label, value, unit, y, leftX, valX) {
    ctx.textAlign = "left";
    ctx.fillStyle = BLACK;
    ctx.font = "18px " + FONT;
    ctx.fillText(label, leftX, y);
    ctx.textAlign = "right";
    ctx.font = "600 18px " + FONT;
    ctx.fillText(
      (typeof value === "number" ? value.toFixed(2) : value) + "  " + unit,
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
  ctx.fillText("HN  " + hn + "      ชื่อ-สกุล  " + name, 50, yOff + 70);
  ctx.fillText("BW  " + r.weight + "  kg", 50, yOff + 108);

  // ── Access type ──
  const isCentral = r.venousAccess === "central";
  const accessLabel = isCentral
    ? "****** Central Line Use Only ******"
    : "Peripheral Line Use";
  ctx.textAlign = "center";
  ctx.font = "700 26px " + FONT;
  ctx.fillStyle = BLACK;
  ctx.fillText(accessLabel, W / 2, yOff + 152);

  // ── Bag title (split only) ──
  let contentYShift = 0;
  if (bagTitle) {
    ctx.textAlign = "center";
    ctx.font = "700 32px " + FONT;
    ctx.fillStyle = BLACK;
    ctx.fillText(bagTitle, W / 2, yOff + 192);
    contentYShift = 40;
  }

  // ── Horizontal rule ──
  const hrY = yOff + 172 + contentYShift;
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, hrY);
  ctx.lineTo(W - 50, hrY);
  ctx.stroke();

  // ── Vertical divider ──
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(448, hrY);
  ctx.lineTo(448, yOff + 1155);
  ctx.stroke();

  // ─── LEFT COLUMN ───
  const LX = 50,
    LVAL = 420;
  const base = hrY + 24;

  ctx.textAlign = "left";
  ctx.font = "700 20px " + FONT;
  ctx.fillStyle = BLACK;
  ctx.fillText("Ingredients:", LX, base);

  const proteinLabel =
    r.proteinProduct === "amiparen"
      ? "Protein as Amiparen"
      : "Protein as Aminoplasmal";

  rowLine("Sterile water", sterileWater, "ml", base + 46, LX, LVAL);
  rowLine("50% Glucose", dextroseSolution, "ml", base + 86, LX, LVAL);
  rowLine(proteinLabel, proteinSolution, "ml", base + 126, LX, LVAL);

  const isBag2 = bagTitle === "ถุงที่ 2";
  const elecRows = [
    ["8.71% K₂HPO₄", elec["8.71% K₂HPO₄"] ?? 0, "ml", base + 194],
    ["Glycophos", elec["Glycophos"] ?? 0, "ml", base + 234],
    ["15% KCl", elec["15% KCl"] ?? 0, "ml", base + 274],
    ["29.4% KAc", elec["29.4% KAc"] ?? 0, "ml", base + 314],
    ["3% NaCl", elec["3% NaCl"] ?? 0, "ml", base + 354],
    ["24.6% NaAc", elec["24.6% NaAc"] ?? 0, "ml", base + 394],
    ["50% MgSO₄", elec["50% MgSO₄"] ?? 0, "ml", base + 434],
    ...(!isBag2 ? [["Addamel", r.addamelVol, "ml", base + 474]] : []),
    ["10% Ca gluconate", elec["10% Ca Gluconate"] ?? 0, "ml", isBag2 ? base + 474 : base + 514],
  ];
  elecRows.forEach(([lbl, val, unit, y]) => rowLine(lbl, val, unit, y, LX, LVAL));

  if (!isBag2) {
    ctx.textAlign = "left";
    ctx.font = "700 20px " + FONT;
    ctx.fillStyle = BLACK;
    ctx.fillText("Add before administration", LX, base + 572);

    const addRows = [
      ["Soluvit", r.soluvitVol, "ml", base + 622],
      ["Cernevit", r.cernevitVol, "ml", base + 662],
      ["B complex", r.bcomplexVol, "ml", base + 702],
    ];
    addRows.forEach(([lbl, val, unit, y]) => rowLine(lbl, val, unit, y, LX, LVAL));
  }

  // ─── RIGHT COLUMN ───
  const RX = 468,
    RVAL = 858;

  ctx.textAlign = "left";
  ctx.font = "700 20px " + FONT;
  ctx.fillStyle = BLACK;
  ctx.fillText("Summary:", RX, base);

  const summaryRows = [
    ["Protein", protein, "g", base + 46],
    ["Glucose", dextrose, "g", base + 86],
    ["Na", na, "mEq", base + 126],
    ["K", k, "mEq", base + 166],
    ["Cl", cl, "mEq", base + 206],
    ["Ca", ca, "mEq", base + 246],
    ["Mg", mg, "mEq", base + 286],
    ["PO₄", po4, "mmol", base + 326],
  ];
  summaryRows.forEach(([lbl, val, unit, y]) => rowLine(lbl, val, unit, y, RX, RVAL));

  // ── Rate ──
  if (flowRate != null) {
    ctx.textAlign = "left";
    ctx.font = "600 20px " + FONT;
    ctx.fillStyle = BLACK;
    ctx.fillText("Rate", RX, base + 376);
    ctx.textAlign = "right";
    ctx.font = "700 36px " + FONT;
    ctx.fillText(flowRate.toFixed(1), RVAL - 56, base + 424);
    ctx.textAlign = "left";
    ctx.font = "18px " + FONT;
    ctx.fillStyle = GREY;
    ctx.fillText("ml/hr", RVAL - 50, base + 424);
  }

  // ── Final volume & osmolarity ──
  rowLine("Total volume", fig.finalVolume.toFixed(1), "ml", base + 480, RX, RVAL);
  rowLine("Osmolarity", fig.finalOsm.toFixed(0), "mOsm/L", base + 520, RX, RVAL);

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
  ctx.fillText(
    "TPN Calculator  |  " + dateLabel + "  " + timeLabel,
    W / 2,
    yOff + 1175,
  );
}

function drawExportCanvas(canvas, method) {
  const r = window.lastResult;
  if (!r) return;
  const W = 900;

  if (r.needsSplit && r.split) {
    const GAP_TOP = 1200;
    const GAP_H = 24;
    const BAG2_Y = GAP_TOP + GAP_H;
    const H = BAG2_Y + 1200;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    drawLabel(ctx, W, 0, getLabelParts(r, method, "1"), method, r);

    // Page-break spacer using --background CSS variable
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue("--background").trim() || "#f3f4f6";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, GAP_TOP, W, GAP_H);

    drawLabel(ctx, W, BAG2_Y, getLabelParts(r, method, "2"), method, r);
  } else {
    const H = 1200;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    drawLabel(ctx, W, 0, getLabelParts(r, method, null), method, r);
  }
}

function downloadQRCode() {
  const get = (id) => document.getElementById(id);
  const payload = JSON.stringify({
    id: get("patientId").value.trim(),
    name: get("patientName").value.trim(),
    weight: parseFloat(get("weight").value) || 0,
    height: parseFloat(get("height").value) || 0,
    clinicalStatus: get("clinicalStatus").value,
    venousAccess: get("venousAccess").value,
    protein: parseFloat(get("protein").value) || 0,
    proteinProduct: get("proteinProduct").value,
    dextrose: parseFloat(get("dextrose").value) || 0,
    infusionDuration: parseFloat(get("infusionDuration").value) || 0,
    lipid: parseFloat(get("lipid").value) || 0,
    ivleHours: parseFloat(get("ivleHours").value) || 0,
    acetateMode: get("acetateMode").value,
    na: parseFloat(get("na").value) || 0,
    k: parseFloat(get("k").value) || 0,
    cl: parseFloat(get("cl").value) || 0,
    ca: parseFloat(get("ca").value) || 0,
    mg: parseFloat(get("mg").value) || 0,
    po4: parseFloat(get("po4").value) || 0,
    cernevit: get("cernevit").checked,
    soluvit: get("soluvit").checked,
    bComplex: get("bComplex").checked,
    addamel: get("addamel").checked,
  });

  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, payload, { width: 400, margin: 2 }, function (err) {
    if (err) {
      alert("ไม่สามารถสร้าง QR Code ได้");
      return;
    }
    canvas.toBlob(function (blob) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const idStr = get("patientId").value.trim() || "patient";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "QR_" + idStr + "_" + dateStr + ".png";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  });
}
