import { test, expect } from "@playwright/test";

const routes = [
  "index.html",
  "about/index.html",
  "projects/meme-capsule/index.html",
  "projects/easy-storage-cloud/index.html",
  "projects/convertix/index.html",
  "404.html",
];

// Run this viewport matrix once, in addition to the interaction suite's profiles.
test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.route("**/js/*.min.js", (route) => route.abort());
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`text stays readable and inside its layout at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto(`/${route}`);
      const issues = await page.evaluate(() => {
        const issues = [];
        const selectors =
          "h1,h2,h3,h4,.footer__headline,.next-project,.swipe-card__art span,.project-grid__art,.hero-stamp";
        for (const element of document.querySelectorAll(selectors)) {
          if (!element.checkVisibility() || element.closest("[inert]"))
            continue;
          const style = getComputedStyle(element);
          const size = parseFloat(style.fontSize);
          const label = element.textContent
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 60);
          // Shorter-than-font line boxes and extreme negative tracking caused
          // the original glyph collisions, even when the DOM boxes did not overlap.
          if (parseFloat(style.lineHeight) < size)
            issues.push(`${label}: compressed line height`);
          if (parseFloat(style.letterSpacing) < -0.05 * size)
            issues.push(`${label}: colliding letter spacing`);
          const range = document.createRange();
          range.selectNodeContents(element);
          const box = element.getBoundingClientRect();
          if (
            [...range.getClientRects()].some(
              (rect) =>
                rect.width > 1 &&
                (rect.right > box.right + 2 || rect.left < box.left - 2),
            )
          )
            issues.push(`${label}: text overflows its column`);
        }
        const pairs = [
          [".project-hero h1", ".project-hero__tagline"],
          [".project-hero__tagline", ".facts"],
          [".hero-statement h2", ".hero-statement p"],
          [".hero-word:first-child", ".hero-word:last-child"],
        ];
        for (const [firstSelector, secondSelector] of pairs) {
          const first = document.querySelector(firstSelector),
            second = document.querySelector(secondSelector);
          if (!first || !second) continue;
          const range = document.createRange();
          range.selectNodeContents(first);
          const bottom = range.getBoundingClientRect().bottom;
          range.selectNodeContents(second);
          if (bottom > range.getBoundingClientRect().top + 1)
            issues.push(`${firstSelector} touches ${secondSelector}`);
        }
        return issues;
      });
      expect(issues, `${route} at ${width}px`).toEqual([]);
    }
  });
}

test("every card title, badge, and description has its own space", async ({
  page,
}) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    for (let i = 0; i < 3; i++) {
      const overlaps = await page
        .locator('.swipe-card[data-index="0"]')
        .evaluate((card) => {
          const elements = [...card.querySelectorAll(".swipe-card__body > *")];
          return elements
            .slice(1)
            .filter((element, index) => {
              const first = document.createRange(),
                second = document.createRange();
              first.selectNodeContents(elements[index]);
              second.selectNodeContents(element);
              return (
                first.getBoundingClientRect().bottom >
                second.getBoundingClientRect().top + 1
              );
            })
            .map((element) => element.textContent.trim());
        });
      expect(overlaps, `Card ${i + 1} at ${width}px`).toEqual([]);
      await page.locator("#next-card").click();
    }
  }
});
