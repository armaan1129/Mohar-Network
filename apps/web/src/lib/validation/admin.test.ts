import { describe, expect, it } from "vitest";
import {
  businessRow,
  businessSchema,
  categorySchema,
  citySchema,
  staffInviteSchema,
} from "./admin";

const base = {
  name: "Demo Café",
  city_id: "0c000000-0000-4000-8000-000000000001",
  category_id: "10000000-0000-4000-8000-000000000001",
  scope: "city",
  address: "Main Bazaar, Sirhind",
};

describe("businessSchema", () => {
  it("accepts the minimum and stores blanks as null", () => {
    const parsed = businessSchema.parse(base);
    expect(businessRow(parsed)).toMatchObject({
      gstin: null,
      phone: null,
      lat: null,
      issuance_cap_per_quarter: null,
    });
  });

  it("normalises phone, GSTIN, coordinates and cap", () => {
    const parsed = businessSchema.parse({
      ...base,
      phone: "01763 222 333",
      gstin: "03aaaaa0000a1z5",
      lat: "30.6436",
      lng: "76.3847",
      issuance_cap_per_quarter: "300",
    });
    expect(parsed).toMatchObject({
      phone: "+911763222333",
      gstin: "03AAAAA0000A1Z5",
      lat: 30.6436,
      lng: 76.3847,
      issuance_cap_per_quarter: 300,
    });
  });

  it.each([
    [{ phone: "12345" }, "phone"],
    [{ gstin: "NOTAGSTIN" }, "gstin"],
    [{ lat: "30.6" }, "lng"],
    [{ logo_url: "http://insecure.example/logo.png" }, "logo_url"],
    [{ category_id: "nope" }, "category_id"],
    [{ city_id: undefined }, "city_id"],
    [{ scope: "global" }, "scope"],
    [{ issuance_cap_per_quarter: "-1" }, "issuance_cap_per_quarter"],
  ])("rejects %j", (patch, field) => {
    const result = businessSchema.safeParse({ ...base, ...patch });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0])).toContain(field);
  });
});

describe("citySchema", () => {
  it("normalises code and slug", () => {
    expect(
      citySchema.parse({ code: "sir", name: "Sirhind", slug: "Sirhind", is_live: "on" }),
    ).toEqual({
      code: "SIR",
      name: "Sirhind",
      slug: "sirhind",
      state: "Punjab",
      is_live: true,
    });
  });

  it.each([
    [{ code: "SIRH" }, "code"],
    [{ code: "S1R" }, "code"],
    [{ slug: "sir hind" }, "slug"],
  ])("rejects %j", (patch, field) => {
    const result = citySchema.safeParse({
      code: "SIR",
      name: "Sirhind",
      slug: "sirhind",
      ...patch,
    });
    expect(result.error?.issues.map((i) => i.path[0])).toContain(field);
  });
});

describe("categorySchema", () => {
  it("requires a name", () => {
    expect(categorySchema.safeParse({ name: "C" }).success).toBe(false);
    expect(categorySchema.parse({ name: "Café", name_pa: "ਕੈਫ਼ੇ" })).toEqual({
      name: "Café",
      name_pa: "ਕੈਫ਼ੇ",
    });
  });
});

describe("staffInviteSchema", () => {
  it("lower-cases emails and limits roles", () => {
    expect(staffInviteSchema.parse({ email: "Owner@Example.com", role: "owner" }).email).toBe(
      "owner@example.com",
    );
    expect(
      staffInviteSchema.safeParse({ email: "x@example.com", role: "network_admin" }).success,
    ).toBe(false);
  });
});
