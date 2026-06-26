# Deep-Audit Dossier — idx 48 — Delight Products (Kroger Grocery Plant)

**Address:** 1200 Industrial Drive, Springfield, TN 37172
**Resolved center:** 36.49850, -86.86720
**Confidence:** high (gate type / door count flagged)
**Maps:** https://www.google.com/maps/@36.49850,-86.86720,400m/data=!3m1!1e3

## Step 0 — Location confirmation
Supplied coords (36.498607, -86.87002) landed inside a large industrial complex.
Web search confirms Delight Products is a **Kroger manufacturing division** (grocery /
snack-food production) at 1200 Industrial Dr, Springfield TN. The address resolves to
the **Kroger Springfield manufacturing campus** — a multi-building site combining an
older manufacturing cluster (NW/W) and a large modern secured plant/DC building (SE).
I audited the **dominant secured building**: the fully perimeter-fenced SE structure
with the south dock band, SE drop yard, and Kroger branding on the office face. This is
the clear freight-operations facility consistent with the "Grocery Plant" type.

## Key views
- **z16/z17 wide:** sprawling Kroger campus; older buildings W, massive building SE,
  rail line on the SW edge, employee parking and access road on the NE.
- **South / east Street View (2024-10):** tall **black ornamental security fence** wraps
  the entire SE building property — confirmed from several frames. Retention pond inside
  the SE fence corner. Drop-yard trailers and dock-band trailers visible behind the fence.
- **NE Street View:** office face of the building with Kroger logo, employee parking
  inside the fenced lot; main entrance with a landscaped rounded median.
- **SE entrance:** a sliding gate in the perimeter fence controls the access driveway.

## Gate / guard / dock determinations
- **truckGate = true.** Continuous tall perimeter fence with a controlled sliding gate at
  the SE access driveway. Property is not an open driveway.
- **guardShack = false / remoteGs = true.** No manned guard booth was visible at the
  entrance. A satellite "structure" in the intersection resolved (z21) to a tall light
  pole casting shadows, not a booth. Controlled gate with no booth implies kiosk / badge /
  app check-in. Flagged low-confidence.
- **dockDoors = "50+".** Long continuous dock band on the south building face with many
  trailers backed in; ~1M sq ft Kroger DC/plant. Banded from building scale; exact count
  not legible overhead.
- **dropArea = "25-50" / dropYard = true.** Dedicated trailer-storage rows in the SE yard
  inside the fence (drop trailers without tractors).

## Yard zones & counts
- **perimeter:** 7-vertex ring tracing the fenced SE building property (building + south
  dock apron + SE drop yard + NE employee lot + retention pond). ≈ **58.0 acres**.
- **truckGate:** quad over the SE sliding-gate / access drive.
- **dockAprons:** long thin quad hugging the south dock face at the building's ENE-WSW angle.
- **dropYards:** quad over the SE trailer drop yard.
- **staging:** null (postGateStaging inferred true — deep paved apron between gate and docks).
- **Metrics:** dockDoorCount ~55, trailersVisible ~60, trailerParkingCapacity ~90,
  truckGateCount 1, buildingCount 1, railServed false (rail runs along SW edge, no spur
  into the secured property).

## Web findings
- Delight Products = Kroger manufacturing division; hourly production hiring (machine
  operator, maintenance, general help). Phone (615) 384-7546. Confirms an active
  food-manufacturing operation, not an office.

## Confidence
**High** overall — facility positively identified, perimeter/gate/dock all evidenced from
satellite + Street View. guardShack/remoteGs, exact dock-door count, and shipRcvSeparate
left as uncertain; urbanRural judged Rural (edge-of-town with farmland to the east).
