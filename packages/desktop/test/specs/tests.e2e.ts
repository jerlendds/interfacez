import { browser } from "@wdio/globals";

describe("Nodebody Electron testing", () => {
  it("should print application title", async () => {
    await expect(await browser.getTitle()).toBe("Nodebody");
  });
});
