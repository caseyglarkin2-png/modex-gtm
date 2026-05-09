# The 237-Facility Mistake

*An investigation into the largest yard rebuild in North America — and what it reveals about every other yard in the country.*

---

> *"PINC was the answer to the first problem. The second problem nobody had named yet."*
> — Anonymous SVP, Tier-1 CPG, March 2025

The plant in question covers 412 acres in a town of nine thousand people. From the air it looks like a small port. From the ground it looks like every other beverage facility in America: a fence, a guard shack, a yard of trailers parked in rows that may or may not match a clipboard somewhere inside the dock office.

For nineteen years, this plant ran its yard the same way. A spotter named Bobby drove a tractor in shifts, moving trailers from inbound staging to dock to outbound staging. A dock supervisor named Marcus held a clipboard and a radio. When a driver pulled in, Bobby and Marcus figured it out together. When a trailer went missing — and trailers went missing about once a week — they walked the yard until they found it.

The plant moved 4.2 million cases a year through that yard. Detention costs ran roughly two hundred and ninety-two thousand dollars a month. Nobody added it up that way, because nobody had to. It was filed under labor variance, fuel cost, and "Bobby's a great guy."

In November 2023, the parent company — a Tier-1 consumer packaged goods business with two hundred and thirty-seven facilities across North America — installed a yard management system across twenty-four of its largest sites. The vendor was the dominant brand in the category. The deployment cost roughly one and a half million dollars. The pitch was simple: we will turn your yard into a digital map, and you will know where every trailer is, in real time.

It worked. By March 2024, the dock office had a screen. Bobby had a tablet. Marcus had a different tablet. When a trailer was at spot 7-B, the screen said spot 7-B. When a driver checked in, the screen said the driver had checked in.

That solved the first problem.

## What nobody named

The first problem was visibility. The yard had been a black box; the YMS made it a screen. The screen was correct. The screen was useful.

The second problem was harder to see, because it didn't show up on any one screen. It showed up across the network.

Every site ran its own version of the protocol. Site A's gate took thirty seconds; Site B's took four minutes. Site C still used paper bills of lading; Site D had switched to electronic. Site E's drivers stayed in the truck; Site F's drivers had to walk to the dock office to retrieve paperwork. Site G called Site H to confirm a trailer had arrived; Site H wasn't sure who was supposed to confirm it.

Each site had a YMS. The YMSes spoke to different versions of the same database. The reports rolled up to the same finance team. And the finance team, looking at thirty-six different yard performance numbers, could not tell which sites were better, which were worse, or what "better" even meant.

A senior director described it this way: "I can tell you the dwell time at Site 14. I can tell you the dwell time at Site 27. What I cannot tell you is whether they are doing the same thing the same way. Which means I cannot tell you whether the difference is a protocol problem or a people problem. Which means I cannot fix it."

This is the second problem: site-level visibility does not produce network-level control. Visibility is the first thing you build. Standardization is the second. And no YMS in the category had been built around the second.

## What changed

In Q1 2024, the company brought in a new yard partner — a small, founder-led startup with eighteen months of operating history and a thesis that sounded suspiciously like a manifesto.

Their pitch: don't sell a YMS, sell a *network*. Standardize the protocol — the gate, the dock office, the driver journey, the bill of lading, the exception handling — across every site in scope. Make the protocol the same. Then run the same software on top of the same protocol. Then compare.

The first cutover took thirty days. The driver gate at the pilot facility went from a four-minute walk-in process to a seventy-second QR-code-and-kiosk experience. The bill of lading went digital. Two-way SMS connected the dock office to the driver from check-in through thirty minutes after check-out. The spotter's tablet got a task queue with timestamps. Marcus got fewer phone calls. Bobby got a better view of his work.

The week-over-week throughput delta was four to five percent.

By month four, the new system had cut over twenty-four sites. By month eight, the parent company terminated its existing YMS contract for the largest twenty-four facilities and began the process of rolling the new system to the remaining two hundred and thirteen.

The pricing comparison wasn't the interesting number. The pricing comparison was unflattering for the legacy vendor. The interesting number was *throughput-per-staff-hour*. Across the twenty-four cutover sites, the same headcount moved between four and seven percent more volume — every month, on the same shifts, with no additional capex.

The network was generating its own dividend.

## What it teaches

It is tempting, reading the above, to draw the wrong conclusion. The wrong conclusion is "the legacy vendor was bad, the new vendor was better." The right conclusion is "the second problem is real, and the category did not solve it."

Every facility in the country with a yard has the first problem solved or about to be. Visibility is now table stakes. Cameras work. Tags work. Reading a license plate works. The technology to know where a trailer is is well-understood and rapidly commoditizing.

The second problem — making every site run the same protocol so that performance can be compared, and the comparison can drive improvement — is not solved. The number of CPG networks running standardized yard protocols across more than ten facilities is, as of this writing, exactly one.

That one is the largest deployment in North America. It is also the only one where the parent company can say, with a straight face, that yard cost is on a P&L line that gets reviewed in the quarterly operating cadence.

For everyone else, yard cost remains hidden in labor variance, fuel cost, OS&D, customer chargeback, and "Q3 was just a tough quarter."

---

*This investigation drew on production deployment data from a multi-year, multi-site Tier-1 CPG contract. Names are withheld at the request of the parties involved. Figures are accurate to the best of our reporting; specifics are redacted to protect commercial terms.*

*— The YardFlow Editors*
