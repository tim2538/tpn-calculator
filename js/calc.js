function calculateBMI() {
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  if (weight && height) {
    const bmi = weight / Math.pow(height / 100, 2);
    document.getElementById("bmi").value = bmi.toFixed(2);
  }
}

// PO4 จาก K₂HPO₄ ก่อน (ไม่เกิน K ที่สั่ง) ส่วนที่ขาดเติมจาก Glycophos (หัก Na ภายหลัง)
function computePhosphateSources(k, po4) {
  const k2hpo4Full = po4 / 0.5;
  const k2hpo4 = po4 > 0 && k > 0 ? Math.min(k2hpo4Full, k) : 0;
  const glycophos = po4 > 0 ? po4 - k2hpo4 * 0.5 : 0;
  const isSplit = k2hpo4 > 0 && glycophos > 0;
  return { k2hpo4, glycophos, isSplit };
}

function phosphateFormulas(formulas, k, po4, k2hpo4, glycophos, isSplit) {
  formulas["8.71% K₂HPO₄"] = isSplit
    ? `min(${po4} ÷ 0.5, K ${k}) = ${k2hpo4.toFixed(2)}`
    : `${po4} ÷ 0.5 = ${k2hpo4.toFixed(2)}`;
  formulas["Glycophos"] = isSplit
    ? `(${po4} - ${k2hpo4.toFixed(2)} × 0.5) ÷ 1 = ${glycophos.toFixed(2)}`
    : glycophos > 0
      ? `${po4} ÷ 1 = ${glycophos.toFixed(2)}`
      : "0";
}

function calculateElectrolytes(method, na, k, cl, ca, mg, po4, useAcetate) {
  let electrolytes = {};
  let formulas = {};
  const { k2hpo4, glycophos, isSplit } = computePhosphateSources(k, po4);
  phosphateFormulas(formulas, k, po4, k2hpo4, glycophos, isSplit);
  const cagluconate = ca / 0.5;
  formulas["10% Ca Gluconate"] = `${ca} ÷ 0.5 = ${cagluconate.toFixed(2)}`;
  const mgso4 = mg / 4;
  formulas["50% MgSO₄"] = `${mg} ÷ 4 = ${mgso4.toFixed(2)}`;
  if (method === "k2hpo4") {
    let kcl, kac, nacl, naac;
    if (useAcetate) {
      const kRemain = k - k2hpo4;
      // KCl ใช้ Cl ได้ไม่เกิน Cl ที่สั่ง ป้องกัน NaCl ติดลบ; K ที่เหลือไปลง KAc
      kcl = kRemain > 0 && cl > 0 ? Math.min(kRemain, cl) / 2 : 0;
      kac = (kRemain - kcl * 2) / 3;
      nacl = (cl - kcl * 2) / 0.5;
      naac = (na - nacl * 0.5 - glycophos * 2) / 3;
      formulas["15% KCl"] =
        `min(${k} - ${k2hpo4.toFixed(2)}, ${cl}) ÷ 2 = ${kcl.toFixed(2)}`;
      formulas["29.4% KAc"] =
        `(${k} - ${k2hpo4.toFixed(2)} - ${(kcl * 2).toFixed(2)}) ÷ 3 = ${kac.toFixed(2)}`;
      formulas["3% NaCl"] =
        `(${cl} - ${(kcl * 2).toFixed(2)}) ÷ 0.5 = ${nacl.toFixed(2)}`;
      formulas["24.6% NaAc"] =
        `(${na} - ${(nacl * 0.5).toFixed(2)} - ${(glycophos * 2).toFixed(2)}) ÷ 3 = ${naac.toFixed(2)}`;
    } else {
      kcl = (k - k2hpo4) / 2;
      kac = 0;
      nacl = (na - glycophos * 2) / 0.5;
      naac = 0;
      formulas["15% KCl"] =
        `(${k} - ${k2hpo4.toFixed(2)}) ÷ 2 = ${kcl.toFixed(2)}`;
      formulas["29.4% KAc"] = "ไม่ใช้ Acetate → 0";
      formulas["3% NaCl"] =
        `(${na} - ${(glycophos * 2).toFixed(2)}) ÷ 0.5 = ${nacl.toFixed(2)}`;
      formulas["24.6% NaAc"] = "ไม่ใช้ Acetate → 0";
    }
    electrolytes = {
      "8.71% K₂HPO₄": k2hpo4,
      "15% KCl": kcl,
      "29.4% KAc": kac,
      "3% NaCl": nacl,
      "24.6% NaAc": naac,
      Glycophos: glycophos,
      "10% Ca Gluconate": cagluconate,
      "50% MgSO₄": mgso4,
    };
  } else {
    let kcl, kac, nacl, naac;
    if (useAcetate) {
      nacl = Math.min(na, cl) / 0.5;
      kcl = (cl - nacl * 0.5) / 2;
      kac = (k - k2hpo4 - (cl - nacl * 0.5)) / 3;
      naac = (na - nacl * 0.5 - glycophos * 2) / 3;
      formulas["3% NaCl"] = `min(${na}, ${cl}) ÷ 0.5 = ${nacl.toFixed(2)}`;
      formulas["15% KCl"] =
        `(${cl} - ${(nacl * 0.5).toFixed(2)}) ÷ 2 = ${kcl.toFixed(2)}`;
      formulas["29.4% KAc"] =
        `(${k} - ${k2hpo4.toFixed(2)} - ${(cl - nacl * 0.5).toFixed(2)}) ÷ 3 = ${kac.toFixed(2)}`;
      formulas["24.6% NaAc"] =
        `(${na} - ${(nacl * 0.5).toFixed(2)} - ${(glycophos * 2).toFixed(2)}) ÷ 3 = ${naac.toFixed(2)}`;
    } else {
      nacl = na / 0.5;
      kcl = (k - k2hpo4) / 2;
      kac = 0;
      naac = 0;
      formulas["3% NaCl"] = `${na} ÷ 0.5 = ${nacl.toFixed(2)}`;
      formulas["15% KCl"] =
        `(${k} - ${k2hpo4.toFixed(2)}) ÷ 2 = ${kcl.toFixed(2)}`;
      formulas["29.4% KAc"] = "ไม่ใช้ Acetate → 0";
      formulas["24.6% NaAc"] = "ไม่ใช้ Acetate → 0";
    }
    electrolytes = {
      "3% NaCl": nacl,
      "8.71% K₂HPO₄": k2hpo4,
      "15% KCl": kcl,
      "29.4% KAc": kac,
      "24.6% NaAc": naac,
      Glycophos: glycophos,
      "10% Ca Gluconate": cagluconate,
      "50% MgSO₄": mgso4,
    };
  }
  return { electrolytes, formulas };
}

function renderElectrolyteHTML(electrolytes, formulas, allFormulasVisible) {
  return Object.entries(electrolytes)
    .filter(([, value]) => value !== 0)
    .map(([name, value]) => {
      const isNeg = value < 0;
      const valueClass = isNeg
        ? "electrolyte-value electrolyte-value--negative"
        : "electrolyte-value";
      const icon = isNeg
        ? `<i data-lucide="circle-alert" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;"></i>`
        : "";
      return `
      <div class="electrolyte-item">
        <div class="electrolyte-header">
          <span class="electrolyte-name">${name}</span>
          <span class="${valueClass}">${icon}${value.toFixed(2)} mL</span>
        </div>
        <div class="electrolyte-formula ${allFormulasVisible ? "show" : ""}">
          <div class="formula-label">สูตร:</div>
          <div class="formula-calculation">${formulas[name]}</div>
        </div>
      </div>
    `;
    })
    .join("");
}

// ตรวจ Ca–PO₄ 4 ข้อที่ปริมาตร volMl (Ca mEq, PO₄ mmol) และหาปริมาตรรวมขั้นต่ำที่ผ่านข้อ 1, 2, 4
// ข้อ 3 เป็นอัตราส่วน Ca/PO₄ เติมน้ำแล้วไม่เปลี่ยน
function checkCaPO4(ca, po4, volMl) {
  const volL = volMl / 1000;
  const caMeqL = ca / volL;
  const caMmolL = (ca * 0.5) / volL;
  const po4MeqL = (po4 * 2) / volL;
  const po4MmolL = po4 / volL;
  const checks = [
    {
      label: "Ca (mEq/L) + PO₄ (mEq/L) ≤ 45",
      detail: `${caMeqL.toFixed(2)} + ${po4MeqL.toFixed(2)} = ${(caMeqL + po4MeqL).toFixed(2)}`,
      pass: caMeqL + po4MeqL <= 45,
    },
    {
      label: "Ca (mEq/L) ≤ 15 และ PO₄ (mEq/L) ≤ 30",
      detail: `Ca = ${caMeqL.toFixed(2)}, PO₄ = ${po4MeqL.toFixed(2)}`,
      pass: caMeqL <= 15 && po4MeqL <= 30,
    },
    {
      label: "Ca (mmol/L) / PO₄ (mmol/L) < 1/2",
      detail: `${caMmolL.toFixed(2)} / ${po4MmolL.toFixed(2)} = ${po4MmolL > 0 ? (caMmolL / po4MmolL).toFixed(3) : "N/A"}`,
      pass: po4MmolL > 0 ? caMmolL / po4MmolL < 0.5 : true,
    },
    {
      label: "Ca (mmol/L) × P (mmol/L) ≤ 75",
      detail: `${caMmolL.toFixed(2)} × ${po4MmolL.toFixed(2)} = ${(caMmolL * po4MmolL).toFixed(2)}`,
      pass: caMmolL * po4MmolL <= 75,
    },
  ];
  const volumeChecksPass = checks[0].pass && checks[1].pass && checks[3].pass;
  const reqVolume =
    Math.max(
      (ca + po4 * 2) / 45,
      ca / 15,
      (po4 * 2) / 30,
      Math.sqrt((ca * 0.5 * po4) / 75),
    ) * 1000;
  return {
    checks,
    allPass: checks.every((c) => c.pass),
    ratioPass: checks[2].pass,
    // ปัดขึ้นเป็นจำนวนเต็ม mL เพื่อให้กรอกในหน้าพิมพ์ได้ตรงตัว
    targetVolume: volumeChecksPass ? null : Math.ceil(reqVolume),
  };
}

// opts: { title, res, vol, dilutionWater, scope, overLimitText, adviceNote }
// adviceNote แทนคำแนะนำ SWI (ใช้เมื่อแบ่งถุงแล้ว ให้ดูคำแนะนำรายถุง)
function renderCaPO4Block(opts) {
  const { title, res, vol, dilutionWater, scope, overLimitText, adviceNote } = opts;
  const checksHTML = res.checks
    .map(
      (c) => `
        <div class="compat-check">
          <span>${c.label}<br><small style="color:var(--text-secondary)">${c.detail}</small></span>
          <span class="${c.pass ? "compat-pass" : "compat-fail"}">${c.pass ? "✓ ผ่าน" : "✗ ไม่ผ่าน"}</span>
        </div>`,
    )
    .join("");
  const statusHTML = res.allPass
    ? `<div class="alert alert-success" style="margin-top:12px;"><i data-lucide="check-circle" style="width:20px;height:20px;"></i><div><strong>ปลอดภัย:</strong> Ca–PO₄ ${scope} ผ่านเกณฑ์ทุกข้อ</div></div>`
    : `<div class="alert alert-danger" style="margin-top:12px;"><i data-lucide="circle-alert" style="width:20px;height:20px;"></i><div><strong>อันตราย!</strong> Ca–PO₄ ${scope} ไม่ผ่านเกณฑ์ — อาจเกิด Calcium Phosphate Precipitation</div></div>`;
  let adviceLines = [];
  if (!res.allPass && adviceNote) {
    adviceLines = [adviceNote];
  } else if (!res.allPass) {
    if (res.targetVolume) {
      const addWater = res.targetVolume - vol;
      const passText = res.ratioPass ? "ผ่านครบ 4 ข้อ" : "ผ่านข้อ 1, 2, 4";
      adviceLines.push(
        dilutionWater > 0
          ? `เติม SWI <strong>เพิ่มอีก ${addWater.toFixed(1)} mL</strong> จากน้ำที่เติมเจือจาง Osm แล้ว ${dilutionWater.toFixed(1)} mL (รวมน้ำ ${(dilutionWater + addWater).toFixed(1)} mL) → ปริมาตรรวม <strong>${res.targetVolume} mL</strong> จึง${passText}`
          : `เติม SWI <strong>${addWater.toFixed(1)} mL</strong> → ปริมาตรรวม <strong>${res.targetVolume} mL</strong> จึง${passText}`,
        `ปรับได้ที่ช่อง "ปริมาตรรวม" ตอนพิมพ์ใบสั่งยา (ไม่เปลี่ยนผลคำนวณหลัก)`,
      );
      if (res.targetVolume > 1200) {
        adviceLines.push(`<strong>คำเตือน:</strong> ${overLimitText}`);
      }
    }
    if (!res.ratioPass) {
      adviceLines.push(
        "ข้อ 3 (Ca/PO₄) ไม่ผ่าน — เติมน้ำไม่ช่วยเพราะเป็นอัตราส่วน ต้องปรับปริมาณ Ca หรือ PO₄",
      );
    }
  }
  const adviceHTML = adviceLines.length
    ? `<div class="alert alert-info" style="margin-top:8px;"><i data-lucide="lightbulb" style="width:20px;height:20px;"></i><div><strong>คำแนะนำ:</strong> ${adviceLines.join("<br>")}</div></div>`
    : "";
  return `
    <div style="margin-top:12px;">
      <h4 style="margin:0 0 6px;">${title} — ${vol.toFixed(1)} mL${dilutionWater > 0 ? ` (รวมน้ำเจือจาง Osm ${dilutionWater.toFixed(1)} mL)` : ""}</h4>
      ${checksHTML}
      ${statusHTML}
      ${adviceHTML}
    </div>`;
}

function computeClMax() {
  const na = parseFloat(document.getElementById("na").value) || 0;
  const k = parseFloat(document.getElementById("k").value) || 0;
  const po4 = parseFloat(document.getElementById("po4").value) || 0;
  const { k2hpo4, glycophos } = computePhosphateSources(k, po4);
  return na + k - k2hpo4 - glycophos * 2;
}
