# Deep-Audit Dossier — idx 27

## Liberty Coca-Cola Beverages — Philadelphia Production Plant, PA

**Resolved location:** 725 E Erie Ave, Philadelphia, PA 19134
**Locked center:** 40.00700, -75.11150
**Confidence:** high

### Step 0 — Location confirmation

The roster coordinates (40.006386, -75.113266) landed at the correct
intersection. The facility is positively identified:

- A large **Coca-Cola logo is painted on the NE building face** (visible from
  Street View on the side street).
- An **enclosed pedestrian skybridge over the side street is Coca-Cola
  branded**, connecting two buildings of the plant complex.
- Coca-Cola red delivery trucks and red/blue trailers fill the yard.
- Web search confirms Liberty Coca-Cola Beverages operates at 725 E Erie Ave,
  Philadelphia PA 19134.

### Key views

- **Overview (z16-z18):** Heavy-industrial Kensington/Port Richmond district.
  The complex comprises a large production-plant building (aged white roof), a
  long dock/warehouse building, and a building across the side street linked by
  the branded skybridge.
- **Drop yard (z18-z19):** A very large paved trailer yard packed with 100+
  Coca-Cola red trailers and red box-delivery trucks, plus blue trailers backed
  into dock banks.
- **Street View E Erie Ave frontage:** Chain-link perimeter fencing; multiple
  sliding truck gates; carrier-instruction signage.

### Gate / guard-shack / dock determinations

- **truckGate = true.** Multiple chain-link sliding gates along E Erie Ave
  control the yard; one is explicitly marked **"EXIT"**. The yard is fully
  fenced.
- **guardShack = true.** A fence sign reads **"GUARD SHACK - Check in Here"**
  with a directional arrow. Carrier signage: "ALL CARRIERS Park on the Street
  ... Check in With Guard With Paper Work ... Coiled in By Appointment ... DO
  NOT DOUBLE PARK." A small booth structure is visible near the gate inside the
  yard. Because there is a staffed guard, `remoteGs` is false.
- **entryExitSeparate = true.** A dedicated EXIT gate is marked separately from
  the carrier check-in/entrance gate.
- **preGateStaging = true.** Carrier signage explicitly directs all carriers to
  park on the public street before check-in.
- **postGateStaging = true.** The very large drop yard inside the gate serves
  as a post-gate holding/queue area before the docks.
- **backupSensitive = true.** "DO NOT DOUBLE PARK" warning + street-parking
  instruction + the gate fronting the busy E Erie Ave arterial with limited
  stacking room.
- **dockDoors = 50+.** Multi-building urban plant with extensive dock banks
  across the production building and the long dock/warehouse building; dozens
  of trailers backed in. Overhead estimate.
- **dropArea = 50+.** Extensive drop yard, 100+ trailers/trucks.
- **multipleFacilities = true.** Campus of 3+ connected buildings.

### Yard zones and counts

- **Perimeter:** full complex, ~420 m N-S x ~390 m E-W, ~14 acres.
- **Truck gate:** controlled gates on E Erie Ave (entrance + separate EXIT).
- **Drop yard:** large fenced trailer yard, 100+ trailers, ~130-trailer
  capacity.
- **Dock apron:** dock banks along the production / warehouse building faces.
- **Buildings:** 3 (production plant, dock/warehouse building, skybridge-linked
  west building).
- **Rail:** not served (rail line nearby but no spur into the yard).

### Web findings

- Liberty Coca-Cola Beverages, founded 2017, HQ Philadelphia; ~$1.3B revenue;
  19 locations; 725 E Erie Ave is a beverage production facility.

### Final confidence: high

Facility positively identified by painted Coca-Cola branding and confirmed
operational signage. Gate and guard-shack calls are backed by explicit
on-fence carrier-check-in signage naming a guard shack. Dock-door and trailer
counts are honest overhead estimates (flagged); ship/receive separation could
not be physically confirmed.
