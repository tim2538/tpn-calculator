let allFormulasVisible = false;

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  const sunIcon = document.getElementById("theme-icon-sun");
  const moonIcon = document.getElementById("theme-icon-moon");
  if (newTheme === "dark") {
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
  } else {
    sunIcon.style.display = "block";
    moonIcon.style.display = "none";
  }
  lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", function () {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  const sunIcon = document.getElementById("theme-icon-sun");
  const moonIcon = document.getElementById("theme-icon-moon");
  if (savedTheme === "dark") {
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
  }
  lucide.createIcons();
  const requiredFields = document.querySelectorAll(".required-field");
  requiredFields.forEach((field) => {
    field.addEventListener("input", function () {
      if (field.tagName === "INPUT") {
        const allowZero = this.dataset.allowZero === "true";
        const val = parseFloat(this.value);
        const filled = this.value !== "" && !isNaN(val);
        if (filled && val >= 0 && (allowZero || val !== 0)) {
          this.classList.remove("input-error");
        }
      }
    });
    field.addEventListener("change", function () {
      if (field.tagName === "SELECT") {
        if (this.value && this.value !== "") {
          this.classList.remove("input-error");
        }
      }
    });
  });
});

document.getElementById("weight").addEventListener("input", calculateBMI);
document.getElementById("height").addEventListener("input", calculateBMI);

function handleCalculate() {
  const requiredFields = document.querySelectorAll(".required-field");
  let firstEmptyField = null;
  let hasError = false;
  for (let field of requiredFields) {
    let isEmpty = false;
    if (field.tagName === "SELECT") {
      if (!field.value || field.value === "") {
        isEmpty = true;
      }
    } else if (field.tagName === "INPUT") {
      const allowZero = field.dataset.allowZero === "true";
      const val = parseFloat(field.value);
      if (!field.value || field.value === "" || isNaN(val)) {
        isEmpty = true;
      } else if (!allowZero && val === 0) {
        isEmpty = true;
      } else if (val < 0) {
        isEmpty = true;
      }
    }
    if (isEmpty) {
      if (!firstEmptyField) {
        firstEmptyField = field;
      }
      field.classList.add("input-error");
      hasError = true;
    } else {
      field.classList.remove("input-error");
    }
  }

  // If lipid = 0, ivleHours is not meaningful — clear its error
  const lipidVal = parseFloat(document.getElementById("lipid").value);
  if (lipidVal === 0) {
    document.getElementById("ivleHours").classList.remove("input-error");
    if (firstEmptyField && firstEmptyField.id === "ivleHours") {
      hasError = document.querySelectorAll(".input-error").length > 0;
      firstEmptyField = document.querySelector(".input-error");
    }
  }

  // Extra range checks
  const infusionVal = parseFloat(
    document.getElementById("infusionDuration").value,
  );
  if (!isNaN(infusionVal) && infusionVal > 24) {
    document.getElementById("infusionDuration").classList.add("input-error");
    if (!firstEmptyField)
      firstEmptyField = document.getElementById("infusionDuration");
    hasError = true;
  }
  const ivleHoursVal = parseFloat(document.getElementById("ivleHours").value);
  if (!isNaN(ivleHoursVal) && ivleHoursVal > 24) {
    document.getElementById("ivleHours").classList.add("input-error");
    if (!firstEmptyField)
      firstEmptyField = document.getElementById("ivleHours");
    hasError = true;
  }

  if (hasError && firstEmptyField) {
    firstEmptyField.focus();
    firstEmptyField.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return;
  }
  calculate();
}

document.addEventListener("DOMContentLoaded", function () {
  const inputs = document.querySelectorAll("input:not([readonly]), select");
  inputs.forEach((input) => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const enterkeyhint = this.getAttribute("enterkeyhint");
        if (enterkeyhint === "done") {
          this.blur();
          handleCalculate();
        } else {
          const nextInput = getNextInput(this);
          if (nextInput) {
            nextInput.focus();
            if (nextInput.tagName === "INPUT" && nextInput.type === "number") {
              nextInput.select();
            }
          }
        }
      }
    });
    if (input.tagName === "SELECT") {
      input.addEventListener("change", function () {
        setTimeout(() => {
          const nextInput = getNextInput(this);
          if (nextInput) {
            nextInput.focus();
          }
        }, 100);
      });
    }
    input.addEventListener("focus", function () {
      setTimeout(() => {
        this.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    });
  });
});

function toggleAllFormulas() {
  allFormulasVisible = !allFormulasVisible;
  const text = document.getElementById("toggleAllText");
  document.querySelectorAll(".formula-details").forEach((f) => {
    if (allFormulasVisible) {
      f.classList.add("show");
    } else {
      f.classList.remove("show");
    }
  });
  document.querySelectorAll(".electrolyte-formula").forEach((f) => {
    if (allFormulasVisible) {
      f.classList.add("show");
    } else {
      f.classList.remove("show");
    }
  });
  text.textContent = allFormulasVisible ? "ซ่อนสูตร" : "แสดงสูตร";
}

function resetForm() {
  document.getElementById("patientId").value = "";
  document.getElementById("patientName").value = "";
  document.getElementById("weight").value = "";
  document.getElementById("height").value = "";
  document.getElementById("bmi").value = "";
  document.getElementById("clinicalStatus").value = "";
  document.getElementById("venousAccess").value = "";
  document.getElementById("protein").value = "";
  document.getElementById("proteinProduct").value = "";
  document.getElementById("dextrose").value = "";
  document.getElementById("lipid").value = "";
  document.getElementById("ivleHours").value = "";
  document.getElementById("infusionDuration").value = "";
  document.getElementById("na").value = "";
  document.getElementById("k").value = "";
  document.getElementById("cl").value = "";
  document.getElementById("ca").value = "";
  document.getElementById("mg").value = "";
  document.getElementById("po4").value = "";
  document.getElementById("resultsSection").classList.add("hidden");
  document.getElementById("acetateMode").value = "yes";
  onAcetateModeChange();
  document.getElementById("clAuto").value = "";
  document.getElementById("clMaxHint").textContent = "";
  document.getElementById("cl").removeAttribute("max");
  document.getElementById("dilutionCard").classList.add("hidden");
  document.getElementById("extraWaterCard").classList.add("hidden");
  document.querySelectorAll(".input-error").forEach((el) => {
    el.classList.remove("input-error");
  });
  document.getElementById("cernevit").checked = false;
  document.getElementById("soluvit").checked = false;
  document.getElementById("bComplex").checked = false;
  document.getElementById("addamel").checked = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("printBtn").disabled = true;
  document.getElementById("ppnSplitSection").classList.add("hidden");
  window.lastResult = null;
  document.getElementById("rateHero1").textContent = "-";
  document.getElementById("rateHero2").textContent = "-";
}

function getNextInput(currentInput) {
  const inputs = Array.from(
    document.querySelectorAll("input:not([readonly]), select"),
  );
  const currentIndex = inputs.indexOf(currentInput);
  return inputs[currentIndex + 1] || null;
}

function updateClHint() {
  const hint = document.getElementById("clMaxHint");
  const clInput = document.getElementById("cl");
  const mode = document.getElementById("acetateMode").value;
  if (mode !== "yes") {
    hint.textContent = "";
    clInput.removeAttribute("max");
    return;
  }
  const na = parseFloat(document.getElementById("na").value) || 0;
  const k = parseFloat(document.getElementById("k").value) || 0;
  if (na === 0 && k === 0) {
    hint.textContent = "";
    clInput.removeAttribute("max");
    return;
  }
  const clMax = computeClMax();
  const current = parseFloat(clInput.value) || 0;
  clInput.setAttribute("max", clMax.toFixed(1));
  hint.textContent = `ค่าสูงสุดที่ไม่ทำให้ติดลบ: ${clMax.toFixed(1)} mEq`;
  hint.className = current > clMax ? "helper-text warn" : "helper-text";
}

function onAcetateModeChange() {
  const mode = document.getElementById("acetateMode").value;
  const clGroup = document.getElementById("clGroup");
  const clAutoGroup = document.getElementById("clAutoGroup");
  const clInput = document.getElementById("cl");
  if (mode === "no") {
    clGroup.classList.add("hidden");
    clAutoGroup.classList.remove("hidden");
    clInput.classList.remove("required-field");
  } else {
    clGroup.classList.remove("hidden");
    clAutoGroup.classList.add("hidden");
    clInput.classList.add("required-field");
  }
  updateClHint();
}

function calculate() {
  try {
    const weight = parseFloat(document.getElementById("weight").value) || 0;
    const protein = parseFloat(document.getElementById("protein").value) || 0;
    const dextrose = parseFloat(document.getElementById("dextrose").value) || 0;
    const lipid = parseFloat(document.getElementById("lipid").value) || 0;
    const infusionDuration =
      parseFloat(document.getElementById("infusionDuration").value) || 24;
    const ivleHours =
      parseFloat(document.getElementById("ivleHours").value) || 0;
    const na = parseFloat(document.getElementById("na").value) || 0;
    const k = parseFloat(document.getElementById("k").value) || 0;
    const ca = parseFloat(document.getElementById("ca").value) || 0;
    const mg = parseFloat(document.getElementById("mg").value) || 0;
    const po4 = parseFloat(document.getElementById("po4").value) || 0;
    const clinicalStatus = document.getElementById("clinicalStatus").value;
    const venousAccess = document.getElementById("venousAccess").value;
    const acetateMode = document.getElementById("acetateMode").value;
    const useAcetate = acetateMode === "yes";
    let cl;
    if (useAcetate) {
      cl = parseFloat(document.getElementById("cl").value) || 0;
    } else {
      const _k2hpo4 = po4 > 0 && k > 0 ? po4 / 0.5 : 0;
      const _glycophos = po4 > 0 && _k2hpo4 === 0 ? po4 : 0;
      cl = k - _k2hpo4 + (na - _glycophos * 2);
      document.getElementById("clAuto").value = cl.toFixed(2);
    }
    const proteinProduct = document.getElementById("proteinProduct").value;
    let proteinSolution = 0;
    let proteinConcentration = 0;
    let proteinFormula = "";
    if (proteinProduct === "amiparen") {
      proteinSolution = (protein * 100) / 10;
      proteinConcentration = 10;
      proteinFormula = `${protein} × 100 ÷ 10 = ${proteinSolution.toFixed(2)}`;
    } else {
      proteinSolution = (protein * 100) / 15;
      proteinConcentration = 15;
      proteinFormula = `${protein} × 100 ÷ 15 = ${proteinSolution.toFixed(2)}`;
    }
    const dextroseSolution = (dextrose * 100) / 50;
    const dextroseFormula = `${dextrose} × 100 ÷ 50 = ${dextroseSolution.toFixed(2)}`;
    const lipidSolution = (lipid * 100) / 20;
    const lipidFormula = `${lipid} × 100 ÷ 20 = ${lipidSolution.toFixed(2)}`;
    const method1 = calculateElectrolytes(
      "k2hpo4",
      na,
      k,
      cl,
      ca,
      mg,
      po4,
      useAcetate,
    );
    const method2 = calculateElectrolytes(
      "nacl",
      na,
      k,
      cl,
      ca,
      mg,
      po4,
      useAcetate,
    );
    const totalElectrolyteVolume1 = Object.values(method1.electrolytes).reduce(
      (a, b) => a + b,
      0,
    );
    const totalElectrolyteVolume2 = Object.values(method2.electrolytes).reduce(
      (a, b) => a + b,
      0,
    );
    const totalVolume1 =
      proteinSolution + dextroseSolution + totalElectrolyteVolume1;
    const totalVolume2 =
      proteinSolution + dextroseSolution + totalElectrolyteVolume2;
    const aminoAcidOsmolarity =
      proteinProduct === "amiparen"
        ? proteinSolution * 0.96
        : proteinSolution * 1.29;
    const glycophosVol = method1.electrolytes["Glycophos"] || 0;
    const naFromGlycophos = glycophosVol * 2;
    const osmolarity =
      aminoAcidOsmolarity +
      dextrose * 5 +
      (na - naFromGlycophos) * 2 +
      naFromGlycophos * 3 +
      k * 2 +
      mg * 1 +
      ca * 1.4;
    const gir = (dextrose * 1000) / (weight * infusionDuration * 60);
    const proteinCalories = protein * 4;
    const dextroseCalories = dextrose * 3.4;
    const lipidCalories = lipid * 10;
    const totalCalories = proteinCalories + dextroseCalories + lipidCalories;
    const needsDilution = osmolarity > 900 && venousAccess === "peripheral";
    const effectiveVolume = needsDilution
      ? (osmolarity * totalVolume1) / 900
      : totalVolume1;
    const effectiveVolume2 = needsDilution
      ? (osmolarity * totalVolume2) / 900
      : totalVolume2;
    const flowRate = effectiveVolume / infusionDuration;
    const flowRate2 = effectiveVolume2 / infusionDuration;
    const volumeIWithLipid = totalVolume1 + lipidSolution;
    const volumeIIWithLipid = totalVolume2 + lipidSolution;

    document.getElementById("totalVolume1").textContent =
      totalVolume1.toFixed(1);
    document.getElementById("totalVolume2").textContent =
      totalVolume2.toFixed(1);
    document.getElementById("osmolarity").textContent = osmolarity.toFixed(0);
    document.getElementById("gir").textContent = gir.toFixed(2);
    document.getElementById("totalCalories").textContent =
      totalCalories.toFixed(0);
    document.getElementById("rateHero1").textContent = flowRate.toFixed(1);
    document.getElementById("rateHero2").textContent = flowRate2.toFixed(1);
    const ivleRateHr = ivleHours > 0 ? lipid / weight / ivleHours : 0;
    const ivleRateDay = lipid / weight;
    document.getElementById("ivleRateHr").textContent = ivleRateHr.toFixed(3);
    document.getElementById("ivleRateDay").textContent = ivleRateDay.toFixed(3);
    document.getElementById("formula-ivleRateHr").innerHTML = `
      <div class="formula-label">สูตร: Lipid ÷ Weight ÷ IVLE Hours</div>
      <div class="formula-calculation">${lipid} ÷ ${weight} ÷ ${ivleHours} = ${ivleRateHr.toFixed(3)} g/kg/hr</div>
    `;
    document.getElementById("formula-ivleRateDay").innerHTML = `
      <div class="formula-label">สูตร: Lipid ÷ Weight</div>
      <div class="formula-calculation">${lipid} ÷ ${weight} = ${ivleRateDay.toFixed(3)} g/kg/day</div>
    `;
    if (needsDilution) {
      const extraWaterMl = effectiveVolume - totalVolume1;
      document.getElementById("dilutionCard").classList.remove("hidden");
      document.getElementById("extraWaterCard").classList.remove("hidden");
      document.getElementById("dilutionV2").textContent =
        effectiveVolume.toFixed(1);
      document.getElementById("extraWater").textContent =
        extraWaterMl.toFixed(1);
      document.getElementById("formula-dilutionV2").innerHTML = `
        <div class="formula-label">สูตร: V₂ = (Osmolarity × Volume) ÷ 900</div>
        <div class="formula-calculation">(${osmolarity.toFixed(0)} × ${totalVolume1.toFixed(1)}) ÷ 900 = ${effectiveVolume.toFixed(1)} mL</div>
      `;
      document.getElementById("formula-extraWater").innerHTML = `
        <div class="formula-label">สูตร: Extra Water = V₂ − Volume</div>
        <div class="formula-calculation">${effectiveVolume.toFixed(1)} − ${totalVolume1.toFixed(1)} = ${extraWaterMl.toFixed(1)} mL</div>
      `;
    } else {
      document.getElementById("dilutionCard").classList.add("hidden");
      document.getElementById("extraWaterCard").classList.add("hidden");
    }
    document.getElementById("totalElectrolyte1").textContent =
      totalElectrolyteVolume1.toFixed(2) + " mL";
    document.getElementById("totalElectrolyte2").textContent =
      totalElectrolyteVolume2.toFixed(2) + " mL";
    document.getElementById("summaryProtein").textContent =
      proteinSolution.toFixed(2) + " mL";
    document.getElementById("summaryDextrose").textContent =
      dextroseSolution.toFixed(2) + " mL";
    document.getElementById("summaryK2").textContent =
      totalElectrolyteVolume1.toFixed(2) + " mL";
    document.getElementById("summaryVolI").textContent =
      totalVolume1.toFixed(2) + " mL";
    document.getElementById("summaryProtein2").textContent =
      proteinSolution.toFixed(2) + " mL";
    document.getElementById("summaryDextrose2").textContent =
      dextroseSolution.toFixed(2) + " mL";
    document.getElementById("summaryNaCl").textContent =
      totalElectrolyteVolume2.toFixed(2) + " mL";
    document.getElementById("summaryVolII").textContent =
      totalVolume2.toFixed(2) + " mL";
    document.getElementById("summaryLipid").textContent =
      lipidSolution.toFixed(2) + " mL";
    document.getElementById("totalVolumeIWithLipid").textContent =
      volumeIWithLipid.toFixed(2) + " mL";
    document.getElementById("totalVolumeIIWithLipid").textContent =
      volumeIIWithLipid.toFixed(2) + " mL";

    document.getElementById("formula-volume1").innerHTML = `
      <div class="formula-label">สูตร:</div>
      <div class="formula-calculation">Protein Sol + Dextrose Sol + K₂HPO₄ Electrolyte Sol</div>
      <div class="formula-calculation">${proteinSolution.toFixed(2)} + ${dextroseSolution.toFixed(2)} + ${totalElectrolyteVolume1.toFixed(2)} = ${totalVolume1.toFixed(1)} mL</div>
    `;
    document.getElementById("formula-volume2").innerHTML = `
      <div class="formula-label">สูตร:</div>
      <div class="formula-calculation">Protein Sol + Dextrose Sol + NaCl Electrolyte Sol</div>
      <div class="formula-calculation">${proteinSolution.toFixed(2)} + ${dextroseSolution.toFixed(2)} + ${totalElectrolyteVolume2.toFixed(2)} = ${totalVolume2.toFixed(1)} mL</div>
    `;
    const aaOsmLabel =
      proteinProduct === "amiparen"
        ? `${proteinSolution.toFixed(1)} mL × 0.960 mOsm/mL`
        : `${proteinSolution.toFixed(1)} mL × 1.290 mOsm/mL`;
    const naFormulaLabel =
      glycophosVol > 0 ? `(Na_NaCl/NaAc × 2) + (Na_Glycophos × 3)` : `(Na × 2)`;
    const naFormulaCalc =
      glycophosVol > 0
        ? `(${(na - naFromGlycophos).toFixed(2)} × 2) + (${naFromGlycophos.toFixed(2)} × 3)`
        : `(${na} × 2)`;
    document.getElementById("formula-osmolarity").innerHTML = `
      <div class="formula-label">สูตร:</div>
      <div class="formula-calculation">(AA Vol × ${proteinProduct === "amiparen" ? "0.960" : "1.290"}) + (Dextrose × 5) + ${naFormulaLabel} + (K × 2) + (Mg × 1) + (Ca × 1.4)</div>
      <div class="formula-calculation">${aaOsmLabel} + (${dextrose} × 5) + ${naFormulaCalc} + (${k} × 2) + (${mg} × 1) + (${ca} × 1.4) = ${osmolarity.toFixed(0)} mOsm</div>
    `;
    document.getElementById("formula-gir").innerHTML = `
      <div class="formula-label">สูตร:</div>
      <div class="formula-calculation">(Dextrose × 1000) ÷ (Weight × Duration × 60)</div>
      <div class="formula-calculation">(${dextrose} × 1000) ÷ (${weight} × ${infusionDuration} × 60) = ${gir.toFixed(2)}</div>
    `;
    document.getElementById("formula-calories").innerHTML = `
      <div class="formula-label">สูตร:</div>
      <div class="formula-calculation">(Protein × 4) + (Dextrose × 3.4) + (Lipid × 10)</div>
      <div class="formula-calculation">(${protein} × 4) + (${dextrose} × 3.4) + (${lipid} × 10) = ${totalCalories.toFixed(0)} kcal</div>
    `;
    document.getElementById("electrolyteSolutions1").innerHTML =
      renderElectrolyteHTML(
        method1.electrolytes,
        method1.formulas,
        allFormulasVisible,
      );
    document.getElementById("electrolyteSolutions2").innerHTML =
      renderElectrolyteHTML(
        method2.electrolytes,
        method2.formulas,
        allFormulasVisible,
      );
    const macroHTML = `
      <div class="electrolyte-item">
        <div class="electrolyte-header">
          <span class="electrolyte-name">${proteinConcentration}% ${
            proteinProduct === "amiparen" ? "Amiparen" : "Aminoplasmal"
          }</span>
          <span class="electrolyte-value">${proteinSolution.toFixed(2)} mL</span>
        </div>
        <div class="electrolyte-formula ${allFormulasVisible ? "show" : ""}">
          <div class="formula-label">สูตร:</div>
          <div class="formula-calculation">${proteinFormula}</div>
        </div>
      </div>
      <div class="electrolyte-item">
        <div class="electrolyte-header">
          <span class="electrolyte-name">50% Dextrose</span>
          <span class="electrolyte-value">${dextroseSolution.toFixed(2)} mL</span>
        </div>
        <div class="electrolyte-formula ${allFormulasVisible ? "show" : ""}">
          <div class="formula-label">สูตร:</div>
          <div class="formula-calculation">${dextroseFormula}</div>
        </div>
      </div>
      <div class="electrolyte-item">
        <div class="electrolyte-header">
          <span class="electrolyte-name">20% Lipid Emulsion</span>
          <span class="electrolyte-value">${lipidSolution.toFixed(2)} mL</span>
        </div>
        <div class="electrolyte-formula ${allFormulasVisible ? "show" : ""}">
          <div class="formula-label">สูตร:</div>
          <div class="formula-calculation">${lipidFormula}</div>
        </div>
      </div>
    `;
    document.getElementById("macronutrientSolutions").innerHTML = macroHTML;
    let alertsHTML = "";
    const negKeys1 = Object.entries(method1.electrolytes)
      .filter(([, v]) => v < 0)
      .map(([k]) => k);
    const negKeys2 = Object.entries(method2.electrolytes)
      .filter(([, v]) => v < 0)
      .map(([k]) => k);
    const allNegKeys = [...new Set([...negKeys1, ...negKeys2])];
    if (allNegKeys.length > 0) {
      alertsHTML += `
        <div class="alert alert-danger">
          <i data-lucide="circle-alert" style="width: 20px; height: 20px;"></i>
          <div>
            <strong>ข้อมูล Electrolyte ไม่สมดุล:</strong>
            ${allNegKeys.join(", ")} คำนวณได้ค่าติดลบ — กรุณาตรวจสอบ Na, K, Cl, PO₄ ที่กรอก
          </div>
        </div>
      `;
    }
    if (osmolarity > 900 && venousAccess === "peripheral") {
      alertsHTML += `
        <div class="alert alert-danger">
          <i data-lucide="circle-alert" style="width: 20px; height: 20px;"></i>
          <div>
            <strong>อันตราย!</strong> Osmolarity > 900 mOsm/L (${osmolarity.toFixed(0)} mOsm/L)
            ต้องใช้ Central Line เท่านั้น แต่ผู้ป่วยมี Peripheral Line
            — ต้องเจือจางด้วยน้ำ (ดูผล V₂ และน้ำที่ต้องเพิ่มด้านบน)
          </div>
        </div>
      `;
    } else if (osmolarity > 900) {
      alertsHTML += `
        <div class="alert alert-warning">
          <i data-lucide="alert-triangle" style="width: 20px; height: 20px;"></i>
          <div>
            <strong>คำเตือน:</strong> Osmolarity > 900 mOsm/L (${osmolarity.toFixed(0)} mOsm/L)
            ต้องให้ทาง Central Line เท่านั้น
          </div>
        </div>
      `;
    }
    const girThreshold = clinicalStatus === "critical" ? 5 : 7;
    const girRangeLabel =
      clinicalStatus === "critical"
        ? "Critical ill: ช่วงปกติ 4–5 mg/kg/min"
        : "Stable: ช่วงปกติ 4–7 mg/kg/min";
    if (gir > girThreshold) {
      alertsHTML += `
        <div class="alert alert-danger">
          <i data-lucide="circle-alert" style="width: 20px; height: 20px;"></i>
          <div>
            <strong>คำเตือน GIR:</strong> ${gir.toFixed(2)} mg/kg/min
            เกินค่าสูงสุด (${girThreshold} mg/kg/min) — ${girRangeLabel}
            อาจเสี่ยงต่อ Hyperglycemia และ Steatosis
          </div>
        </div>
      `;
    }
    if (ivleRateHr > 0.11) {
      alertsHTML += `
        <div class="alert alert-danger">
          <i data-lucide="circle-alert" style="width: 20px; height: 20px;"></i>
          <div>
            <strong>คำเตือน IVLE:</strong> อัตราหยด ${ivleRateHr.toFixed(3)} g/kg/hr
            เกินค่าสูงสุดที่แนะนำ (0.11 g/kg/hr)
          </div>
        </div>
      `;
    }
    if (ivleRateDay > 1.5) {
      alertsHTML += `
        <div class="alert alert-danger">
          <i data-lucide="circle-alert" style="width: 20px; height: 20px;"></i>
          <div>
            <strong>คำเตือน IVLE:</strong> ขนาดรายวัน ${ivleRateDay.toFixed(3)} g/kg/day
            เกินค่าสูงสุดที่แนะนำ (1.5 g/kg/day)
          </div>
        </div>
      `;
    }
    if (
      osmolarity <= 900 &&
      gir <= girThreshold &&
      ivleRateHr <= 0.11 &&
      ivleRateDay <= 1.5
    ) {
      alertsHTML += `
        <div class="alert alert-success">
          <i data-lucide="check-circle" style="width: 20px; height: 20px;"></i>
          <div>
            <strong>ปลอดภัย:</strong> ค่าทั้งหมดอยู่ในเกณฑ์ปกติ
          </div>
        </div>
      `;
    }
    alertsHTML += `
      <div class="alert alert-warning">
        <i data-lucide="clipboard-list" style="width: 20px; height: 20px;"></i>
        <div>
          <strong>ลำดับการผสม:</strong> Dextrose + AA → Phosphate → Electrolyte → Calcium
          <br>เพื่อป้องกัน Calcium Phosphate Precipitation
        </div>
      </div>
    `;
    document.getElementById("alerts").innerHTML = alertsHTML;
    const volL = totalVolume1 / 1000;
    const ca_meqPerL = ca / volL;
    const ca_mmolPerL = (ca * 0.5) / volL;
    const po4_meqPerL = (po4 * 2) / volL;
    const po4_mmolPerL = po4 / volL;
    const check1 = ca_meqPerL + po4_meqPerL <= 45;
    const check2 = ca_meqPerL <= 15 && po4_meqPerL <= 30;
    const check3 = po4_mmolPerL > 0 ? ca_mmolPerL / po4_mmolPerL < 0.5 : true;
    const check4 = ca_mmolPerL * po4_mmolPerL <= 75;
    const caPoChecks = [
      {
        label: "Ca (mEq/L) + PO₄ (mEq/L) ≤ 45",
        detail: `${ca_meqPerL.toFixed(2)} + ${po4_meqPerL.toFixed(2)} = ${(ca_meqPerL + po4_meqPerL).toFixed(2)}`,
        pass: check1,
      },
      {
        label: "Ca (mEq/L) ≤ 15 และ PO₄ (mEq/L) ≤ 30",
        detail: `Ca = ${ca_meqPerL.toFixed(2)}, PO₄ = ${po4_meqPerL.toFixed(2)}`,
        pass: check2,
      },
      {
        label: "Ca (mmol/L) / PO₄ (mmol/L) < 1/2",
        detail: `${ca_mmolPerL.toFixed(2)} / ${po4_mmolPerL.toFixed(2)} = ${po4_mmolPerL > 0 ? (ca_mmolPerL / po4_mmolPerL).toFixed(3) : "N/A"}`,
        pass: check3,
      },
      {
        label: "Ca (mmol/L) × P (mmol/L) ≤ 75",
        detail: `${ca_mmolPerL.toFixed(2)} × ${po4_mmolPerL.toFixed(2)} = ${(ca_mmolPerL * po4_mmolPerL).toFixed(2)}`,
        pass: check4,
      },
    ];
    const allCaPoPass = caPoChecks.every((c) => c.pass);
    document.getElementById("caPO4Checks").innerHTML = caPoChecks
      .map(
        (c) => `
        <div class="compat-check">
          <span>${c.label}<br><small style="color:var(--text-secondary)">${c.detail}</small></span>
          <span class="${c.pass ? "compat-pass" : "compat-fail"}">${c.pass ? "✓ ผ่าน" : "✗ ไม่ผ่าน"}</span>
        </div>`,
      )
      .join("");
    document.getElementById("caPO4Alert").innerHTML = allCaPoPass
      ? `<div class="alert alert-success" style="margin-top:12px;">
          <i data-lucide="check-circle" style="width:20px;height:20px;"></i>
          <div><strong>ปลอดภัย:</strong> Ca–PO₄ ผ่านเกณฑ์ความเข้ากันได้ทุกข้อ</div>
        </div>`
      : `<div class="alert alert-danger" style="margin-top:12px;">
          <i data-lucide="circle-alert" style="width:20px;height:20px;"></i>
          <div><strong>อันตราย!</strong> Ca–PO₄ ไม่ผ่านเกณฑ์ความเข้ากันได้
            — อาจเกิด Calcium Phosphate Precipitation</div>
        </div>`;
    document.getElementById("resultsSection").classList.remove("hidden");
    document
      .getElementById("resultsSection")
      .scrollIntoView({ behavior: "smooth", block: "nearest" });

    // --- PPN Split Bags ---
    const ppnSplitSection = document.getElementById("ppnSplitSection");
    const needsSplit = venousAccess === "peripheral" && effectiveVolume > 1200;
    if (needsSplit) {
      ppnSplitSection.classList.remove("hidden");
      const na2 = na / 2,
        k2 = k / 2,
        cl2 = cl / 2,
        po4_2 = po4 / 2;
      const pSol2 = proteinSolution / 2,
        dSol2 = dextroseSolution / 2;

      const bagA1 = calculateElectrolytes(
        "k2hpo4",
        na2,
        k2,
        cl2,
        ca,
        mg,
        po4_2,
        useAcetate,
      );
      const bagB1 = calculateElectrolytes(
        "k2hpo4",
        na2,
        k2,
        cl2,
        0,
        0,
        po4_2,
        useAcetate,
      );
      const bagA2 = calculateElectrolytes(
        "nacl",
        na2,
        k2,
        cl2,
        ca,
        mg,
        po4_2,
        useAcetate,
      );
      const bagB2 = calculateElectrolytes(
        "nacl",
        na2,
        k2,
        cl2,
        0,
        0,
        po4_2,
        useAcetate,
      );

      const sumVol = (elec) => Object.values(elec).reduce((s, v) => s + v, 0);
      const volA1 = pSol2 + dSol2 + sumVol(bagA1.electrolytes);
      const volB1 = pSol2 + dSol2 + sumVol(bagB1.electrolytes);
      const volA2 = pSol2 + dSol2 + sumVol(bagA2.electrolytes);
      const volB2 = pSol2 + dSol2 + sumVol(bagB2.electrolytes);

      const aaOsm2 = aminoAcidOsmolarity / 2;
      const glyA1 = (bagA1.electrolytes["Glycophos"] || 0) * 2;
      const glyB1 = (bagB1.electrolytes["Glycophos"] || 0) * 2;
      const glyA2 = (bagA2.electrolytes["Glycophos"] || 0) * 2;
      const glyB2 = (bagB2.electrolytes["Glycophos"] || 0) * 2;
      const osmA1 =
        aaOsm2 +
        (dextrose / 2) * 5 +
        (na2 - glyA1) * 2 +
        glyA1 * 3 +
        k2 * 2 +
        mg +
        ca * 1.4;
      const osmB1 =
        aaOsm2 + (dextrose / 2) * 5 + (na2 - glyB1) * 2 + glyB1 * 3 + k2 * 2;
      const osmA2 =
        aaOsm2 +
        (dextrose / 2) * 5 +
        (na2 - glyA2) * 2 +
        glyA2 * 3 +
        k2 * 2 +
        mg +
        ca * 1.4;
      const osmB2 =
        aaOsm2 + (dextrose / 2) * 5 + (na2 - glyB2) * 2 + glyB2 * 3 + k2 * 2;

      const effVolA1 = osmA1 > 900 ? (osmA1 * volA1) / 900 : volA1;
      const effVolB1 = osmB1 > 900 ? (osmB1 * volB1) / 900 : volB1;
      const effVolA2 = osmA2 > 900 ? (osmA2 * volA2) / 900 : volA2;
      const effVolB2 = osmB2 > 900 ? (osmB2 * volB2) / 900 : volB2;
      const xwA1 = effVolA1 - volA1;
      const xwB1 = effVolB1 - volB1;
      const xwA2 = effVolA2 - volA2;
      const xwB2 = effVolB2 - volB2;

      document.getElementById("ppnSplitInfo").innerHTML = `
        <div class="alert alert-warning">
          <i data-lucide="info" style="width:20px;height:20px;"></i>
          <div>ปริมาตรรวม <strong>${effectiveVolume.toFixed(0)} mL</strong> &gt; 1,200 mL
          → แบ่งเป็น 2 ถุง: ถุงที่ 1 ใส่ Ca + Mg ครบ, ถุงที่ 2 ไม่มี Ca + Mg</div>
        </div>`;

      const renderBag = (
        pSol,
        dSol,
        elec,
        forms,
        vol,
        osm,
        effVol,
        extraWater,
      ) => {
        const needsDil = extraWater > 0;
        const finalOsm = needsDil ? 900 : osm;
        const osmBadge = `<span class="compat-pass" style="margin-left:auto;">✓ Osmolarity ${finalOsm.toFixed(0)} mOsm/L</span>`;
        return `
          ${
            needsDil
              ? `
          <div class="electrolyte-item">
            <div class="electrolyte-header">
              <span class="electrolyte-name" style="color:var(--accent-color);">Sterile Water for Injection</span>
              <span class="electrolyte-value">${extraWater.toFixed(1)} mL</span>
            </div>
            <div style="font-size:0.8em;color:var(--text-secondary);padding-top:2px;">
              เติมเพื่อลด Osm จาก ${osm.toFixed(0)} → 900 mOsm/L
            </div>
          </div>`
              : ""
          }
          <div class="electrolyte-item">
            <div class="electrolyte-header">
              <span class="electrolyte-name">${proteinConcentration}% ${proteinProduct === "amiparen" ? "Amiparen" : "Aminoplasmal"}</span>
              <span class="electrolyte-value">${pSol.toFixed(2)} mL</span>
            </div>
          </div>
          <div class="electrolyte-item">
            <div class="electrolyte-header">
              <span class="electrolyte-name">50% Dextrose</span>
              <span class="electrolyte-value">${dSol.toFixed(2)} mL</span>
            </div>
          </div>
          ${renderElectrolyteHTML(elec, forms, allFormulasVisible)}
          <div class="summary-box" style="margin-top:8px;">
            <div class="summary-item">
              <span class="summary-label">Volume${needsDil ? " (+ น้ำ)" : ""}:</span>
              <span class="summary-value">${effVol.toFixed(1)} mL</span>
            </div>
            <div class="summary-item">
              ${osmBadge}
            </div>
          </div>
        `;
      };

      document.getElementById("splitBagA1").innerHTML = renderBag(
        pSol2,
        dSol2,
        bagA1.electrolytes,
        bagA1.formulas,
        volA1,
        osmA1,
        effVolA1,
        xwA1,
      );
      document.getElementById("splitBagB1").innerHTML = renderBag(
        pSol2,
        dSol2,
        bagB1.electrolytes,
        bagB1.formulas,
        volB1,
        osmB1,
        effVolB1,
        xwB1,
      );
      document.getElementById("splitBagA2").innerHTML = renderBag(
        pSol2,
        dSol2,
        bagA2.electrolytes,
        bagA2.formulas,
        volA2,
        osmA2,
        effVolA2,
        xwA2,
      );
      document.getElementById("splitBagB2").innerHTML = renderBag(
        pSol2,
        dSol2,
        bagB2.electrolytes,
        bagB2.formulas,
        volB2,
        osmB2,
        effVolB2,
        xwB2,
      );

      const vL = effVolA1 / 1000;
      const ca_mL = ca / vL,
        ca_mol = (ca * 0.5) / vL;
      const po4_mL = (po4_2 * 2) / vL,
        po4_mol = po4_2 / vL;
      const splitChecks = [
        {
          label: "Ca (mEq/L) + PO₄ (mEq/L) ≤ 45",
          detail: `${ca_mL.toFixed(2)} + ${po4_mL.toFixed(2)} = ${(ca_mL + po4_mL).toFixed(2)}`,
          pass: ca_mL + po4_mL <= 45,
        },
        {
          label: "Ca (mEq/L) ≤ 15 และ PO₄ (mEq/L) ≤ 30",
          detail: `Ca = ${ca_mL.toFixed(2)}, PO₄ = ${po4_mL.toFixed(2)}`,
          pass: ca_mL <= 15 && po4_mL <= 30,
        },
        {
          label: "Ca (mmol/L) / PO₄ (mmol/L) < 1/2",
          detail: `${ca_mol.toFixed(2)} / ${po4_mol.toFixed(2)} = ${po4_mol > 0 ? (ca_mol / po4_mol).toFixed(3) : "N/A"}`,
          pass: po4_mol > 0 ? ca_mol / po4_mol < 0.5 : true,
        },
        {
          label: "Ca (mmol/L) × P (mmol/L) ≤ 75",
          detail: `${ca_mol.toFixed(2)} × ${po4_mol.toFixed(2)} = ${(ca_mol * po4_mol).toFixed(2)}`,
          pass: ca_mol * po4_mol <= 75,
        },
      ];
      const allSplitPass = splitChecks.every((c) => c.pass);
      document.getElementById("splitCaPO4").innerHTML = `
        <div>
          <h3 style="margin-bottom:4px;"><i data-lucide="shield-check"></i> Ca&ndash;PO&#x2084; Compatibility Checks</h3>
          <p style="margin:0 0 10px;font-size:0.85em;color:var(--text-secondary);">ถุงที่ 1: Ca เต็ม, PO&#x2084;/2${xwA1 > 0 ? ` — หลังเติม Sterile Water ${xwA1.toFixed(1)} mL` : ""}</p>
          ${splitChecks
            .map(
              (c) => `
            <div class="compat-check">
              <span>${c.label}<br><small style="color:var(--text-secondary)">${c.detail}</small></span>
              <span class="${c.pass ? "compat-pass" : "compat-fail"}">${c.pass ? "✓ ผ่าน" : "✗ ไม่ผ่าน"}</span>
            </div>`,
            )
            .join("")}
          ${
            allSplitPass
              ? `<div class="alert alert-success" style="margin-top:12px;"><i data-lucide="check-circle" style="width:20px;height:20px;"></i><div><strong>ปลอดภัย:</strong> Ca–PO₄ ถุงที่ 1 ผ่านเกณฑ์ทุกข้อ</div></div>`
              : `<div class="alert alert-danger" style="margin-top:12px;"><i data-lucide="circle-alert" style="width:20px;height:20px;"></i><div><strong>อันตราย!</strong> Ca–PO₄ ถุงที่ 1 ไม่ผ่านเกณฑ์ — อาจเกิด Calcium Phosphate Precipitation</div></div>`
          }
          <p style="margin-top:8px;font-size:0.85em;color:var(--text-secondary);">ถุงที่ 2 ไม่มี Ca → ไม่มีความเสี่ยง Ca–PO₄ Precipitation</p>
        </div>`;
    } else {
      ppnSplitSection.classList.add("hidden");
    }

    window.lastResult = {
      patientId: document.getElementById("patientId").value.trim(),
      patientName: document.getElementById("patientName").value.trim(),
      weight,
      venousAccess,
      proteinProduct,
      sterileWater: needsDilution ? effectiveVolume - totalVolume1 : 0,
      dextroseSolution,
      proteinSolution,
      protein,
      dextrose,
      electrolytes1: method1.electrolytes,
      electrolytes2: method2.electrolytes,
      addamelVol: document.getElementById("addamel").checked ? 10 : 0,
      soluvitVol: document.getElementById("soluvit").checked ? 10 : 0,
      cernevitVol: document.getElementById("cernevit").checked ? 5 : 0,
      bcomplexVol: document.getElementById("bComplex").checked ? 2 : 0,
      na,
      k,
      cl,
      ca,
      mg,
      po4,
      flowRate1: flowRate,
      flowRate2,
    };
    document.getElementById("printBtn").disabled = false;
    lucide.createIcons();
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการคำนวณ: " + error.message);
    console.error(error);
  }
}

// ── QR Code Scanner ──
let qrScanStream = null;
let qrScanActive = false;

function openQRScanner() {
  const modal = document.getElementById("qrScannerModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  qrScanActive = true;
  document.getElementById("qrStatus").textContent = "กำลังเปิดกล้อง...";
  lucide.createIcons();

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      qrScanStream = stream;
      const video = document.getElementById("qrVideo");
      video.srcObject = stream;
      video.play();
      document.getElementById("qrStatus").textContent = "กำลังสแกน QR Code...";
      requestAnimationFrame(scanQRFrame);
    })
    .catch(() => {
      document.getElementById("qrStatus").textContent =
        "ไม่สามารถเปิดกล้องได้ — กรุณาเลือกรูปภาพแทน";
    });
}

function scanQRFrame() {
  if (!qrScanActive) return;
  const video = document.getElementById("qrVideo");
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height);
    if (code) {
      try {
        fillPatientFromQR(JSON.parse(code.data));
        closeQRScanner();
        return;
      } catch (_) {
        document.getElementById("qrStatus").textContent =
          "QR Code ไม่ถูกรูปแบบ";
      }
    }
  }
  requestAnimationFrame(scanQRFrame);
}

function scanQRFromImage(input) {
  const file = input.files[0];
  if (!file) return;
  const status = document.getElementById("qrStatus");
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    URL.revokeObjectURL(img.src);
    if (code) {
      try {
        fillPatientFromQR(JSON.parse(code.data));
        closeQRScanner();
      } catch (_) {
        status.textContent = "QR Code ไม่ถูกรูปแบบ";
      }
    } else {
      status.textContent = "ไม่พบ QR Code ในรูปภาพ";
    }
  };
  img.src = URL.createObjectURL(file);
  input.value = "";
}

function closeQRScanner() {
  qrScanActive = false;
  document.getElementById("qrScannerModal").classList.remove("active");
  document.body.style.overflow = "";
  if (qrScanStream) {
    qrScanStream.getTracks().forEach((t) => t.stop());
    qrScanStream = null;
  }
}

function fillPatientFromQR(d) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  };
  const setCheck = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.checked = Boolean(val);
  };

  set("patientId", d.id);
  set("patientName", d.name);
  set("weight", d.weight);
  set("height", d.height);
  set("clinicalStatus", d.clinicalStatus);
  set("venousAccess", d.venousAccess);

  set("protein", d.protein);
  set("proteinProduct", d.proteinProduct);
  set("dextrose", d.dextrose);
  set("infusionDuration", d.infusionDuration);
  set("lipid", d.lipid);
  set("ivleHours", d.ivleHours);

  if (d.acetateMode) {
    set("acetateMode", d.acetateMode);
    onAcetateModeChange();
  }
  set("na", d.na);
  set("k", d.k);
  set("cl", d.cl);
  set("ca", d.ca);
  set("mg", d.mg);
  set("po4", d.po4);
  updateClHint();

  setCheck("cernevit", d.cernevit);
  setCheck("soluvit", d.soluvit);
  setCheck("bComplex", d.bComplex);
  setCheck("addamel", d.addamel);

  document.getElementById("weight").dispatchEvent(new Event("input"));
  document.getElementById("height").dispatchEvent(new Event("input"));
}
