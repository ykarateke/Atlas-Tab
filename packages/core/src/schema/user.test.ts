import { describe, expect, it } from "vitest";
import { userAccountSchema } from "./user";

describe("userAccountSchema", () => {
  it("accepts a signed-out user with no optional fields", () => {
    expect(userAccountSchema.safeParse({ signedIn: false }).success).toBe(true);
  });

  it("accepts a signed-in user with profile fields", () => {
    const result = userAccountSchema.safeParse({
      signedIn: true,
      name: "Yasin",
      email: "yasin@example.com",
      avatarUrl: "https://example.com/avatar.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing signedIn field", () => {
    expect(userAccountSchema.safeParse({ name: "Yasin" }).success).toBe(false);
  });
});
