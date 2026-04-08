# REPLIT PROMPT: Forge (Production) Module — Complete Rebuild

## CONTEXT FOR REPLIT

We are rebuilding the Forge (Production) module to support a real manufacturing workflow — specifically PEB (Pre-Engineered Buildings) steel fabrication. The current implementation captures basic data but lacks the depth needed for actual production tracking. 

The key business scenario: A PEB company needs to fabricate 10 columns, 10 rafters, purlins, bracings etc. for a warehouse project. Each component (e.g., one column) goes through 7 sequential operations: Cutting → Fitting → Welding → Grinding → Surface Prep → Primer Painting → Final Painting. Quality checks happen at multiple stages, not just at the end. Individual units (Column #1, #2, #3...) must be tracked separately because one column might fail QC at welding while others pass.

This module must integrate with:
- Flow (Projects) — production tasks auto-update project progress
- Vault (Inventory) — materials consumed from stock, finished goods added to stock
- Ledger (Accounts) — production costs posted to accounting

DO NOT delete existing data. Add columns to existing tables where possible, create new tables where needed. Update all related UI forms and API routes.

---

## PART 1: SCHEMA CHANGES TO EXISTING TABLES

### 1A. Update `forge_workstations` — Add these columns:

```
locationId INT FK → inventory_locations.id (nullable)
  -- Which warehouse/factory location this workstation is in
capacity INT DEFAULT 1
  -- How many jobs can run simultaneously (most machines = 1)
currentStatus ENUM('Active','Idle','Maintenance','Breakdown') DEFAULT 'Idle'
  -- Replace the existing text status field with this ENUM
maintenanceSchedule VARCHAR(255)
  -- e.g., "Every 500 hours" or "Monthly"
lastMaintenanceDate DATE
  -- When was last serviced
nextMaintenanceDate DATE
  -- When next service is due
description TEXT
  -- Already exists in UI form, ensure it's in the DB
```

### 1B. Update `forge_bom` — Add these columns:

```
productItemId INT FK → inventory_catalog.id
  -- Links to the finished product in inventory. CRITICAL for auto-adding finished goods to stock.
  -- The existing productName text field stays for display, but this FK is the real link.
version INT DEFAULT 1
  -- BOM version number. When a BOM is revised, increment this.
status ENUM('Draft','Active','Obsolete') DEFAULT 'Draft'
  -- Only 'Active' BOMs can be used in Work Orders.
  -- When a new version is created, old version becomes 'Obsolete'.
estimatedCostPerUnit DECIMAL(12,2)
  -- Auto-calculated: sum of (material costs + routing labor costs)
  -- Material cost = sum of (bom_material.qty × inventory_catalog.unitPrice)
  -- Labor cost = sum of (routing.estimatedMinutes/60 × workstation.costPerHour)
notes TEXT
```

### 1C. Update `forge_bom_routing` — Add these columns:

```
sopReference VARCHAR(100)
  -- SOP document code, e.g., "SOP-WEL-001"
sopDescription TEXT
  -- Brief description of what the SOP says to do at this step
hasQcCheck BOOLEAN DEFAULT FALSE
  -- If TRUE, this step requires a QC inspection before moving to the next step
qcChecklistJson TEXT
  -- JSON array of checklist items for this step's QC, e.g.:
  -- [{"item":"Dimensional check","type":"pass_fail"},{"item":"DFT measurement","type":"numeric","min":40,"max":60,"unit":"microns"}]
consumableMaterials TEXT
  -- JSON array of materials consumed DURING this step (not in main BOM materials list)
  -- e.g., [{"itemId":15,"itemName":"Welding Rod E7018","qtyPerUnit":0.3,"uom":"Kg"}]
  -- These are materials consumed per operation, not per finished product
setupTimeMinutes INT DEFAULT 0
  -- Time to set up the workstation before this operation can begin
```

### 1D. Update `forge_work_orders` — Add these columns:

```
projectId INT FK → projects.id (nullable)
  -- Links to Flow project. NULL if standalone production (not project-based).
taskId INT FK → tasks.id (nullable)
  -- Links to the specific project task. When WO progress updates, task % auto-updates.
productItemId INT FK → inventory_catalog.id (nullable)
  -- The finished product. Copied from BOM when BOM is linked.
productionLocationId INT FK → inventory_locations.id (nullable)
  -- Where production happens / where finished goods will be stocked.
expectedEndDate DATE
  -- Calculated from start date + total routing time × target qty, adjusted for workstation capacity
actualEndDate DATE
  -- Set when status changes to 'Completed'
currentRoutingStep INT DEFAULT 0
  -- Which step of the routing is currently active (0 = not started)
totalRoutingSteps INT DEFAULT 0
  -- Total number of steps from the BOM routing. Set when WO is created from BOM.
materialsCost DECIMAL(12,2) DEFAULT 0
  -- Actual materials consumed cost. Updated as materials are issued.
laborCost DECIMAL(12,2) DEFAULT 0
  -- Actual labor cost. Calculated from routing actual times × workstation cost/hr.
overheadCost DECIMAL(12,2) DEFAULT 0
  -- Any additional overhead
totalCost DECIMAL(12,2) DEFAULT 0
  -- materialsCost + laborCost + overheadCost
costPerUnit DECIMAL(12,2) DEFAULT 0
  -- totalCost / producedQty (calculated when WO completes)
```

### 1E. Update `forge_quality_control` — Add these columns:

```
routingStepId INT FK → forge_bom_routing.id (nullable)
  -- Which routing step this QC is for. NULL = final inspection.
unitIdentifier VARCHAR(50)
  -- Which specific unit: "Column #3", "Rafter #7". NULL = batch inspection.
inspectionType ENUM('In-Process','Final','Rework') DEFAULT 'Final'
  -- In-Process = QC during routing, Final = end of production, Rework = re-inspection after fix
result ENUM('Passed','Failed','Conditional') DEFAULT 'Passed'
  -- Conditional = passed with minor observations
checklistResultsJson TEXT
  -- JSON storing results of each checklist item from the routing step's qcChecklistJson
  -- e.g., [{"item":"Dimensional check","result":"pass"},{"item":"DFT measurement","result":"52","status":"pass"}]
reworkRequired BOOLEAN DEFAULT FALSE
reworkInstructions TEXT
  -- What needs to be fixed, e.g., "Re-weld joint J2 at flange-web intersection"
reworkWorkOrderId INT FK → forge_work_orders.id (nullable)
  -- If rework creates a new mini work order, link it here
defectCategory ENUM('Dimensional','Surface','Welding','Material','Painting','Assembly','Other') (nullable)
  -- Categorized for analytics — which type of defect occurs most often?
```

### 1F. Update `forge_downtime_logs` — Add these columns:

```
workOrderId INT FK → forge_work_orders.id (nullable)
  -- Which WO was affected by this downtime. NULL = general downtime not tied to a specific WO.
costImpact DECIMAL(12,2) DEFAULT 0
  -- Auto-calculated: totalMinutesLost / 60 × workstation.costPerHour
category ENUM('Mechanical Failure','Electrical Failure','Material Shortage','Operator Absence','Power Outage','Scheduled Maintenance','Tool Change','Setup','Other') DEFAULT 'Other'
  -- Replace the existing free-text "reason" with this ENUM for better analytics
```

---

## PART 2: NEW TABLES TO CREATE

### 2A. `forge_work_order_units` — Track individual units within a Work Order

This is the table that enables tracking Column #1 through #10 independently.

```sql
CREATE TABLE forge_work_order_units (
  id SERIAL PRIMARY KEY,
  workOrderId INT NOT NULL REFERENCES forge_work_orders(id),
  unitNumber INT NOT NULL,
    -- 1, 2, 3... up to targetQty
  unitIdentifier VARCHAR(50) NOT NULL,
    -- "Column #1", "Rafter #5" — auto-generated as "{productName} #{unitNumber}"
  currentStepSequence INT DEFAULT 0,
    -- Which routing step this unit is currently at (0 = not started)
  currentStepName VARCHAR(255),
    -- Display name of the current step, e.g., "Welding"
  status ENUM('Queued','In Progress','QC Pending','QC Passed','QC Failed','Rework','Completed','Scrapped') DEFAULT 'Queued',
  startedAt TIMESTAMP,
  completedAt TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workOrderId, unitNumber)
);
```

### 2B. `forge_production_log` — Step-by-step progress log for each unit

Every time a unit completes a routing step, a log entry is created. This is your detailed production audit trail.

```sql
CREATE TABLE forge_production_log (
  id SERIAL PRIMARY KEY,
  workOrderId INT NOT NULL REFERENCES forge_work_orders(id),
  unitId INT NOT NULL REFERENCES forge_work_order_units(id),
  routingStepId INT NOT NULL REFERENCES forge_bom_routing(id),
  sequenceNo INT NOT NULL,
    -- Copied from routing step sequence for easy ordering
  workstationId INT REFERENCES forge_workstations(id),
    -- Actual workstation used (may differ from BOM routing if machine was unavailable)
  operatorName VARCHAR(255),
    -- Who performed this operation
  status ENUM('Pending','In Progress','Completed','Skipped') DEFAULT 'Pending',
  startTime TIMESTAMP,
  endTime TIMESTAMP,
  actualMinutes INT,
    -- endTime - startTime in minutes. Compare with estimatedMinutes for efficiency.
  setupMinutes INT DEFAULT 0,
    -- Actual setup time
  qcRequired BOOLEAN DEFAULT FALSE,
    -- Copied from routing step's hasQcCheck
  qcStatus ENUM('Not Required','Pending','Passed','Failed') DEFAULT 'Not Required',
  qcRecordId INT REFERENCES forge_quality_control(id),
    -- Links to the QC inspection record for this step
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2C. `forge_material_consumption` — Track actual materials used vs BOM estimates

```sql
CREATE TABLE forge_material_consumption (
  id SERIAL PRIMARY KEY,
  workOrderId INT NOT NULL REFERENCES forge_work_orders(id),
  itemId INT NOT NULL REFERENCES inventory_catalog(id),
  itemName VARCHAR(255) NOT NULL,
    -- Denormalized for display
  bomEstimatedQty DECIMAL(10,3) NOT NULL,
    -- What the BOM says should be used (including wastage)
  actualQtyIssued DECIMAL(10,3) DEFAULT 0,
    -- What was actually issued from warehouse
  actualQtyConsumed DECIMAL(10,3) DEFAULT 0,
    -- What was actually consumed (may be less than issued — remainder returned)
  returnedQty DECIMAL(10,3) DEFAULT 0,
    -- actualQtyIssued - actualQtyConsumed = what went back to warehouse
  uom VARCHAR(20) NOT NULL,
  unitCost DECIMAL(12,2) DEFAULT 0,
    -- Cost per unit from inventory_catalog at time of issue
  totalCost DECIMAL(12,2) DEFAULT 0,
    -- actualQtyConsumed × unitCost
  variance DECIMAL(10,3) DEFAULT 0,
    -- actualQtyConsumed - bomEstimatedQty (positive = overuse, negative = saved)
  variancePercent DECIMAL(5,2) DEFAULT 0,
    -- (variance / bomEstimatedQty) × 100
  issuedFromLocationId INT REFERENCES inventory_locations(id),
  issuedDate DATE,
  issuedBy VARCHAR(255),
  stockMovementId INT,
    -- Links to stock_movements record created when materials were issued
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## PART 3: UI CHANGES

### 3A. BOM Builder Form — Redesign

Keep the current layout but add these fields and sections:

**Header section:**
- Product Name (existing) — but add an autocomplete dropdown that searches `inventory_catalog` and sets `productItemId`
- Product Code (existing)
- Output Qty (existing)
- UOM (existing)
- ADD: Version Number (read-only, auto-incremented)
- ADD: Status dropdown (Draft / Active / Obsolete)
- ADD: Estimated Cost Per Unit (read-only, auto-calculated, shown at bottom)

**Material Requirements section (existing, enhance):**
- Material from Vault (existing dropdown)
- Qty (existing)
- UOM (existing)
- Wastage % (existing)
- ADD: Unit Cost (auto-fetched from inventory_catalog.unitPrice — read-only)
- ADD: Extended Cost (calculated: qty × unitCost × (1 + wastage%/100) — read-only)

**Operational Routing section (existing, enhance):**
- Sequence number (existing — the red circled numbers)
- Workstation dropdown (existing)
- Operation Name (existing)
- Estimated Minutes (existing)
- ADD: Setup Time (minutes) — new field
- ADD: SOP Reference — text field, e.g., "SOP-WEL-001"
- ADD: QC Required — checkbox toggle
- ADD: QC Checklist — appears when QC Required is checked. Dynamic list where user can add checklist items:
  - Each item has: Description (text), Type (Pass/Fail or Numeric)
  - If Numeric: add Min Value, Max Value, Unit fields
- ADD: Consumable Materials — a small sub-table within each routing step:
  - Material (dropdown from Vault), Qty Per Unit, UOM
  - e.g., Welding step consumes 0.3 kg welding rod per column

**Bottom of form:**
- ADD: Total Estimated Material Cost (sum of all material extended costs)
- ADD: Total Estimated Labor Cost (sum of all routing steps: estimatedMinutes/60 × workstation costPerHour)
- ADD: Total Estimated Cost Per Unit (material + labor)

### 3B. Work Order Form — Redesign

**CRITICAL CHANGE: "Link to BOM" must be REQUIRED, not optional.** Remove "Manual entry" as the default. If user truly needs manual entry, they should create a BOM first. This ensures every WO has a proper material list and routing.

Replace the current form with:

**Section 1: Work Order Header**
- WO Number (existing — auto-generated, read-only)
- Priority (existing dropdown)
- Link to BOM (REQUIRED dropdown — show only 'Active' status BOMs)
  - When BOM is selected, auto-populate: Product Name, Product Code, routing steps count, estimated cost
- Product Name (auto-filled from BOM, read-only)
- Target Quantity (existing)
- Start Date (existing)
- Expected End Date (auto-calculated from routing total time × target qty, but editable)
- Production Location (new dropdown from inventory_locations)
- Project Link (new — optional dropdown from projects table. When selected, also show task dropdown filtered to that project)
- Task Link (new — optional dropdown, filtered by selected project)
- Status (Draft / Planned / In Progress / QC / Completed / On Hold / Cancelled)
- Notes (existing)

**Section 2: Routing Steps Preview (read-only, auto-loaded from BOM)**
When BOM is selected, show a table:
| Step | Workstation | Operation | Est. Time | QC Required |
This gives visibility into the full manufacturing process before starting the WO.

**Section 3: Material Requirements Preview (read-only, auto-calculated)**
When BOM is selected and target qty is entered, show:
| Material | BOM Qty (per unit) | Total Required (× target qty + wastage) | Current Stock | Sufficient? |
This auto-checks inventory and highlights shortages in red.

### 3C. Work Order Detail Page — NEW (currently you only have the Kanban card)

When user clicks a Work Order card on the Kanban board, open a detail page with tabs:

**Tab 1: Overview**
- All header fields
- Progress bar: X of Y units completed
- Cost summary: Estimated vs Actual (material + labor)

**Tab 2: Unit Tracker**
A table showing all individual units:
| Unit | Current Step | Status | Started | QC Status |
| Column #1 | Welding | In Progress | Apr 8 | — |
| Column #2 | Cutting | QC Passed | Apr 8 | ✓ |
| Column #3 | Welding | QC Failed | Apr 7 | ✗ (Rework) |
...

Each row is clickable to see the full production log for that unit.
User can update a unit's status: "Move to next step", "Send to QC", "Mark as Scrapped"

**Tab 3: Production Log**
Chronological log of all step completions across all units:
| Time | Unit | Step | Workstation | Operator | Duration | QC |
| 10:30 AM | Column #1 | Cutting | CNC Bay 1 | Raju | 42 min | Passed |
| 10:45 AM | Column #2 | Cutting | CNC Bay 1 | Raju | 38 min | Passed |
...

**Tab 4: Material Consumption**
| Material | BOM Estimate | Actually Issued | Actually Used | Returned | Variance | Cost |
| MS Plate 12mm | 850 kg | 900 kg | 870 kg | 30 kg | +20 kg (+2.4%) | ₹72,500 |
...

**Tab 5: QC Records**
All QC inspections for this WO, filtered by step and unit.

**Tab 6: Downtime**
Downtime events that occurred during this WO's production.

### 3D. Quality Control Form — Redesign

Replace the current single-form QC with a more detailed version:

- Work Order (existing dropdown)
- ADD: Unit (dropdown — populated from forge_work_order_units for the selected WO)
- ADD: Routing Step (dropdown — populated from BOM routing for the selected WO)
  - If "Final Inspection" is selected (or null), it's the end-of-production QC
- Inspection Type: In-Process / Final / Rework (new)
- Inspected Qty (existing — keep for batch inspections where unit tracking isn't used)
- ADD: QC Checklist (auto-loaded from the routing step's qcChecklistJson):
  - For each item, show the description and input field:
    - Pass/Fail items: toggle buttons
    - Numeric items: number input with min/max shown as reference
- Result: Passed / Failed / Conditional (new — replaces manual Passed/Rejected qty split)
- Passed Qty (existing)
- Rejected Qty (existing)
- ADD: Defect Category dropdown (Dimensional / Surface / Welding / Material / Painting / Assembly / Other)
- Rejection Reason (existing text)
- ADD: Rework Required checkbox
- ADD: Rework Instructions (text — appears when Rework Required is checked)
- Inspected By (existing)
- Inspection Date (existing)

### 3E. Workstation Form — Add fields:

- Workstation Name (existing)
- Type (existing dropdown — Machine / Manual Line / Vendor / QC Desk)
- Cost Per Hour (existing)
- Description (existing)
- ADD: Location (dropdown from inventory_locations)
- ADD: Capacity (number — how many simultaneous jobs, default 1)
- ADD: Maintenance Schedule (text — e.g., "Every 500 hours")
- ADD: Last Maintenance Date (date picker)
- ADD: Next Maintenance Date (date picker)

### 3F. Downtime Log Form — Add fields:

- Workstation (existing)
- ADD: Work Order (optional dropdown — which WO was affected)
- Downtime Reason — change from text to ENUM dropdown:
  (Mechanical Failure / Electrical Failure / Material Shortage / Operator Absence / Power Outage / Scheduled Maintenance / Tool Change / Setup / Other)
- Start Time (existing)
- End Time (existing)
- Total Minutes Lost (existing — but auto-calculate from start/end if both provided)
- ADD: Cost Impact (read-only, auto-calculated: totalMinutesLost/60 × workstation.costPerHour)
- Logged By (existing)
- Notes (existing)

---

## PART 4: BACKEND AUTOMATION TRIGGERS

### Trigger 1: Work Order Created from BOM → Generate Units + Material Requirements

When a Work Order is created with a BOM link:

1. Read the BOM's routing steps. Set `totalRoutingSteps` on the WO.
2. Create `forge_work_order_units` records — one per target quantity:
   - unitNumber: 1 to targetQty
   - unitIdentifier: "{productName} #{unitNumber}" (e.g., "Column #1")
   - status: 'Queued'
   - currentStepSequence: 0
3. Create `forge_material_consumption` records — one per BOM material:
   - bomEstimatedQty = material.qty × targetQty × (1 + material.wastagePercent/100)
   - unitCost = inventory_catalog.unitPrice for that item
   - All actual fields default to 0
4. Auto-calculate expectedEndDate:
   - Total routing time = sum of all routing steps (estimatedMinutes + setupTimeMinutes)
   - Total production time = totalRoutingTime × targetQty (serial) or / workstation capacity (parallel)
   - expectedEndDate = startDate + totalProductionTime (converted to working days)

### Trigger 2: Unit Moves to Next Step → Create Production Log Entry

When user clicks "Move to Next Step" on a unit:

1. Create a `forge_production_log` entry for the COMPLETED step:
   - Set endTime = NOW()
   - Calculate actualMinutes from startTime to endTime
2. Check if the completed step has `hasQcCheck = TRUE`:
   - If YES: set unit status to 'QC Pending'. Block advancement until QC is logged.
   - If NO: proceed to next step.
3. If proceeding to next step:
   - Create a new `forge_production_log` entry for the NEXT step with status 'In Progress', startTime = NOW()
   - Update unit's currentStepSequence and currentStepName
4. If this was the LAST step and QC passed (or no QC required):
   - Set unit status to 'Completed', completedAt = NOW()
   - Increment forge_work_orders.producedQty
5. Update forge_work_orders.currentRoutingStep to the highest active step across all units.

### Trigger 3: QC Logged → Update Unit Status

When a QC record is created:

1. If result = 'Passed':
   - Update the unit's status to 'QC Passed'
   - Update the production_log entry's qcStatus to 'Passed' and link qcRecordId
   - Automatically advance unit to next routing step (trigger the "Move to Next Step" logic)
2. If result = 'Failed' AND reworkRequired = TRUE:
   - Update unit status to 'Rework'
   - Send unit BACK to the failed step (set currentStepSequence back)
   - Create a new production_log entry for the rework iteration
3. If result = 'Failed' AND reworkRequired = FALSE:
   - Update unit status to 'Scrapped'
   - Increment forge_work_orders.scrapQty
   - Log a waste record

### Trigger 4: Work Order Completed → Add Finished Goods to Inventory

When ALL units are either 'Completed' or 'Scrapped':

1. Set WO status to 'Completed', actualEndDate = NOW()
2. Calculate final costs:
   - materialsCost = sum of forge_material_consumption.totalCost
   - laborCost = sum of (forge_production_log.actualMinutes / 60 × workstation.costPerHour) for all completed logs
   - totalCost = materialsCost + laborCost + overheadCost
   - costPerUnit = totalCost / producedQty
3. If productItemId is set:
   - Create a stock_movements record: Inward, quantity = producedQty, toLocationId = productionLocationId
   - Update stock_ledger and inventory_catalog.globalStock
4. If projectId and taskId are set:
   - Calculate task completion: (producedQty / targetQty) × 100
   - Update the linked task's completion percentage
   - Recalculate the project milestone's overall completion

### Trigger 5: Material Issue → Update Consumption Tracking

When materials are issued to a Work Order (from Vault's Material Issue):

1. Find the matching forge_material_consumption record (by workOrderId + itemId)
2. Update actualQtyIssued += issued quantity
3. Create a stock_movements record (Outward)
4. Update stock_ledger (decrease)
5. Recalculate WO's materialsCost

### Trigger 6: Downtime Logged → Update Workstation + Calculate Cost

When a downtime log is created:

1. Auto-calculate: costImpact = (totalMinutesLost / 60) × workstation.costPerHour
2. If workOrderId is linked, add costImpact to the WO's overheadCost
3. Update workstation's currentStatus based on downtime reason:
   - If reason is active/ongoing (no endTime): set status to 'Breakdown' or 'Maintenance'
   - If reason has endTime (resolved): set status back to 'Active'

---

## PART 5: IMPORTANT IMPLEMENTATION NOTES

1. **Unit tracking is OPTIONAL per Work Order.** For high-volume simple products (e.g., 10,000 bolts), nobody tracks individual units. Add a field `trackIndividualUnits BOOLEAN DEFAULT TRUE` to forge_work_orders. If FALSE, skip unit creation and use batch tracking (just update producedQty directly). If TRUE, create individual unit records.

2. **The Kanban board should still work.** Keep the Draft → In Progress → QC → Completed columns. But when a card is clicked, it now opens the detailed tabbed view instead of just showing basic info.

3. **BOM versioning:** When user edits an 'Active' BOM, auto-create a new version (copy all materials and routing, increment version number, set old to 'Obsolete', new to 'Draft'). Never edit an Active BOM in-place if any Work Orders reference it — it would change historical records.

4. **All production_log timestamps should use server time**, not client time, to avoid timezone inconsistencies.

5. **The material consumption variance report** is extremely valuable. Create a simple view/query that shows: across all completed WOs for a given product, what's the average material variance? This tells the company if their BOMs are accurate or if they're consistently over/under-estimating.
