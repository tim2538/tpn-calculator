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

K₂HPO₄ is used first, limited by the ordered K (1 mEq K per mL); any remaining PO₄ comes from Glycophos (1 mmol PO₄ + 2 mEq Na per mL).

```
8.71% K₂HPO₄ (mL) = min(PO₄ (mmol) ÷ 0.5, K (mEq))   [0 if PO₄ = 0 or K = 0]
Glycophos (mL)    = PO₄ (mmol) − K₂HPO₄ × 0.5

  K ≥ PO₄×2      → K₂HPO₄ = PO₄ ÷ 0.5, Glycophos = 0
  0 < K < PO₄×2  → K₂HPO₄ = K, Glycophos = PO₄ − K×0.5   (split; prevents negative KAc/KCl)
  K = 0          → K₂HPO₄ = 0, Glycophos = PO₄
```

Na from Glycophos (Glycophos × 2) is subtracted from Na in the NaAc / NaCl formulas below.

Example: K 20, PO₄ 12 → K₂HPO₄ = min(24, 20) = 20 mL, Glycophos = 12 − 10 = 2 mL (Na 4 mEq).

#### Method 1 — K₂HPO₄ First (with acetate)

Prioritises K₂HPO₄ for potassium, then distributes remaining K and Na:

```
15% KCl (mL)   = min(K − K₂HPO₄, Cl) ÷ 2   [0 if K ≤ K₂HPO₄ or Cl = 0]
29.4% KAc (mL) = (K − K₂HPO₄ − KCl×2) ÷ 3
3% NaCl (mL)   = (Cl − KCl×2) ÷ 0.5
24.6% NaAc (mL) = (Na − NaCl×0.5 − Glycophos×2) ÷ 3
```

KCl is capped by Cl so NaCl never goes negative; any K left over goes to KAc.

Example: Na 20, K 100, Cl 40, PO₄ 12 → K₂HPO₄ 24, KCl = min(76, 40) ÷ 2 = 20, KAc = (76 − 40) ÷ 3 = 12, NaCl = 0, NaAc = 20 ÷ 3 = 6.67.

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
Osmolarity (mOsm) =
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
  Aminoplasmal 15%: 1.290 mOsm/mL (1290 mOsm/L)
```

---

### 5. Peripheral Dilution (when needed)

Osmolarity from Section 4 is a total (mOsm). It is first converted to a concentration
using the volume **without lipid** (V₁), separately for each method:

```
N₁ (mOsm/L) = Osmolarity (mOsm) × 1000 ÷ V₁
  V₁ = Total Volume I  (Method 1)  or  Total Volume II (Method 2)
```

Dilution is triggered per method when `N₁ > 900 mOsm/L` AND venous access is `peripheral`.
It uses N₁V₁ = N₂V₂ with N₂ = 900 mOsm/L:

```
V₂ (mL)          = N₁ × V₁ ÷ 900        (= Osmolarity × 1000 ÷ 900)
Extra Water (mL) = V₂ − V₁
```

If central line or N₁ ≤ 900, effective volume equals the total volume directly.

---

### 5a. Rate I and Rate II

Both methods produce a rate. Each uses its own effective volume:

```
Effective Volume I  = N₁(I)  > 900 && peripheral ? N₁(I)  × Total Volume I  ÷ 900 : Total Volume I
Effective Volume II = N₁(II) > 900 && peripheral ? N₁(II) × Total Volume II ÷ 900 : Total Volume II

Rate I  (mL/hr) = Effective Volume I  ÷ Infusion Duration
Rate II (mL/hr) = Effective Volume II ÷ Infusion Duration
```

Both rates are displayed as large text in the right panel and the PNG export shows the rate matching the selected method.

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

All four checks are evaluated per method, using concentrations per litre of the Effective Volume
(V₂ when peripheral dilution applies, otherwise Total Volume; central line is never diluted).

```
V_eff        = Effective Volume I (Method 1)  or  Effective Volume II (Method 2)
Ca (mEq/L)   = Ca (mEq) ÷ (V_eff ÷ 1000)
Ca (mmol/L)  = Ca (mEq) × 0.5 ÷ (V_eff ÷ 1000)
PO₄ (mEq/L)  = PO₄ (mmol) × 2 ÷ (V_eff ÷ 1000)
PO₄ (mmol/L) = PO₄ (mmol) ÷ (V_eff ÷ 1000)
```

| Check | Criterion                            | Failure risk  |
| ----- | ------------------------------------ | ------------- |
| 1     | Ca (mEq/L) + PO₄ (mEq/L) ≤ 45        | Precipitation |
| 2     | Ca (mEq/L) ≤ 15 AND PO₄ (mEq/L) ≤ 30 | Precipitation |
| 3     | Ca (mmol/L) / PO₄ (mmol/L) < 0.5     | Precipitation |
| 4     | Ca (mmol/L) × PO₄ (mmol/L) ≤ 75      | Precipitation |

Any failed check triggers a danger alert.

#### Sterile water recommendation

When a check fails, the minimum total volume that passes checks 1, 2 and 4 is shown as a recommendation.
Check 3 is a ratio, so adding water does not change it; if it fails, Ca or PO₄ must be adjusted instead.

```
V_req (mL)    = max( (Ca + PO₄ × 2) ÷ 45,              ← check 1
                     Ca ÷ 15,  PO₄ × 2 ÷ 30,           ← check 2
                     √(Ca × 0.5 × PO₄ ÷ 75) ) × 1000   ← check 4
V_target (mL) = ceil(V_req)                            (only when check 1, 2 or 4 fails)
SWI add (mL)  = V_target − V_eff                       (on top of the dilution water, if any)
```

It is advisory only: the main results are unchanged, and the water is added via the custom bag volume in the print modal (Section 12).
If V_target > 1,200 mL, a warning suggests splitting into 2 bags.

---

### 10. Chloride Maximum Hint (Acetate Mode)

When acetate is enabled, a live hint prevents Cl from creating negative electrolyte volumes:

```
Cl_max = Na + K − K₂HPO₄ − Glycophos×2
       = Na + K − PO₄×2           [since K₂HPO₄ + Glycophos×2 = PO₄×2 in every case]
```

K₂HPO₄ and Glycophos follow the phosphate source selection in Section 2.

---

### 11. Split Bags (Peripheral or Central, volume > 1,200 mL)

Triggered when `venous access = peripheral or central` AND `max(effectiveVolume, effectiveVolume2) > 1,200 mL`.
For central line there is no dilution, so this equals `max(totalVolume1, totalVolume2)`.
Vol I (K₂HPO₄) and Vol II (NaCl) can differ when Acetate or Glycophos is used; if either one exceeds 1,200 mL, both methods are split.
The total solution is split into two equal bags to stay within the 1,200 mL per-bag volume limit.

#### Input splitting

```
Each bag receives half of: Na, K, Cl, PO₄, Protein Solution, Dextrose Solution
```

Ca and Mg distribution is chosen with a toggle in the split section (after calculating).
Default is **separate**; switching re-runs the calculation without scrolling.

| Mode       | Bag A (ถุงที่ 1)        | Bag B (ถุงที่ 2)        |
| ---------- | ----------------------- | ----------------------- |
| `separate` | Ca_A = Ca, Mg_A = Mg    | Ca_B = 0, Mg_B = 0      |
| `equal`    | Ca_A = Ca/2, Mg_A = Mg/2 | Ca_B = Ca/2, Mg_B = Mg/2 |

Addamel and vitamins (Soluvit, Cernevit, B complex) are always on Bag A's label only.

#### Electrolyte calculation per bag

Each bag runs `calculateElectrolytes()` independently with its own inputs:

```
Bag A: calculateElectrolytes(method, Na/2, K/2, Cl/2, Ca_A, Mg_A, PO₄/2, useAcetate)
Bag B: calculateElectrolytes(method, Na/2, K/2, Cl/2, Ca_B, Mg_B, PO₄/2, useAcetate)
```

Both Method 1 (K₂HPO₄ first) and Method 2 (NaCl first) are computed for each bag.
The phosphate source selection (Section 2) is applied per bag with K/2 and PO₄/2, so the K₂HPO₄ / Glycophos ratio is the same as the single-bag result.

#### Per-bag volume

```
vol_Bag (mL) = (Protein Solution ÷ 2) + (Dextrose Solution ÷ 2) + Σ Electrolyte Vol (bag)
```

#### Per-bag osmolarity

Same formula as Section 4, applied to each bag's own inputs.
`aminoAcidOsmolarity` is halved; Ca/Mg follow the selected mode.

```
osm_Bag (mOsm) = (aminoAcidOsmolarity ÷ 2)
               + (Dextrose ÷ 2) × 5
               + (Na/2 − Na_glycophos_Bag) × 2
               + Na_glycophos_Bag × 3
               + (K/2) × 2
               + Mg_Bag × 1
               + Ca_Bag × 1.4
```

Note: these are total mOsm, not mOsm/L. Concentration in mOsm/L = `osm_Bag × 1000 ÷ vol_Bag`.

#### Per-bag peripheral dilution

Peripheral only: each bag is independently diluted if its concentration exceeds 900 mOsm/L.
Central-line bags are not diluted (`effVol_Bag = vol_Bag`, extraWater = 0); the osmolarity badge is informational only, and sterile water can be added later via the custom bag volume in the print modal.

```
If (osm_Bag × 1000 ÷ vol_Bag) > 900:
  effVol_Bag (mL) = osm_Bag × 1000 ÷ 900
  extraWater (mL) = effVol_Bag − vol_Bag
Else:
  effVol_Bag = vol_Bag, extraWater = 0
```

#### Ca–PO₄ compatibility check

Checked against Bag A's effective volume for each method, using Ca_A and halved PO₄.

```
effVol_BagA  = effVol of Bag A, Method 1  or  Method 2
Ca (mEq/L)   = Ca_A (mEq) ÷ (effVol_BagA ÷ 1000)
Ca (mmol/L)  = Ca_A (mEq) × 0.5 ÷ (effVol_BagA ÷ 1000)
PO₄ (mEq/L)  = (PO₄ ÷ 2) × 2 ÷ (effVol_BagA ÷ 1000)
PO₄ (mmol/L) = (PO₄ ÷ 2) ÷ (effVol_BagA ÷ 1000)
```

The same four criteria and sterile water recommendation from Section 9 apply (with Ca_A, PO₄ ÷ 2 and effVol_BagA); the warning is shown when V_target > 1,200 mL per bag.
When the bags are split, the single-bag section refers to the per-bag recommendation instead.

- `separate`: Bag B has Ca = 0 → no precipitation risk.
- `equal`: Bag A and Bag B have identical composition, so one check covers both bags.

---

### 12. Custom Bag Volume & Final Osmolarity (Print)

In the print preview, each label (one per bag when split, per method) has a total-volume input.
The calculated volume is the **minimum**; a larger value is filled up with sterile water.
It only affects the label (preview, PNG, print), not the main results.

```
V_base  = Protein Sol + Dextrose Sol + Σ Electrolyte Sol   (no water, no lipid)
V_min   = Effective Volume (V₂ if diluted, else V_base)    — per bag / per method
V_final = max(V_custom, V_min)                              (default V_min)

Sterile Water (mL)      = V_final − V_base
Rate (mL/hr)            = V_final ÷ Infusion Duration
Final Osmolarity (mOsm/L) = Osmolarity (mOsm) × 1000 ÷ V_final
```

Single bag uses Osmolarity from Section 4; split bags use `osm_Bag` from Section 11.
The label shows **Total volume** and **Osmolarity (mOsm/L)** under the Rate.
When the Ca–PO₄ check recommends more water (Section 9), the input shows a hint with V_target; the default stays V_min.
In split mode the hint is shown for Bag A, and for Bag B only in `equal` mode.
Custom values reset whenever the calculation is re-run.

---

## Outputs Summary

| Output               | Formula                                          | Unit      |
| -------------------- | ------------------------------------------------ | --------- |
| Total Volume I       | Protein + Dextrose + Electrolyte (K₂HPO₄ method) | mL        |
| Total Volume II      | Protein + Dextrose + Electrolyte (NaCl method)   | mL        |
| Volume I with Lipid  | Total Volume I + Lipid Sol                       | mL        |
| Volume II with Lipid | Total Volume II + Lipid Sol                      | mL        |
| Osmolarity           | AA + Dextrose×5 + Na_other×2 + Na_glycophos×3 + K×2 + Mg×1 + Ca×1.4 | mOsm |
| N₁                   | Osmolarity × 1000 ÷ Vol (per method, no lipid)   | mOsm/L    |
| V₂ (diluted)         | N₁ × Vol ÷ 900 (per method)                      | mL        |
| Extra Water          | V₂ − Vol (per method; printed on label)          | mL        |
| Final Osmolarity     | Osmolarity × 1000 ÷ V_final (label)              | mOsm/L    |
| Rate I               | Effective Volume I ÷ Duration  (K₂HPO₄ method)   | mL/hr     |
| Rate II              | Effective Volume II ÷ Duration (NaCl method)      | mL/hr     |
| GIR                  | Dextrose×1000 ÷ (Weight×Duration×60)             | mg/kg/min |
| Total Calories       | Protein×4 + Dextrose×3.4 + Lipid×10              | kcal      |
| IVLE Hourly          | Lipid ÷ Weight ÷ IVLE Duration                   | g/kg/hr   |
| IVLE Daily           | Lipid ÷ Weight                                   | g/kg/day  |

---

## Safety Alert Logic

| Condition                          | Alert Level                            |
| ---------------------------------- | -------------------------------------- |
| Negative electrolyte volume        | Danger — imbalanced inputs             |
| N₁ > 900 mOsm/L + peripheral line  | Danger — must dilute                   |
| N₁ > 900 mOsm/L + central line     | Warning — central line required        |
| GIR > threshold                    | Danger — hyperglycemia/steatosis risk  |
| IVLE hourly > 0.11 g/kg/hr         | Danger                                 |
| IVLE daily > 1.5 g/kg/day          | Danger                                 |
| Ca–PO₄ check fails                 | Danger — precipitation risk            |
| Ca–PO₄ check fails                 | Info — recommended SWI / total volume  |
| Ca–PO₄ V_target > 1,200 mL         | Warning text — consider splitting      |
| All checks pass (osmolarity, GIR, IVLE) | Success                           |

Mixing order reminder is always shown: **Dextrose + AA → Phosphate → Electrolyte → Calcium** to prevent calcium phosphate precipitation.
