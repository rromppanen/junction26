# farmagusta pitch: speaker notes

Notes and supporting sources for the 14-slide [pitch deck](farmagusta-pitch.pdf). Figures describe the cited studies or stated scenarios; they are not measured outcomes of this prototype.

## 1. farmagusta

We built farmagusta to help people finish their bowel screening test. It guides them in their own language, collects the sample at the door and gives nurses a way to follow up. The robot, lab and bookings are simulated in the demo.


## 2. Too many tests never come back

In 2024, 12,789 people invited to bowel screening in Helsinki did not return the test: 30.4% of invitees. That is the gap we want to address. Returning the test is the first step before a result or any follow-up can happen.

Sources and detail: Source: Finnish Cancer Registry, colorectal cancer screening statistics, stats.cancerregistry.fi/joukkistilastot/suolisto.html. Helsingin kaupunki 2023–2024. Retrieved 13.11.2026.

## 3. Earlier detection matters

Goal 3 of the cancer strategy concerns equal and effective care. In the Flanders study, five-year survival was 94% for cancers found through screening, compared with 62% in people who did not take part. This observational comparison includes lead-time bias and should not be read as a causal effect estimate. The study also reported stage I–II detection in 67% versus 40%.

Sources and detail: [1] Finnish Cancer Registry, colorectal screening statistics: cancers by route, people eligible in 2022. [2] Tran et al. 2023, Int J Environ Res Public Health 20(2):1654. Survival comparisons include lead-time bias.

## 4. The gap is wider for other language groups

Participation was 74.5% among people whose mother tongue was Finnish, Swedish or Sami, and 53.4% among people with another or missing mother tongue. The Registry counts are 299,347 of 401,645 and 10,524 of 19,720. These figures show an association; they do not establish language as the cause.

Sources and detail: Source: Finnish Cancer Registry, colorectal cancer screening statistics 2024, participation by mother tongue, whole country: 299,347 of 401,645 (Finnish, Swedish or Sami) and 10,524 of 19,720 (other or missing). stats.cancerregistry.fi/joukkistilastot/suolisto.html, retrieved 13.11.2026.

## 5. Make the test easier to finish

The design addresses understanding, follow-through and returning the sample. The phone app explains why the test matters and gives step-by-step instructions in nine languages. Reminders and nurse follow-up address delays; doorstep pickup removes the trip to a post box or lab. The supporting research covers perceived lack of need, forgetting, discomfort and disability. These studies motivate the design; we have not measured the prototype’s effect on participation.

Sources and detail: [1] HUS, instructions for collecting and returning the sample · [2] Gordon &amp; Green 2015, BMC Public Health · [3] Vives et al. 2024, JMIR Public Health Surveill · [4] Ricciardi et al. 2024, Current Oncology

## 6. The letter opens the app

The invitation still arrives by post. Its QR code opens farmagusta, starting with language choice. The app supports Finnish, Swedish, English, Russian, Estonian, Arabic, Ukrainian, Somali and Persian, with right-to-left layout where needed.


## 7. Four steps, all from home

The app takes the person from language selection through ten illustrated sampling steps, a pickup booking and live tracking at the door. The sampling order follows the HUS kit leaflet. A pickup can be booked as soon as possible or in a one-hour window.


## 8. An ordinary delivery robot

The proposed service uses the kind of robot already delivering groceries, with no medical markings. Each pickup is identified on the map by a code. Phone-controlled access and dedicated sample compartments are part of the proposed service, not a deployed clinical integration. Patient names remain available to nurses in their workspace.

Sources and detail: [1] Starship Technologies, 10.12.2025: S-kaupat robots completed one million orders in Finland; 650+ robots in about 80 towns. Photo: CC0, Wikimedia Commons.

## 9. Use an existing delivery fleet

We propose using an existing fleet rather than building a robot. Starship publishes a partner API for delivery jobs and status. farmagusta handles booking, pickup grouping and nurse visibility; the robot partner would handle physical delivery. Medical sample handling and the compartment insert would need to be developed and validated with the partner. No commercial partnership is claimed.

Sources and detail: Starship Technologies: delivery-apps partner API (create jobs, load robots, status updates, cancellations); our-robots page; press release 10.12.2025. The clinical integration and per-sample compartments are our proposal, to be validated with Starship.

## 10. One locked compartment per sample

Each sample needs its own compartment so a later pickup cannot expose an earlier sample. The current demo models four compartments per robot. The hardware insert and phone-controlled access are proposals requiring partner validation. The intended rule is that a patient can open only the compartment assigned to that pickup; collected samples remain locked until lab intake.

Sources and detail: Proposed design: a custom compartment insert for Starship’s locked cargo bay, built and validated with Starship. The demo simulates the compartments.

## 11. See who needs help. Act from the map.

The nurse workspace combines a live map, a patient queue and filters. Nurses can open a patient to send a reminder, record a call, register an arrived sample or book a colonoscopy where appropriate. The demo has 30 robots across six hubs. Multi-stop runs collect up to four samples before returning for nurse intake.

Sources and detail: Route planning: shortest-path search of the A* family (Hart, Nilsson &amp; Raphael 1968). Flag thresholds are our assumptions. Demo data and fleet are simulated.

## 12. A clear next action for the nurse

The nurse can see where a person stopped and choose a follow-up action. The flags are simple rules, not diagnoses or inferences about someone’s motivation. No sample 14 days after invitation and no colonoscopy booking seven days after a positive result are demo assumptions. A real service would need clinical review of these rules and its escalation process.

Sources and detail: Stages as logged by the farmagusta prototype. Flag thresholds (14 days without a sample, 7 days without a colonoscopy) are our assumptions, not clinical deadlines.

## 13. What return mail costs today

The estimate covers Helsinki, Espoo, Vantaa and Kauniainen. There are 235,677 people aged 56–74. Dividing by two gives 117,838.5 invitations a year. At 80% participation, 94,270.8 samples incur €2.07 reply postage (€195,140.56). An estimated €0.40 return envelope in every kit adds €47,135.40, for €242,275.96, rounded to approximately €240,000. This is a scenario estimate for gross mailing costs, not net savings. It excludes robot running costs and SMS costs; outgoing invitations still use the post. Population: Statistics Finland table 11re, 31 December 2025. Postage: Posti contract price list, 1 October 2026, VAT 0. Envelope price is our estimate.

Sources and detail: Statistics Finland, population by age 31.12.2025 (table 11re) · Posti contract price list from 1.10.2026, business reply €2.07 (VAT 0) · National Cancer Strategy 2026–2035, 80% participation goal · Envelope cost €0.40 is our estimate. Gross saving, before robot running costs.

## 14. Making cancer screening easier to complete

Close with: “Making cancer screening easier to complete, so fewer people are left behind.”

If asked about next steps: we are asking for a district pilot and a robot delivery partner. Compare test returns with the usual invitation in the same period, split by mother tongue, and measure time from a positive result to colonoscopy and actual pickup costs. The phone app and nurse workspace are working prototypes; the robots, lab and bookings are simulated. People without a smartphone must retain the usual postal and lab return options.
