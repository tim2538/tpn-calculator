// คู่มือสูตรคำนวณ: แปลจาก readme.md (สูตรใน <pre> ต้องตรงกับ readme ทุกตัวอักษร)
// แก้ readme.md เมื่อไร ต้องแก้ไฟล์นี้ตามด้วย
const MANUAL_TOC = [
  ["manual-inputs", "ข้อมูลนำเข้า (Inputs)"],
  ["manual-s1", "1. Macronutrient Solution Volumes"],
  ["manual-s2", "2. Electrolyte Solution Volumes"],
  ["manual-s3", "3. Total Volumes"],
  ["manual-s4", "4. Osmolarity"],
  ["manual-s5", "5. Peripheral Dilution"],
  ["manual-s5a", "5a. Rate I และ Rate II"],
  ["manual-s6", "6. Glucose Infusion Rate (GIR)"],
  ["manual-s7", "7. Total Calories"],
  ["manual-s8", "8. IVLE (Lipid) Infusion Rates"],
  ["manual-s9", "9. Calcium–Phosphate Compatibility"],
  ["manual-s10", "10. Chloride Maximum Hint (Acetate Mode)"],
  ["manual-s11", "11. Split Bags (> 1,200 mL)"],
  ["manual-s12", "12. Custom Bag Volume & Final Osmolarity (Print)"],
  ["manual-outputs", "สรุปผลลัพธ์ (Outputs Summary)"],
  ["manual-alerts", "เงื่อนไขการแจ้งเตือน (Safety Alert Logic)"],
];

const MANUAL_HTML = `
<nav class="manual-toc">
  <div class="manual-toc-title">สารบัญ</div>
  <ol>
    ${MANUAL_TOC.map(
      ([id, label]) =>
        `<li><a href="#${id}" onclick="scrollManualTo('${id}'); return false;">${label}</a></li>`
    ).join("")}
  </ol>
</nav>

<h2 id="manual-inputs">ข้อมูลนำเข้า (Inputs)</h2>
<div class="manual-table-wrap">
<table>
  <thead><tr><th>หมวด</th><th>Field</th><th>หน่วย</th><th>หมายเหตุ</th></tr></thead>
  <tbody>
    <tr><td>Patient</td><td>Weight</td><td>kg</td><td>ใช้คำนวณ GIR, IVLE rate</td></tr>
    <tr><td>Patient</td><td>Height</td><td>cm</td><td>ใช้คำนวณ BMI เท่านั้น</td></tr>
    <tr><td>Patient</td><td>Clinical Status</td><td>stable / critical</td><td>มีผลต่อเกณฑ์ GIR</td></tr>
    <tr><td>Patient</td><td>Venous Access</td><td>central / peripheral</td><td>มีผลต่อการจัดการ osmolarity</td></tr>
    <tr><td>Macronutrients</td><td>Protein</td><td>g</td><td>เลือก Amiparen 10% หรือ Aminoplasmal 15%</td></tr>
    <tr><td>Macronutrients</td><td>Dextrose</td><td>g</td><td>แปลงเป็นปริมาตรจากสารละลาย 50%</td></tr>
    <tr><td>Macronutrients</td><td>Lipid (IVLE)</td><td>g</td><td>แปลงเป็นปริมาตรจาก emulsion 20%</td></tr>
    <tr><td>Macronutrients</td><td>Infusion Duration</td><td>hr</td><td>ใช้คำนวณ GIR และ flow rate</td></tr>
    <tr><td>Macronutrients</td><td>IVLE Drip Duration</td><td>hr</td><td>ใช้คำนวณ IVLE rate รายชั่วโมง</td></tr>
    <tr><td>Electrolytes</td><td>Na, K, Cl, Ca, Mg</td><td>mEq</td><td></td></tr>
    <tr><td>Electrolytes</td><td>PO₄</td><td>mmol</td><td></td></tr>
    <tr><td>Electrolytes</td><td>Acetate Mode</td><td>yes / no</td><td>กำหนดว่าจะแสดงช่องกรอก Cl หรือไม่</td></tr>
  </tbody>
</table>
</div>

<h2>ขั้นตอนการคำนวณ (Step-by-Step Calculations)</h2>

<h3 id="manual-s1">1. Macronutrient Solution Volumes</h3>
<pre>Protein Solution (mL) = Protein (g) × 100 ÷ Concentration
  - Amiparen 10%:    Protein × 100 ÷ 10
  - Aminoplasmal 15%: Protein × 100 ÷ 15

Dextrose Solution (mL) = Dextrose (g) × 100 ÷ 50   [50% solution]

Lipid Solution (mL) = Lipid (g) × 100 ÷ 20         [20% emulsion]</pre>

<h3 id="manual-s2">2. Electrolyte Solution Volumes</h3>
<p>คำนวณ 2 วิธีคู่กันและแสดงผลเทียบกัน</p>

<h4>ส่วนที่ใช้ร่วมกัน (ทั้งสองวิธี)</h4>
<pre>10% Ca Gluconate (mL) = Ca (mEq) ÷ 0.5
50% MgSO₄ (mL)        = Mg (mEq) ÷ 4</pre>

<h4>การเลือกแหล่ง Phosphate</h4>
<p>ใช้ K₂HPO₄ ก่อน โดยจำกัดไม่ให้เกิน K ที่สั่ง (K 1 mEq ต่อ mL) PO₄ ที่เหลือมาจาก Glycophos (PO₄ 1 mmol + Na 2 mEq ต่อ mL)</p>
<pre>8.71% K₂HPO₄ (mL) = min(PO₄ (mmol) ÷ 0.5, K (mEq))   [0 if PO₄ = 0 or K = 0]
Glycophos (mL)    = PO₄ (mmol) − K₂HPO₄ × 0.5

  K ≥ PO₄×2      → K₂HPO₄ = PO₄ ÷ 0.5, Glycophos = 0
  0 &lt; K &lt; PO₄×2  → K₂HPO₄ = K, Glycophos = PO₄ − K×0.5   (split; prevents negative KAc/KCl)
  K = 0          → K₂HPO₄ = 0, Glycophos = PO₄</pre>
<p>Na จาก Glycophos (Glycophos × 2) จะถูกหักออกจาก Na ในสูตร NaAc / NaCl ด้านล่าง</p>
<p>ตัวอย่าง: K 20, PO₄ 12 → K₂HPO₄ = min(24, 20) = 20 mL, Glycophos = 12 − 10 = 2 mL (Na 4 mEq)</p>

<h4>Method 1 — K₂HPO₄ First (ใช้ acetate)</h4>
<p>ใช้ K₂HPO₄ เป็นแหล่ง potassium ก่อน แล้วจึงกระจาย K และ Na ที่เหลือ</p>
<pre>15% KCl (mL)   = min(K − K₂HPO₄, Cl) ÷ 2   [0 if K ≤ K₂HPO₄ or Cl = 0]
29.4% KAc (mL) = (K − K₂HPO₄ − KCl×2) ÷ 3
3% NaCl (mL)   = (Cl − KCl×2) ÷ 0.5
24.6% NaAc (mL) = (Na − NaCl×0.5 − Glycophos×2) ÷ 3</pre>
<p>KCl ถูกจำกัดไม่ให้เกิน Cl เพื่อไม่ให้ NaCl ติดลบ K ที่เหลือจะไปอยู่ใน KAc</p>
<p>ตัวอย่าง: Na 20, K 100, Cl 40, PO₄ 12 → K₂HPO₄ 24, KCl = min(76, 40) ÷ 2 = 20, KAc = (76 − 40) ÷ 3 = 12, NaCl = 0, NaAc = 20 ÷ 3 = 6.67</p>

<h4>Method 1 — K₂HPO₄ First (ไม่ใช้ acetate)</h4>
<pre>15% KCl (mL) = (K − K₂HPO₄) ÷ 2
3% NaCl (mL) = (Na − Glycophos×2) ÷ 0.5
KAc = 0, NaAc = 0
Cl auto-derived: Cl = K − K₂HPO₄ + Na − Glycophos×2</pre>

<h4>Method 2 — NaCl First (ใช้ acetate)</h4>
<p>ใช้ NaCl ก่อน โดยใช้ค่าที่น้อยกว่าระหว่าง Na กับ Cl แล้วจึงกระจายส่วนที่เหลือ</p>
<pre>3% NaCl (mL)   = min(Na, Cl) ÷ 0.5
15% KCl (mL)   = (Cl − NaCl×0.5) ÷ 2
29.4% KAc (mL) = (K − K₂HPO₄ − (Cl − NaCl×0.5)) ÷ 3
24.6% NaAc (mL) = (Na − NaCl×0.5 − Glycophos×2) ÷ 3</pre>

<h4>Method 2 — NaCl First (ไม่ใช้ acetate)</h4>
<pre>3% NaCl (mL) = (Na − Glycophos×2) ÷ 0.5
15% KCl (mL) = (K − K₂HPO₄) ÷ 2
KAc = 0, NaAc = 0</pre>
<p>เมื่อใช้ acetate และกรอก Cl เท่ากับ Cl ที่คำนวณอัตโนมัติ ทั้งสองวิธีจะได้ปริมาตรเท่ากับโหมดไม่ใช้ acetate</p>

<h3 id="manual-s3">3. Total Volumes</h3>
<pre>Total Volume I  (mL) = Protein Sol + Dextrose Sol + Σ Electrolyte Sol (Method 1)
Total Volume II (mL) = Protein Sol + Dextrose Sol + Σ Electrolyte Sol (Method 2)

Volume I  with Lipid (mL) = Total Volume I  + Lipid Sol
Volume II with Lipid (mL) = Total Volume II + Lipid Sol</pre>
<p>Lipid ให้แยกถุง (ถุง IVLE) ปริมาตรรวม lipid แสดงไว้เพื่ออ้างอิงเท่านั้น</p>

<h3 id="manual-s4">4. Osmolarity</h3>
<pre>Osmolarity (mOsm) =
  (Protein Sol mL × AA_factor)   ← product-specific
  + Dextrose (g) × 5
  + Na_other (mEq) × 2           ← Na not from Glycophos
  + Na_glycophos (mEq) × 3       ← Na from Glycophos (disodium salt, contributes extra anion)
  + K  (mEq) × 2
  + Mg (mEq) × 1
  + Ca (mEq) × 1.4

Where:
  Na_glycophos (mEq) = Glycophos (mL) × 2
  Na_other (mEq)     = Na (total mEq) − Na_glycophos
  When Glycophos = 0, the formula collapses to Na × 2.

AA_factor:
  Amiparen 10%:    0.960 mOsm/mL  (960 mOsm/L)
  Aminoplasmal 15%: 1.290 mOsm/mL (1290 mOsm/L)</pre>

<h3 id="manual-s5">5. Peripheral Dilution (เมื่อจำเป็น)</h3>
<p>Osmolarity จากหัวข้อ 4 เป็นค่ารวม (mOsm) ต้องแปลงเป็นความเข้มข้นก่อน โดยใช้ปริมาตร<strong>ไม่รวม lipid</strong> (V₁) แยกคำนวณแต่ละวิธี</p>
<pre>N₁ (mOsm/L) = Osmolarity (mOsm) × 1000 ÷ V₁
  V₁ = Total Volume I  (Method 1)  or  Total Volume II (Method 2)</pre>
<p>เจือจางแยกตามวิธี เมื่อ <code>N₁ &gt; 900 mOsm/L</code> และ venous access เป็น <code>peripheral</code> ใช้ N₁V₁ = N₂V₂ โดย N₂ = 900 mOsm/L</p>
<pre>V₂ (mL)          = N₁ × V₁ ÷ 900        (= Osmolarity × 1000 ÷ 900)
Extra Water (mL) = V₂ − V₁</pre>
<p>ถ้าเป็น central line หรือ N₁ ≤ 900 ปริมาตรที่ใช้จริง (effective volume) เท่ากับ total volume</p>

<h3 id="manual-s5a">5a. Rate I และ Rate II</h3>
<p>ทั้งสองวิธีให้ rate ของตัวเอง โดยใช้ effective volume ของวิธีนั้น</p>
<pre>Effective Volume I  = N₁(I)  &gt; 900 &amp;&amp; peripheral ? N₁(I)  × Total Volume I  ÷ 900 : Total Volume I
Effective Volume II = N₁(II) &gt; 900 &amp;&amp; peripheral ? N₁(II) × Total Volume II ÷ 900 : Total Volume II

Rate I  (mL/hr) = Effective Volume I  ÷ Infusion Duration
Rate II (mL/hr) = Effective Volume II ÷ Infusion Duration</pre>
<p>rate ทั้งสองค่าแสดงเป็นตัวอักษรขนาดใหญ่ในส่วนผลลัพธ์ ส่วน PNG export แสดง rate ของวิธีที่เลือก</p>

<h3 id="manual-s6">6. Glucose Infusion Rate (GIR)</h3>
<pre>GIR (mg/kg/min) = (Dextrose (g) × 1000) ÷ (Weight (kg) × Duration (hr) × 60)</pre>
<p>เกณฑ์ความปลอดภัย</p>
<div class="manual-table-wrap">
<table>
  <thead><tr><th>Clinical Status</th><th>GIR สูงสุด</th><th>ช่วงปกติ</th></tr></thead>
  <tbody>
    <tr><td>Stable</td><td>7 mg/kg/min</td><td>4–7 mg/kg/min</td></tr>
    <tr><td>Critical</td><td>5 mg/kg/min</td><td>4–5 mg/kg/min</td></tr>
  </tbody>
</table>
</div>
<p>เกินเกณฑ์ → เตือนความเสี่ยง hyperglycemia และ hepatic steatosis</p>

<h3 id="manual-s7">7. Total Calories</h3>
<pre>Calories (kcal) = (Protein (g) × 4) + (Dextrose (g) × 3.4) + (Lipid (g) × 10)</pre>

<h3 id="manual-s8">8. IVLE (Lipid) Infusion Rates</h3>
<pre>IVLE Hourly (g/kg/hr) = Lipid (g) ÷ Weight (kg) ÷ IVLE Duration (hr)
IVLE Daily  (g/kg/day) = Lipid (g) ÷ Weight (kg)</pre>
<p>ขีดจำกัดความปลอดภัย</p>
<div class="manual-table-wrap">
<table>
  <thead><tr><th>Parameter</th><th>ขีดจำกัด</th></tr></thead>
  <tbody>
    <tr><td>Hourly rate</td><td>≤ 0.11 g/kg/hr</td></tr>
    <tr><td>Daily dose</td><td>≤ 1.5 g/kg/day</td></tr>
  </tbody>
</table>
</div>

<h3 id="manual-s9">9. Calcium–Phosphate Compatibility</h3>
<p>ตรวจทั้ง 4 ข้อแยกตามวิธี โดยใช้ความเข้มข้นต่อลิตรของ Effective Volume (V₂ ถ้าเจือจางแบบ peripheral ไม่เช่นนั้นใช้ Total Volume; central line ไม่เจือจาง)</p>
<pre>V_eff        = Effective Volume I (Method 1)  or  Effective Volume II (Method 2)
Ca (mEq/L)   = Ca (mEq) ÷ (V_eff ÷ 1000)
Ca (mmol/L)  = Ca (mEq) × 0.5 ÷ (V_eff ÷ 1000)
PO₄ (mEq/L)  = PO₄ (mmol) × 2 ÷ (V_eff ÷ 1000)
PO₄ (mmol/L) = PO₄ (mmol) ÷ (V_eff ÷ 1000)</pre>
<div class="manual-table-wrap">
<table>
  <thead><tr><th>ข้อ</th><th>เกณฑ์</th><th>ความเสี่ยงถ้าไม่ผ่าน</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Ca (mEq/L) + PO₄ (mEq/L) ≤ 45</td><td>Precipitation</td></tr>
    <tr><td>2</td><td>Ca (mEq/L) ≤ 15 AND PO₄ (mEq/L) ≤ 30</td><td>Precipitation</td></tr>
    <tr><td>3</td><td>Ca (mmol/L) / PO₄ (mmol/L) &lt; 0.5</td><td>Precipitation</td></tr>
    <tr><td>4</td><td>Ca (mmol/L) × PO₄ (mmol/L) ≤ 75</td><td>Precipitation</td></tr>
  </tbody>
</table>
</div>
<p>ไม่ผ่านข้อใดข้อหนึ่ง → แจ้งเตือนระดับ danger</p>
<h4>คำแนะนำเติม Sterile water</h4>
<p>เมื่อมีข้อที่ไม่ผ่าน จะแสดงปริมาตรรวมขั้นต่ำที่ทำให้ผ่านข้อ 1, 2 และ 4 เป็นคำแนะนำ</p>
<p>ข้อ 3 เป็นอัตราส่วน เติมน้ำแล้วค่าไม่เปลี่ยน ถ้าไม่ผ่านต้องปรับ Ca หรือ PO₄ แทน</p>
<pre>V_req (mL)    = max( (Ca + PO₄ × 2) ÷ 45,              ← check 1
                     Ca ÷ 15,  PO₄ × 2 ÷ 30,           ← check 2
                     √(Ca × 0.5 × PO₄ ÷ 75) ) × 1000   ← check 4
V_target (mL) = ceil(V_req)                            (only when check 1, 2 or 4 fails)
SWI add (mL)  = V_target − V_eff                       (on top of the dilution water, if any)</pre>
<p>เป็นคำแนะนำเท่านั้น ผลลัพธ์หลักไม่เปลี่ยน ให้เติมน้ำผ่านช่องปริมาตร custom ใน print modal (หัวข้อ 12)</p>
<p>ถ้า V_target &gt; 1,200 mL จะมีคำเตือนให้พิจารณาแบ่ง 2 ถุง</p>

<h3 id="manual-s10">10. Chloride Maximum Hint (Acetate Mode)</h3>
<p>เมื่อเปิด acetate จะมีคำแนะนำแบบ live เพื่อไม่ให้ค่า Cl ทำให้ปริมาตร electrolyte ติดลบ</p>
<pre>Cl_max = Na + K − K₂HPO₄ − Glycophos×2
       = Na + K − PO₄×2           [since K₂HPO₄ + Glycophos×2 = PO₄×2 in every case]</pre>
<p>K₂HPO₄ และ Glycophos ใช้การเลือกแหล่ง phosphate ตามหัวข้อ 2</p>

<h3 id="manual-s11">11. Split Bags (Peripheral หรือ Central, volume &gt; 1,200 mL)</h3>
<p>แบ่งถุงเมื่อ <code>venous access = peripheral or central</code> และ <code>max(effectiveVolume, effectiveVolume2) &gt; 1,200 mL</code></p>
<p>central line ไม่มีการเจือจาง ค่านี้จึงเท่ากับ <code>max(totalVolume1, totalVolume2)</code></p>
<p>Vol I (K₂HPO₄) และ Vol II (NaCl) อาจต่างกันเมื่อใช้ Acetate หรือ Glycophos ถ้าวิธีใดเกิน 1,200 mL จะแบ่งถุงทั้งสองวิธี</p>
<p>สารละลายทั้งหมดถูกแบ่งเป็น 2 ถุงเท่ากัน เพื่อไม่ให้แต่ละถุงเกิน 1,200 mL</p>

<h4>การแบ่ง input</h4>
<pre>Each bag receives half of: Na, K, Cl, PO₄, Protein Solution, Dextrose Solution</pre>
<p>การกระจาย Ca และ Mg เลือกได้ด้วยปุ่มในส่วนแบ่งถุง (หลังกดคำนวณ)</p>
<p>ค่าเริ่มต้นคือ <strong>equal</strong> เมื่อสลับโหมดจะคำนวณใหม่โดยไม่เลื่อนหน้าจอ</p>
<div class="manual-table-wrap">
<table>
  <thead><tr><th>โหมด</th><th>Bag A (ถุงที่ 1)</th><th>Bag B (ถุงที่ 2)</th></tr></thead>
  <tbody>
    <tr><td><code>separate</code></td><td>Ca_A = Ca, Mg_A = Mg</td><td>Ca_B = 0, Mg_B = 0</td></tr>
    <tr><td><code>equal</code></td><td>Ca_A = Ca/2, Mg_A = Mg/2</td><td>Ca_B = Ca/2, Mg_B = Mg/2</td></tr>
  </tbody>
</table>
</div>
<p>Addamel และวิตามิน (Soluvit, Cernevit, B complex) อยู่บนฉลากของ Bag A เท่านั้นเสมอ</p>

<h4>การคำนวณ electrolyte ต่อถุง</h4>
<p>แต่ละถุงเรียก <code>calculateElectrolytes()</code> แยกกันด้วย input ของถุงนั้น</p>
<pre>Bag A: calculateElectrolytes(method, Na/2, K/2, Cl/2, Ca_A, Mg_A, PO₄/2, useAcetate)
Bag B: calculateElectrolytes(method, Na/2, K/2, Cl/2, Ca_B, Mg_B, PO₄/2, useAcetate)</pre>
<p>คำนวณทั้ง Method 1 (K₂HPO₄ first) และ Method 2 (NaCl first) สำหรับทุกถุง</p>
<p>การเลือกแหล่ง phosphate (หัวข้อ 2) ทำแยกต่อถุงด้วย K/2 และ PO₄/2 สัดส่วน K₂HPO₄ / Glycophos จึงเท่ากับกรณีถุงเดียว</p>

<h4>ปริมาตรต่อถุง</h4>
<pre>vol_Bag (mL) = (Protein Solution ÷ 2) + (Dextrose Solution ÷ 2) + Σ Electrolyte Vol (bag)</pre>

<h4>Osmolarity ต่อถุง</h4>
<p>ใช้สูตรเดียวกับหัวข้อ 4 กับ input ของแต่ละถุง</p>
<p><code>aminoAcidOsmolarity</code> ถูกหารครึ่ง ส่วน Ca/Mg เป็นไปตามโหมดที่เลือก</p>
<pre>osm_Bag (mOsm) = (aminoAcidOsmolarity ÷ 2)
               + (Dextrose ÷ 2) × 5
               + (Na/2 − Na_glycophos_Bag) × 2
               + Na_glycophos_Bag × 3
               + (K/2) × 2
               + Mg_Bag × 1
               + Ca_Bag × 1.4</pre>
<p>หมายเหตุ: ค่านี้เป็น mOsm รวม ไม่ใช่ mOsm/L ความเข้มข้นเป็น mOsm/L = <code>osm_Bag × 1000 ÷ vol_Bag</code></p>

<h4>การเจือจางต่อถุง (peripheral)</h4>
<p>เฉพาะ peripheral: แต่ละถุงเจือจางแยกกัน ถ้าความเข้มข้นของถุงนั้นเกิน 900 mOsm/L</p>
<p>ถุงของ central line ไม่เจือจาง (<code>effVol_Bag = vol_Bag</code>, extraWater = 0) badge osmolarity แสดงเพื่อเป็นข้อมูลเท่านั้น และเติม sterile water ภายหลังได้ที่ช่องปริมาตร custom ใน print modal</p>
<pre>If (osm_Bag × 1000 ÷ vol_Bag) &gt; 900:
  effVol_Bag (mL) = osm_Bag × 1000 ÷ 900
  extraWater (mL) = effVol_Bag − vol_Bag
Else:
  effVol_Bag = vol_Bag, extraWater = 0</pre>

<h4>ตรวจ Ca–PO₄ compatibility</h4>
<p>ตรวจกับ effective volume ของ Bag A แยกตามวิธี โดยใช้ Ca_A และ PO₄ ที่หารครึ่ง</p>
<pre>effVol_BagA  = effVol of Bag A, Method 1  or  Method 2
Ca (mEq/L)   = Ca_A (mEq) ÷ (effVol_BagA ÷ 1000)
Ca (mmol/L)  = Ca_A (mEq) × 0.5 ÷ (effVol_BagA ÷ 1000)
PO₄ (mEq/L)  = (PO₄ ÷ 2) × 2 ÷ (effVol_BagA ÷ 1000)
PO₄ (mmol/L) = (PO₄ ÷ 2) ÷ (effVol_BagA ÷ 1000)</pre>
<p>ใช้เกณฑ์ 4 ข้อและคำแนะนำเติม sterile water เดียวกับหัวข้อ 9 (ใช้ Ca_A, PO₄ ÷ 2 และ effVol_BagA) คำเตือนขึ้นเมื่อ V_target &gt; 1,200 mL ต่อถุง</p>
<p>เมื่อแบ่งถุงแล้ว ซ่อนกล่อง Ca–PO₄ ของถุงเดียว แสดงเฉพาะผลตรวจรายถุงที่ท้ายส่วนแบ่งถุง โดยหัวข้อระบุ V₂ เมื่อถุงนั้นเจือจาง</p>
<ul>
  <li><code>separate</code>: Bag B มี Ca = 0 → ไม่มีความเสี่ยงตกตะกอน</li>
  <li><code>equal</code>: Bag A และ Bag B มีส่วนประกอบเหมือนกัน ตรวจครั้งเดียวครอบคลุมทั้งสองถุง</li>
</ul>

<h3 id="manual-s12">12. Custom Bag Volume &amp; Final Osmolarity (Print)</h3>
<p>ใน print preview ฉลากแต่ละใบ (กรณีแบ่งถุงคือถุงละใบ แยกตามวิธี) มีช่องกรอกปริมาตรรวม</p>
<p>ปริมาตรที่คำนวณได้คือค่า<strong>ขั้นต่ำ</strong> ถ้ากรอกมากกว่านั้น ส่วนที่เกินเติมด้วย sterile water</p>
<p>มีผลเฉพาะฉลาก (preview, PNG, print) ไม่กระทบผลลัพธ์หลัก</p>
<pre>V_base  = Protein Sol + Dextrose Sol + Σ Electrolyte Sol   (no water, no lipid)
V_min   = Effective Volume (V₂ if diluted, else V_base)    — per bag / per method
V_final = max(V_custom, V_min)                              (default V_min)

Sterile Water (mL)      = V_final − V_base
Rate (mL/hr)            = V_final ÷ Infusion Duration
Final Osmolarity (mOsm/L) = Osmolarity (mOsm) × 1000 ÷ V_final</pre>
<p>ถุงเดียวใช้ Osmolarity จากหัวข้อ 4 ส่วนกรณีแบ่งถุงใช้ <code>osm_Bag</code> จากหัวข้อ 11</p>
<p>ฉลากแสดง <strong>Total volume</strong> และ <strong>Osmolarity (mOsm/L)</strong> ใต้ Rate</p>
<p>ถ้าการตรวจ Ca–PO₄ แนะนำให้เติมน้ำเพิ่ม (หัวข้อ 9) ช่องกรอกจะแสดง hint ค่า V_target แต่ค่าเริ่มต้นยังเป็น V_min</p>
<p>กรณีแบ่งถุงแสดง hint ที่ Bag A และที่ Bag B เฉพาะโหมด <code>equal</code></p>
<p>ค่าที่กรอกเองจะถูกล้างทุกครั้งที่กดคำนวณใหม่</p>

<h2 id="manual-outputs">สรุปผลลัพธ์ (Outputs Summary)</h2>
<div class="manual-table-wrap">
<table>
  <thead><tr><th>Output</th><th>สูตร</th><th>หน่วย</th></tr></thead>
  <tbody>
    <tr><td>Total Volume I</td><td>Protein + Dextrose + Electrolyte (K₂HPO₄ method)</td><td>mL</td></tr>
    <tr><td>Total Volume II</td><td>Protein + Dextrose + Electrolyte (NaCl method)</td><td>mL</td></tr>
    <tr><td>Volume I with Lipid</td><td>Total Volume I + Lipid Sol</td><td>mL</td></tr>
    <tr><td>Volume II with Lipid</td><td>Total Volume II + Lipid Sol</td><td>mL</td></tr>
    <tr><td>Osmolarity</td><td>AA + Dextrose×5 + Na_other×2 + Na_glycophos×3 + K×2 + Mg×1 + Ca×1.4</td><td>mOsm</td></tr>
    <tr><td>N₁</td><td>Osmolarity × 1000 ÷ Vol (แยกตามวิธี, ไม่รวม lipid)</td><td>mOsm/L</td></tr>
    <tr><td>V₂ (diluted)</td><td>N₁ × Vol ÷ 900 (แยกตามวิธี)</td><td>mL</td></tr>
    <tr><td>Extra Water</td><td>V₂ − Vol (แยกตามวิธี, พิมพ์บนฉลาก)</td><td>mL</td></tr>
    <tr><td>Final Osmolarity</td><td>Osmolarity × 1000 ÷ V_final (ฉลาก)</td><td>mOsm/L</td></tr>
    <tr><td>Rate I</td><td>Effective Volume I ÷ Duration (K₂HPO₄ method)</td><td>mL/hr</td></tr>
    <tr><td>Rate II</td><td>Effective Volume II ÷ Duration (NaCl method)</td><td>mL/hr</td></tr>
    <tr><td>GIR</td><td>Dextrose×1000 ÷ (Weight×Duration×60)</td><td>mg/kg/min</td></tr>
    <tr><td>Total Calories</td><td>Protein×4 + Dextrose×3.4 + Lipid×10</td><td>kcal</td></tr>
    <tr><td>IVLE Hourly</td><td>Lipid ÷ Weight ÷ IVLE Duration</td><td>g/kg/hr</td></tr>
    <tr><td>IVLE Daily</td><td>Lipid ÷ Weight</td><td>g/kg/day</td></tr>
  </tbody>
</table>
</div>

<h2 id="manual-alerts">เงื่อนไขการแจ้งเตือน (Safety Alert Logic)</h2>
<div class="manual-table-wrap">
<table>
  <thead><tr><th>เงื่อนไข</th><th>ระดับการแจ้งเตือน</th></tr></thead>
  <tbody>
    <tr><td>ปริมาตร electrolyte ติดลบ</td><td>Danger — input ไม่สมดุล</td></tr>
    <tr><td>N₁ &gt; 900 mOsm/L + peripheral line</td><td>Danger — ต้องเจือจาง</td></tr>
    <tr><td>N₁ &gt; 900 mOsm/L + central line</td><td>Warning — ต้องให้ทาง central line</td></tr>
    <tr><td>GIR &gt; เกณฑ์</td><td>Danger — เสี่ยง hyperglycemia/steatosis</td></tr>
    <tr><td>IVLE hourly &gt; 0.11 g/kg/hr</td><td>Danger</td></tr>
    <tr><td>IVLE daily &gt; 1.5 g/kg/day</td><td>Danger</td></tr>
    <tr><td>ตรวจ Ca–PO₄ ไม่ผ่าน</td><td>Danger — เสี่ยงตกตะกอน</td></tr>
    <tr><td>ตรวจ Ca–PO₄ ไม่ผ่าน</td><td>Info — แนะนำปริมาณ SWI / ปริมาตรรวม</td></tr>
    <tr><td>Ca–PO₄ V_target &gt; 1,200 mL</td><td>ข้อความเตือน — ควรพิจารณาแบ่งถุง</td></tr>
    <tr><td>ผ่านทุกข้อ (osmolarity, GIR, IVLE)</td><td>Success</td></tr>
  </tbody>
</table>
</div>
<p>แสดงลำดับการผสมเสมอ: <strong>Dextrose + AA → Phosphate → Electrolyte → Calcium</strong> เพื่อป้องกันการตกตะกอนของ calcium phosphate</p>
`;

function openManual() {
  const body = document.getElementById("manualBody");
  if (!body.innerHTML) {
    body.innerHTML = MANUAL_HTML;
    body.addEventListener("scroll", () => {
      document
        .getElementById("manualTopBtn")
        .classList.toggle("visible", body.scrollTop > 300);
    });
  }
  body.scrollTop = 0;
  document.getElementById("manualTopBtn").classList.remove("visible");
  document.getElementById("manualModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeManual() {
  document.getElementById("manualModal").classList.remove("active");
  document.body.style.overflow = "";
}

// เลื่อนภายใน modal โดยไม่เปลี่ยน URL hash (.manual-body เป็น position: relative)
function scrollManualTo(id) {
  const target = document.getElementById(id);
  document
    .getElementById("manualBody")
    .scrollTo({ top: target.offsetTop - 8, behavior: "smooth" });
}

function scrollManualTop() {
  document
    .getElementById("manualBody")
    .scrollTo({ top: 0, behavior: "smooth" });
}
