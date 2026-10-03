import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const routes = [
  "index.html",
  "about/index.html",
  "projects/meme-capsule/index.html",
  "projects/easy-storage-cloud/index.html",
  "projects/convertix/index.html",
  "404.html",
];
const activeCard = (page) => page.locator('.swipe-card[data-index="0"]');

test.beforeEach(async ({ page }) => {
  // Network-independent UI checks use system font fallbacks.
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
});

test("all pages render without runtime errors or broken local resources", async ({
  page,
  request,
}) => {
  const errors = [];
  const failures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.url().startsWith("http://127.0.0.1:4173") &&
      response.status() >= 400
    )
      failures.push(response.url());
  });
  for (const route of routes) {
    await page.goto(`/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".menu-button")).toBeVisible();
    const links = await page
      .locator("a[href], link[href], script[src], img[src], source[srcset]")
      .evaluateAll((elements) => [
        ...new Set(
          elements
            .flatMap((element) => {
              if (element.tagName === "SOURCE")
                return element.srcset
                  .split(",")
                  .map(
                    (item) =>
                      new URL(item.trim().split(" ")[0], location.href).href,
                  );
              return [element.src || element.href];
            })
            .filter((url) => url?.startsWith(location.origin))
            .map((url) => url.split("#")[0]),
        ),
      ]);
    for (const url of links)
      expect((await request.head(url)).status(), url).toBe(200);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
});

test("card arrows move one project in each direction and preserve focus", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "reduced-motion",
    "Reduced motion uses the static project grid.",
  );
  await page.goto("/");
  await activeCard(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(activeCard(page)).toHaveAttribute(
    "data-slug",
    "easy-storage-cloud",
  );
  await expect(activeCard(page)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(activeCard(page)).toHaveAttribute("data-slug", "meme-capsule");
  await expect(activeCard(page)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(activeCard(page)).toHaveAttribute("data-slug", "convertix");
  await page.locator("#next-card").click();
  await expect(activeCard(page)).toHaveAttribute("data-slug", "meme-capsule");
  await expect(page.locator("#next-card")).toBeFocused();
  expect(await page.locator(".swipe-card[inert]").count()).toBe(2);
  await activeCard(page).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(activeCard(page)).toHaveAttribute(
    "data-slug",
    "easy-storage-cloud",
  );
});

test("card links keep native mouse/touch navigation and browser-back recovery", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "reduced-motion",
    "Reduced motion uses the static project grid.",
  );
  await page.goto("/");
  const link = activeCard(page).locator("a");
  if (info.project.name === "mobile") await link.tap();
  else await link.click();
  await expect(page).toHaveURL(/projects\/meme-capsule\/index.html$/);
  await page.goBack();
  await expect(page.locator(".page-curtain")).toHaveCount(0);
  await expect(page.locator(".menu-button")).toBeVisible();
});

test("card drag changes direction correctly and canceled gestures reset", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "reduced-motion",
    "Reduced motion uses the static project grid.",
  );
  await page.goto("/");
  await activeCard(page).scrollIntoViewIfNeeded();
  const box = await activeCard(page).boundingBox();
  await page.mouse.move(box.x + box.width * 0.7, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7 - 120, box.y + 90, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(activeCard(page)).toHaveAttribute(
    "data-slug",
    "easy-storage-cloud",
  );
  const current = await activeCard(page).boundingBox();
  await page.mouse.move(current.x + 80, current.y + 90);
  await page.mouse.down();
  await page.mouse.move(current.x + 140, current.y + 90);
  await activeCard(page).dispatchEvent("pointercancel");
  await page.mouse.up();
  await expect(activeCard(page)).toHaveAttribute(
    "data-slug",
    "easy-storage-cloud",
  );
  expect(
    await activeCard(page).evaluate((element) => element.style.transform),
  ).toBe("");
});

test("menu contains focus, locks background, closes with Escape, and restores focus", async ({
  page,
}) => {
  await page.goto("/");
  const menu = page.locator("#site-menu");
  const trigger = page.locator(".menu-button");
  await expect(menu).not.toBeVisible();
  await page.locator(".menu-close").evaluate((element) => element.focus());
  await expect(page.locator(".menu-close")).not.toBeFocused();
  await trigger.click();
  await expect(page.locator(".menu-close")).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Shift+Tab");
  await expect(menu.locator("a").last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".menu-close")).toBeFocused();
  expect(await menu.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  expect(
    await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).overflowY),
  ).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("every gallery screen is reachable using native horizontal scrolling", async ({
  page,
}) => {
  await page.goto("/projects/meme-capsule/index.html");
  const gallery = page.locator(".gallery-scroll");
  await gallery.scrollIntoViewIfNeeded();
  await expect(gallery).toHaveCSS("overflow-x", "auto");
  await gallery.focus();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => gallery.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await gallery.evaluate((element) =>
    element.scrollTo({ left: element.scrollWidth, behavior: "instant" }),
  );
  await expect
    .poll(() =>
      page
        .locator(".screen")
        .last()
        .evaluate(
          (element) =>
            element.getBoundingClientRect().right <=
            document.querySelector(".gallery-scroll").getBoundingClientRect()
              .right +
              1,
        ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page
        .locator(".screen img")
        .last()
        .evaluate((image) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  expect(
    await page
      .locator(".screen img")
      .last()
      .evaluate((image) => image.currentSrc),
  ).toMatch(/\.webp$/);
});

test("architecture nodes retain placement and support keyboard selection and tabs", async ({
  page,
}) => {
  await page.goto("/projects/convertix/index.html");
  const node = page.locator('[data-node="backend"]');
  await node.scrollIntoViewIfNeeded();
  const matrix = () =>
    node.evaluate((element) => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return [matrix.e, matrix.f];
    });
  expect(await matrix()).toEqual([18, 218]);
  await node.focus();
  await page.keyboard.press("Enter");
  await expect(node).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#detail-backend")).toBeVisible();
  await expect(page.locator("#detail-client")).not.toBeVisible();
  expect(await matrix()).toEqual([18, 218]);
  await node.hover();
  expect(await matrix()).toEqual([18, 218]);
  const topology = page.getByRole("tab", { name: "Topology" });
  await topology.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Pipeline" })).toBeFocused();
  await expect(page.locator("#view-pipeline")).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Decisions" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("walkthroughs show separate project branches and never claim live verification", async ({
  page,
}, info) => {
  await page.goto("/projects/convertix/index.html");
  const select = page.locator("#flow-path");
  await select.selectOption({ label: "Local media conversion" });
  await page.locator("#run-sim-btn").click();
  await expect(page.locator("#flow-status")).toContainText(
    "On-Device Media Engine",
  );
  await expect(page.locator("#flow-status")).not.toContainText(
    "Cloud Document Worker",
  );
  await select.selectOption({ label: "Document conversion" });
  await page.locator("#run-sim-btn").click();
  await expect(page.locator("#flow-status")).toContainText(
    "Cloud Document Worker",
  );
  await expect(page.locator("#flow-status")).not.toContainText(
    "On-Device Media Engine",
  );
  await expect(page.locator("#flow-status")).toContainText(
    "No live requests or measurements",
  );
  if (info.project.name === "reduced-motion")
    await expect(page.locator(".arch-node-group.is-lit")).toHaveCount(0);
  else
    await expect(page.locator("#flow-status")).toContainText(
      "Example complete",
      { timeout: 5000 },
    );
});

test("essential content and navigation work with JavaScript disabled", async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    ...info.project.use,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  for (const route of routes) {
    await page.goto(`http://127.0.0.1:4173/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".header-links")).toBeVisible();
    await expect(page.locator(".menu-button")).not.toBeVisible();
    if (route.startsWith("projects/")) {
      await expect(page.locator(".case-feature-list li")).toHaveCount(6);
      await expect(page.locator("#view-pipeline")).toBeVisible();
      await expect(page.locator("#view-highlights")).toBeVisible();
      await expect(page.locator(".arch-hud:visible")).toHaveCount(4);
    }
  }
  await page.goto("http://127.0.0.1:4173/index.html");
  await expect(page.locator(".project-grid__card")).toHaveCount(3);
  await page.locator(".project-grid__card").first().click();
  await expect(page).toHaveURL(/projects\/meme-capsule\/index.html$/);
  await context.close();
});

test("nested 404 pages recover at root and repository bases without JavaScript", async ({
  browser,
}) => {
  for (const prefix of [
    "http://127.0.0.1:4173/",
    "http://127.0.0.1:4174/portfolio/",
  ]) {
    for (const javaScriptEnabled of [false, true]) {
      const context = await browser.newContext({ javaScriptEnabled });
      const page = await context.newPage();
      const failures = [];
      page.on("response", (response) => {
        if (
          response.url().startsWith(prefix) &&
          response.status() >= 400 &&
          response.request().resourceType() !== "document"
        )
          failures.push(response.url());
      });
      const response = await page.goto(`${prefix}missing/nested/page`);
      expect(response.status()).toBe(404);
      await expect(page.locator("h1")).toHaveText("Wrong page.");
      await expect(page.locator(".button")).toHaveAttribute(
        "href",
        prefix.includes("/portfolio/")
          ? "/portfolio/index.html"
          : "/index.html",
      );
      await page.locator(".button").click();
      await expect(page).toHaveURL(`${prefix}index.html`);
      await page.locator(".project-grid__card").first().click();
      await expect(page).toHaveURL(`${prefix}projects/meme-capsule/index.html`);
      await expect(page.locator("h1")).toHaveText("Meme Capsule");
      expect(failures).toEqual([]);
      await context.close();
    }
  }
});

test("missing animation libraries leave navigation, cards, and content usable", async ({
  page,
}, info) => {
  await page.route("**/js/*.min.js", (route) => route.abort());
  await page.goto("/");
  await page.locator(".menu-button").click();
  await expect(page.locator("#site-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  if (info.project.name === "reduced-motion")
    await page.locator(".project-grid__card").first().click();
  else await activeCard(page).locator("a").click();
  await expect(page.locator("h1")).toHaveText("Meme Capsule");
  await page.locator('[data-node="storage"]').click();
  await expect(page.locator("#detail-storage")).toBeVisible();
});

test("motion preference changes restore content and move focus to the fallback grid", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "reduced-motion",
    "Covered by the normal-motion projects.",
  );
  await page.goto("/");
  await activeCard(page).focus();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".swipe-selector")).not.toBeVisible();
  await expect(page.locator(".project-grid__card").first()).toBeFocused();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".swipe-selector")).toBeVisible();
});

test("responsive screenshots are smaller than the original set", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../assets/images/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const images = Object.entries(manifest).filter(([path]) =>
    path.includes("meme-capsule/"),
  );
  const original = images.reduce(
    (sum, [, image]) => sum + image.originalBytes,
    0,
  );
  const optimized = images.reduce(
    (sum, [, image]) => sum + image.sources.at(-1).bytes,
    0,
  );
  expect(optimized).toBeLessThan(original * 0.3);
});

test("narrow cards fit their container and retain equal stack heights", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "reduced-motion",
    "Reduced motion uses the grid.",
  );
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await expect(page.locator(".swipe-selector")).toBeVisible();
  const sizes = await page.locator(".swipe-card").evaluateAll((elements) =>
    elements.map((element) => ({
      width: element.offsetWidth,
      height: element.offsetHeight,
    })),
  );
  const width = await page
    .locator(".swipe-selector")
    .evaluate((element) => element.clientWidth);
  expect(sizes.every((size) => size.width <= width)).toBe(true);
  expect(new Set(sizes.map((size) => size.height)).size).toBe(1);
});

test("repeated card animations restart from the visible stack", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "reduced-motion",
    "Reduced motion uses the grid.",
  );
  await page.goto("/");
  for (const slug of ["easy-storage-cloud", "convertix", "meme-capsule"]) {
    await page.locator("#next-card").click();
    await expect(activeCard(page)).toHaveAttribute("data-slug", slug);
  }
  await page.locator("#next-card").click();
  const startX = await activeCard(page).evaluate((card) => {
    // Sample the beginning of the actual outgoing animation deterministically.
    const animation = window.gsap.getTweensOf(card)[0];
    animation.progress(0.01);
    return new DOMMatrix(getComputedStyle(card).transform).e;
  });
  expect(Math.abs(startX)).toBeLessThan(1);
});
