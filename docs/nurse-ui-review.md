# Nurse app usability review

Scope: `nurse/` participant list and robot pickups. The existing HUS colors, typography, sample model and cross-app synchronization remain in place. This is a heuristic review, not a usability study with nurses or a WCAG conformance audit.

## Ten heuristics

| Nielsen heuristic | Review and resulting behavior |
| --- | --- |
| 1. Visibility of system status | Robot summary stays visible without four large cards. Lab registration announces the number of samples and hub. Simulation state is explicit; the frequently updating fleet is not a live region. |
| 2. Match with the real world | Navigation says “Robot pickups.” “Register N samples at lab” names the action. A delayed robot no longer implies that nobody is home; the system only knows it is waiting. |
| 3. User control and freedom | Every robot-page reset can be cancelled and explains that both apps' recorded actions will be cleared. Existing drawer close, Escape, focus restoration and filter clearing remain. |
| 4. Consistency and standards | Participant names, attention flags and screening stages use aligned desktop columns and stacked mobile rows. Navigation and page titles use the same pickup terminology. |
| 5. Error prevention | Bulk lab registration asks the nurse to confirm collection, sample count and hub before recording it. Existing clinical-result confirmations remain. No sample storage or event contracts changed. |
| 6. Recognition rather than recall | Desktop column labels make the list scannable. Pickup codes, languages, reminder tags and stage duration remain visible. Users can expand the full waiting list instead of seeing an inaccessible “and N more.” |
| 7. Flexibility and efficiency of use | Existing participant search, stage filter and attention-only filter remain. Collapsed waiting lists keep the default view short, with one control to show all pickups. |
| 8. Aesthetic and minimalist design | Removed the summary-card treatment and duplicate toolbar reset. Simulation configuration sits in a native disclosure in the demo footer. Retained the established blue/white palette and restrained borders. |
| 9. Recognize, diagnose and recover from errors | Retained no-results recovery, retry page and action confirmations. Empty pickup text distinguishes no trips from samples still awaiting lab registration. |
| 10. Help and documentation | Reset copy explains its scope; simulation settings explain that speed affects new trips. Map legend, explicit form labels and demo-data notice remain in context. |

## Acceptance checks

- Run `npm run check` in both `nurse/` and `web/` with Node 22 or newer.
- Smoke-test both nurse routes against the production build. Same-origin forwarding configuration is unchanged.
- Review the diff for changes to storage keys, channels, sample events and clinical logic: none intended.
- Browser checks completed in the in-app browser: 1280px desktop layout; 390px participant layout without horizontal overflow; participant search; no-results recovery; drawer Escape and focus return; simulation disclosure and pausing new bookings; waiting-list expansion (42 items plus control) and collapse (5 items plus control).
- Confirmation-flow verification is inconclusive: the native browser confirmation blocked the in-app preview tooling. Reset cancel/confirm and hub-registration cancel/confirm plus status feedback still need a manual check in a normal browser. Their code paths were reviewed; this is not a claim that those interactions were tested.
- Review found no sample-model, event, storage-key or synchronization changes in this patch.

## Sources

- [Nielsen Norman Group: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [Nielsen Norman Group: Conducting a heuristic evaluation](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/)
- [W3C: What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) — retain visible focus and accessible target sizes; a successful build does not prove accessibility compliance.
