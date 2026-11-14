import { describe, expect, it } from "vitest";
import { colorectalScreeningOperator } from "./screeningOperator";

describe("colorectalScreeningOperator", () => {
  it("names HUS for the Uusimaa counties, Helsinki, Kymenlaakso and Etelä-Karjala", () => {
    for (const n of ["Itä-Uudenmaan hyvinvointialue", "Länsi-Uusimaa", "Vantaan ja Keravan hyvinvointialue", "Vantaa and Kerava", "Helsingin kaupunki", "Helsinki", "Kymenlaakson hyvinvointialue", "Etelä-Karjala"])
      expect(colorectalScreeningOperator(n)).toBe("HUS");
  });
  it("is null for counties that run their own screening", () => {
    for (const n of ["Pirkanmaa", "Päijät-Hämeen hyvinvointialue", "Etelä-Savo", "Pohjois-Karjala", "Lappi"])
      expect(colorectalScreeningOperator(n)).toBeNull();
  });
});
