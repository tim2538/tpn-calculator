function calculateBMI() {
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  if (weight && height) {
    const bmi = weight / Math.pow(height / 100, 2);
    document.getElementById("bmi").value = bmi.toFixed(2);
  }
}

function calculateElectrolytes(method, na, k, cl, ca, mg, po4, useAcetate) {
  let electrolytes = {};
  let formulas = {};
  const cagluconate = ca / 0.5;
  formulas["10% Ca Gluconate"] = `${ca} ÷ 0.5 = ${cagluconate.toFixed(2)}`;
  const mgso4 = mg / 4;
  formulas["50% MgSO₄"] = `${mg} ÷ 4 = ${mgso4.toFixed(2)}`;
  if (method === "k2hpo4") {
    const k2hpo4 = po4 > 0 && k > 0 ? po4 / 0.5 : 0;
    formulas["8.71% K₂HPO₄"] = `${po4} ÷ 0.5 = ${k2hpo4.toFixed(2)}`;
    const glycophos = po4 > 0 && k2hpo4 === 0 ? po4 : 0;
    formulas["Glycophos"] =
      glycophos > 0 ? `${po4} ÷ 1 = ${glycophos.toFixed(2)}` : "0";
    let kcl, kac, nacl, naac;
    if (useAcetate) {
      const kcl_temp = k - k2hpo4;
      kcl = kcl_temp > 0 && cl > 0 ? kcl_temp / 2 : 0;
      kac = (k - k2hpo4 - kcl * 2) / 3;
      nacl = (cl - kcl * 2) / 0.5;
      naac = (na - nacl * 0.5 - glycophos * 2) / 3;
      formulas["15% KCl"] =
        `(${k} - ${k2hpo4.toFixed(2)}) ÷ 2 = ${kcl.toFixed(2)}`;
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
    const k2hpo4 = po4 > 0 && k > 0 ? po4 / 0.5 : 0;
    formulas["8.71% K₂HPO₄"] = `${po4} ÷ 0.5 = ${k2hpo4.toFixed(2)}`;
    const glycophos = po4 > 0 && k2hpo4 === 0 ? po4 : 0;
    formulas["Glycophos"] =
      glycophos > 0 ? `${po4} ÷ 1 = ${glycophos.toFixed(2)}` : "0";
    let kcl, kac, nacl, naac;
    if (useAcetate) {
      nacl = Math.min(na, cl) / 0.5;
      kcl = (cl - nacl * 0.5) / 2;
      kac = (k - k2hpo4 - (cl - nacl * 0.5)) / 3;
      naac = (na - nacl * 0.5 - glycophos * 2) / 3;
      formulas["3% NaCl"] =
        `min(${na}, ${cl}) ÷ 0.5 = ${nacl.toFixed(2)}`;
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
    .filter(([, value]) => value > 0)
    .map(
      ([name, value]) => `
      <div class="electrolyte-item">
        <div class="electrolyte-header">
          <span class="electrolyte-name">${name}</span>
          <span class="electrolyte-value">${value.toFixed(2)} mL</span>
        </div>
        <div class="electrolyte-formula ${allFormulasVisible ? "show" : ""}">
          <div class="formula-label">สูตร:</div>
          <div class="formula-calculation">${formulas[name]}</div>
        </div>
      </div>
    `,
    )
    .join("");
}

function computeClMax() {
  const na = parseFloat(document.getElementById("na").value) || 0;
  const k = parseFloat(document.getElementById("k").value) || 0;
  const po4 = parseFloat(document.getElementById("po4").value) || 0;
  const k2hpo4 = po4 > 0 && k > 0 ? po4 / 0.5 : 0;
  const glycophos = po4 > 0 && k2hpo4 === 0 ? po4 : 0;
  return na + k - k2hpo4 - glycophos * 2;
}
