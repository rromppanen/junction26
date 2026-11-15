# farmagusta pitch: speaker notes

The notes for each slide of [farmagusta-pitch.pdf](farmagusta-pitch.pdf), in order.

## 1. farmagusta.

Hi, we’re farmagusta: the robot fleet for sample delivery. Robots like this one already deliver groceries for S-kaupat across Helsinki. We put them to work collecting bowel screening samples from people’s doors.

## 2. gap

In 2023, Helsinki invited 41,047 people to bowel cancer screening. 12,432 of them, 30.3%, never sent the test back. In 2024 it was the same: 30.4%. These people never enter the pathway at all: no result, no colonoscopy, no early treatment. All figures are from the Finnish Cancer Registry’s screening statistics.

## 3. Goal 3 is survival. Survival starts with returning the test.

The challenge asks us to cover Goal 3 of the national cancer strategy: equal and effective cancer care, measured by survival and cancer deaths. Here is the link. In Finland, one in five bowel cancers among people invited to screening in 2022 was in someone who never returned the test: 259 of 1,241, from the Cancer Registry. And where a cancer is found matters. In the Flanders FIT screening programme, cancers found by screening were caught at stage one or two 67% of the time, against 40% in people who didn’t take part, and five-year survival was 94% against 62%. Part of that survival gap is lead time, because screening finds cancers earlier, but the stage difference is real. So every non-returner we bring into the pathway is a chance to move a cancer from the orange column to the teal one, and because the gap is widest for people with another mother tongue, this is also the equal part of Goal 3.

## 4. Foreign-language speakers skip bowel screening almost twice as often.

The gap is widest by language. In 2024, 74.5% of people whose mother tongue is Finnish, Swedish or Sami returned the bowel screening test. For people with another or missing mother tongue it was 53.4%. Put the other way round: 46.6% never returned it, against 25.5%, so they are almost twice as likely to skip screening entirely. By birthplace the gap is even larger: only 40.5% of invited people born in Africa returned the test. This is an association in the Registry’s figures; it does not prove language is the cause. Same source as before: the Finnish Cancer Registry.

## 5. Four reasons people skip. One fix for each.

Research points to four reasons people skip. One: the letter is hard to understand. The HUS kit leaflet is in Finnish, Swedish and English only, and we saw the language gap on the last slide. Two: people don’t see why it matters. In a US survey, a third of non-users thought the test was unnecessary. Three: people mean to do it and forget. In a randomised trial in Catalonia, one SMS reminder lifted kit return from 53.7% to 64.2% at 30 days. Four: returning a stool sample is gross and embarrassing. In the same survey, 59.6% of non-users named discomfort, disgust or embarrassment among their reasons, the most common one but not the only one, and for people with disabilities it is harder still: their odds of doing a stool test are 28% lower. Today you post it or take it to a HUS lab by the next working day. farmagusta answers each one: instructions in the person’s preferred language, nine today, plain explanations and answers, reminders with one clear next step, and most importantly, a robot that collects the sample from your door. Sources: Finnish Cancer Registry 2024; HUS sampling and return instructions (hus.fi); Gordon and Green 2015, BMC Public Health, doi 10.1186/s12889-015-1908-x; Vives et al. 2024, JMIR Public Health Surveill, doi 10.2196/57959; Ricciardi et al. 2024, Current Oncology 31(11):7023–7039.

## 6. A QR code on the letter opens the app.

The invitation still arrives by post, but now it carries a QR code. Scan it with your phone camera and farmagusta opens on your own invitation. The first thing it asks is your language: nine to choose from, including Arabic, Somali, Ukrainian and Persian. From there it walks you through the test step by step, answers questions about the kit, and lets you book a robot to collect the sample.

## 7. From letter to doorstep in four steps.

Here is the whole journey. One: pick your language, nine today, with Arabic and Persian shown right to left. Two: take the sample, with ten illustrated steps that follow the HUS kit leaflet in order. Three: book a robot pickup, as soon as possible or within a one-hour window, and drop a pin where the robot can reach your door. Four: watch the robot arrive on the map and hand over the sample at your door. No post box, no trip to the lab. In the demo the robot, the lab and the bookings are simulated.

## 8. It looks like a grocery delivery. Because it’s the same robot.

Remember reason four: returning a stool sample is embarrassing. Our answer is that nobody can tell. The robot that comes to your door is the same kind of robot that already brings groceries: S-kaupat robots have made over a million deliveries in Finland, so your neighbours see a grocery delivery. There is no courier to face and nothing on the robot that says medical. The lid opens only with your phone, and in our system the robot’s destination is a pickup code, not your name.

## 9. We don’t build robots. Starship already runs them.

We don’t build robots. Starship already runs more than 3,000 of them, with over 10 million deliveries, and more than 650 in Finland alone through S-kaupat. Here is how a pickup runs. The patient books a time in our app. Our backend batches nearby pickups into one run with AI route planning. It sends the jobs to Starship’s partner API, which creates delivery jobs, loads robots and streams live status back to the nurse dashboard. The robot drives itself to the door, operating autonomously with a human able to help remotely, and only the patient’s phone opens the lid. Then it returns to the lab hub, where the sample is scanned in and registered. Starship publishes this API for partners; the clinical integration and separate sample compartments are our proposal to build with them.

## 10. Every sample gets its own locked compartment.

Return packages lie flat in slim slots, so one robot can carry them from a whole neighbourhood. One robot collects from many homes in one run, so we have to make sure the next patient can never reach the previous patient’s sample. Every pickup gets its own compartment. At the first stop, patient A’s phone opens compartment A. They put the sample in, close the lid, and it locks automatically. At the next stop, patient B’s phone opens only compartment B; A stays locked and B cannot reach it. Patients can never reopen a compartment, not even their own. Only the lab’s key opens the filled compartments, and every opening is logged, so the chain of custody runs from the door to the lab. This is a proposed insert for Starship’s cargo bay that we would build and validate with Starship; in the demo, the compartments are simulated.

## 11. One screen runs the fleet and tracks every patient.

Behind the app is one dashboard. On the right, the fleet: 30 robots across six hubs in Helsinki, Espoo and Vantaa. AI plans every robot’s route with proven shortest-path search, the A* family of algorithms used in navigation, so the plan is predictable: the same input always gives the same route. When someone books a pickup, it is added to a nearby robot’s route on the fly. A sample tube is tiny, so one robot can sweep a whole neighbourhood in one run. On the left, every patient: the dashboard logs each step automatically, from opening the app to the result, and flags the patients who fall behind: no sample after 14 days, a robot waiting at the door, or a positive result with no colonoscopy booked. The thresholds are our assumptions, and the data and fleet in the demo are simulated.

## 12. Every step is logged, so even silence tells us something.

Because the app logs every step, the nurse sees not just who is missing, but where they stopped, and each place means something different. If someone never opened the app, the invitation didn’t land: maybe the language, maybe they never noticed it, maybe no smartphone. They get a reminder, then a nurse call with an interpreter. If they opened the app but took no sample, they know what to do but hesitate or forget, so a reminder with one clear next step. If they took the sample but didn’t hand it over, the return is the problem, not the will: the nurse sees the robot waiting and rebooks it. And if the result is positive but no colonoscopy is booked, that is a delay in care, Goal 3 of the national cancer strategy: after seven days it is flagged and the nurse books it. Today, all of these people look the same: no sample came back.

## 13. savings

Here is the money. In Helsinki, Espoo, Vantaa and Kauniainen there are 235,677 people aged 56 to 74. They are invited every two years, so about 118,000 kits go out each year. At the national target of 80%, about 94,000 samples come back, each in a Posti business-reply envelope at €2.07, plus a prepaid cardboard return envelope in every kit, which we estimate at 40 cents. That is about €242,000 a year, which we round to €240,000. Even at today’s return rate of about 70%, it is still around €218,000. The population figures are from Statistics Finland and the postage is Posti’s current contract price. This is the gross mailing cost avoided: the kit still goes out by post, and the robots have running costs we will price in the pilot.

## 14. Let’s pilot it in one Helsinki district.

Here is what we ask. Give us one Helsinki district for one screening round, running next to the usual letter, with Starship as our robot partner through its partner API. We will measure three things: the test-return rate against the usual letter, split by mother tongue; where people stop, step by step; and the real cost of a robot pickup against the €2.07 postage it replaces. The app and the nurse dashboard work today; you can try them at farmagusta.vercel.app. The robots, the lab and the bookings are simulated, and the people in the demo are invented. Nobody loses the post: anyone without a smartphone can still return the sample the usual way. We’re farmagusta: the robot fleet for sample delivery.
