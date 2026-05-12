# TPN Calculator — Calculation Summary

## Inputs

| Category       | Field              | Unit                 | Notes                                   |
| -------------- | ------------------ | -------------------- | --------------------------------------- |
| Patient        | Weight             | kg                   | Required for GIR, IVLE rate             |
| Patient        | Height             | cm                   | Used for BMI only                       |
| Patient        | Clinical Status    | stable / critical    | Affects GIR threshold                   |
| Patient        | Venous Access      | central / peripheral | Affects osmolarity routing              |
| Macronutrients | Protein            | g                    | Choose Amiparen 10% or Aminoplasmal 15% |
| Macronutrients | Dextrose           | g                    | Converted from 50% solution             |
| Macronutrients | Lipid (IVLE)       | g                    | Converted from 20% emulsion             |
| Macronutrients | Infusion Duration  | hr                   | For GIR and flow rate                   |
| Macronutrients | IVLE Drip Duration | hr                   | For hourly IVLE rate                    |
| Electrolytes   | Na, K, Cl, Ca, Mg  | mEq                  |                                         |
| Electrolytes   | PO₄                | mmol                 |                                         |
| Electrolytes   | Acetate Mode       | yes / no             | Controls Cl input visibility            |

---

## Step-by-Step Calculations

### 1. Macronutrient Solution Volumes

```
Protein Solution (mL) = Protein (g) × 100 ÷ Concentration
  - Amiparen 10%:    Protein × 100 ÷ 10
  - Aminoplasmal 15%: Protein × 100 ÷ 15

Dextrose Solution (mL) = Dextrose (g) × 100 ÷ 50   [50% solution]

Lipid Solution (mL) = Lipid (g) × 100 ÷ 20         [20% emulsion]
```

---

### 2. Electrolyte Solution Volumes

Two parallel methods are computed and presented side-by-side.

#### Shared components (both methods)

```
10% Ca Gluconate (mL) = Ca (mEq) ÷ 0.5
50% MgSO₄ (mL)        = Mg (mEq) ÷ 4
```

#### Phosphate source selection

```
If PO₄ > 0 AND K > 0:
  8.71% K₂HPO₄ (mL) = PO₄ (mmol) ÷ 0.5      → provides 2 mEq K per mmol PO₄
  Glycophos = 0
Else if PO₄ > 0 AND K = 0:
  Glycophos (mL) = PO₄ (mmol) ÷ 1
  8.71% K₂HPO₄ = 0
```

#### Method 1 — K₂HPO₄ First (with acetate)

Prioritises K₂HPO₄ for potassium, then distributes remaining K and Na:

```
15% KCl (mL)   = (K − K₂HPO₄) ÷ 2
29.4% KAc (mL) = (K − K₂HPO₄ − KCl×2) ÷ 3
3% NaCl (mL)   = (Cl − KCl×2) ÷ 0.5
24.6% NaAc (mL) = (Na − NaCl×0.5 − Glycophos×2) ÷ 3
```

#### Method 1 — K₂HPO₄ First (no acetate)

```
15% KCl (mL) = (K − K₂HPO₄) ÷ 2
3% NaCl (mL) = (Na − Glycophos×2) ÷ 0.5
KAc = 0, NaAc = 0
Cl auto-derived: Cl = K − K₂HPO₄ + Na − Glycophos×2
```

#### Method 2 — NaCl First (with acetate)

Prioritises NaCl using the smaller of Na or Cl, then allocates remainders:

```
3% NaCl (mL)   = min(Na, Cl) ÷ 0.5
15% KCl (mL)   = (Cl − NaCl×0.5) ÷ 2
29.4% KAc (mL) = (K − K₂HPO₄ − (Cl − NaCl×0.5)) ÷ 3
24.6% NaAc (mL) = (Na − NaCl×0.5 − Glycophos×2) ÷ 3
```

#### Method 2 — NaCl First (no acetate)

```
3% NaCl (mL) = Na ÷ 0.5
15% KCl (mL) = (K − K₂HPO₄) ÷ 2
KAc = 0, NaAc = 0
```

---

### 3. Total Volumes

```
Total Volume I  (mL) = Protein Sol + Dextrose Sol + Σ Electrolyte Sol (Method 1)
Total Volume II (mL) = Protein Sol + Dextrose Sol + Σ Electrolyte Sol (Method 2)

Volume I  with Lipid (mL) = Total Volume I  + Lipid Sol
Volume II with Lipid (mL) = Total Volume II + Lipid Sol
```

Lipid is infused separately (IVLE bag); volumes are shown combined for reference.

---

### 4. Osmolarity

```
Osmolarity (mOsm/L) =
  (Protein Sol mL × AA_factor)   ← product-specific
  + Dextrose (g) × 5
  + Na (mEq) × 2
  + K  (mEq) × 2
  + Mg (mEq) × 1
  + Ca (mEq) × 1.4

AA_factor:
  Amiparen 10%:    0.960 mOsm/mL  (960 mOsm/L)
  Aminoplasmal 15%: 1.290 mOsm/mL (1290 mOsm/L)
```

---

### 5. Peripheral Dilution (when needed)

Triggered when `Osmolarity > 900 mOsm/L` AND venous access is `peripheral`.

```
V₂ (mL)         = (Osmolarity × Total Volume I) ÷ 900
Extra Water (mL) = V₂ − Total Volume I
Flow Rate        = V₂ ÷ Infusion Duration
```

If central line or osmolarity ≤ 900, flow rate uses Total Volume I directly:

```
Flow Rate (mL/hr) = Total Volume I ÷ Infusion Duration
```

---

### 6. Glucose Infusion Rate (GIR)

```
GIR (mg/kg/min) = (Dextrose (g) × 1000) ÷ (Weight (kg) × Duration (hr) × 60)
```

Safety thresholds:

| Clinical Status | Max GIR     | Normal Range  |
| --------------- | ----------- | ------------- |
| Stable          | 7 mg/kg/min | 4–7 mg/kg/min |
| Critical        | 5 mg/kg/min | 4–5 mg/kg/min |

Exceeding threshold → warning: risk of hyperglycemia and hepatic steatosis.

---

### 7. Total Calories

```
Calories (kcal) = (Protein (g) × 4) + (Dextrose (g) × 3.4) + (Lipid (g) × 10)
```

---

### 8. IVLE (Lipid) Infusion Rates

```
IVLE Hourly (g/kg/hr) = Lipid (g) ÷ Weight (kg) ÷ IVLE Duration (hr)
IVLE Daily  (g/kg/day) = Lipid (g) ÷ Weight (kg)
```

Safety limits:

| Parameter   | Limit          |
| ----------- | -------------- |
| Hourly rate | ≤ 0.11 g/kg/hr |
| Daily dose  | ≤ 1.5 g/kg/day |

---

### 9. Calcium–Phosphate Compatibility

All four checks are evaluated using concentrations per litre of Total Volume I.

```
Ca (mEq/L)   = Ca (mEq) ÷ (Total Volume I ÷ 1000)
Ca (mmol/L)  = Ca (mEq) × 0.5 ÷ (Total Volume I ÷ 1000)
PO₄ (mEq/L)  = PO₄ (mmol) × 2 ÷ (Total Volume I ÷ 1000)
PO₄ (mmol/L) = PO₄ (mmol) ÷ (Total Volume I ÷ 1000)
```

| Check | Criterion                            | Failure risk  |
| ----- | ------------------------------------ | ------------- |
| 1     | Ca (mEq/L) + PO₄ (mEq/L) ≤ 45        | Precipitation |
| 2     | Ca (mEq/L) ≤ 15 AND PO₄ (mEq/L) ≤ 30 | Precipitation |
| 3     | Ca (mmol/L) / PO₄ (mmol/L) < 0.5     | Precipitation |
| 4     | Ca (mmol/L) × PO₄ (mmol/L) ≤ 75      | Precipitation |

Any failed check triggers a danger alert.

---

### 10. Chloride Maximum Hint (Acetate Mode)

When acetate is enabled, a live hint prevents Cl from creating negative electrolyte volumes:

```
Cl_max = Na + K − K₂HPO₄ − Glycophos×2
       = Na + K − (PO₄ ÷ 0.5)    [when K > 0]
       = Na + K − PO₄×2           [simplified]
```

---

## Outputs Summary

| Output               | Formula                                          | Unit      |
| -------------------- | ------------------------------------------------ | --------- |
| Total Volume I       | Protein + Dextrose + Electrolyte (K₂HPO₄ method) | mL        |
| Total Volume II      | Protein + Dextrose + Electrolyte (NaCl method)   | mL        |
| Volume I with Lipid  | Total Volume I + Lipid Sol                       | mL        |
| Volume II with Lipid | Total Volume II + Lipid Sol                      | mL        |
| Osmolarity           | AA + Dextrose×5 + Na×2 + K×2 + Mg×1 + Ca×1.4     | mOsm/L    |
| V₂ (diluted)         | Osmolarity × Vol I ÷ 900                         | mL        |
| Extra Water          | V₂ − Vol I                                       | mL        |
| Flow Rate            | Effective Volume ÷ Duration                      | mL/hr     |
| GIR                  | Dextrose×1000 ÷ (Weight×Duration×60)             | mg/kg/min |
| Total Calories       | Protein×4 + Dextrose×3.4 + Lipid×10              | kcal      |
| IVLE Hourly          | Lipid ÷ Weight ÷ IVLE Duration                   | g/kg/hr   |
| IVLE Daily           | Lipid ÷ Weight                                   | g/kg/day  |

---

## Safety Alert Logic

| Condition                          | Alert Level                            |
| ---------------------------------- | -------------------------------------- |
| Negative electrolyte volume        | Danger — imbalanced inputs             |
| Osmolarity > 900 + peripheral line | Danger — must dilute                   |
| Osmolarity > 900 + central line    | Warning — central line required        |
| GIR > threshold                    | Warning — hyperglycemia/steatosis risk |
| IVLE hourly > 0.11 g/kg/hr         | Warning                                |
| IVLE daily > 1.5 g/kg/day          | Warning                                |
| Ca–PO₄ check fails                 | Danger — precipitation risk            |
| All checks pass                    | Success                                |

Mixing order reminder is always shown: **Dextrose + AA → Phosphate → Electrolyte → Calcium** to prevent calcium phosphate precipitation.
