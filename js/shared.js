export const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");

function ready(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}

// GSAP's media context reverts its effects when the preference changes at runtime.
export function withMotion(callback) {
  ready(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap
      .matchMedia()
      .add("(prefers-reduced-motion: no-preference)", callback);
  });
}

const menu = document.querySelector("#site-menu");
const menuButton = document.querySelector(".menu-button");
let lenis;
let frame;

function closeMenu() {
  if (!menu?.open) return;
  menu.close();
}

if (menu && menuButton && typeof menu.showModal === "function") {
  document.body.classList.add("menu-ready");
  menuButton.hidden = false;
  menuButton.addEventListener("click", () => {
    menu.showModal();
    menuButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    lenis?.stop();
    menu.querySelector(".menu-close").focus();
  });
  menu.querySelector(".menu-close").addEventListener("click", closeMenu);
  menu.addEventListener("close", () => {
    document.body.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    lenis?.start();
    menuButton.focus({ preventScroll: true });
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [...menu.querySelectorAll("button, a[href]")];
    const first = controls[0],
      last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

ready(() => {
  const updateScrolling = () => {
    cancelAnimationFrame(frame);
    lenis?.destroy();
    lenis = undefined;
    if (motionQuery.matches || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    if (menu?.open) lenis.stop();
    lenis.on("scroll", () => window.ScrollTrigger?.update());
    const tick = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };
  updateScrolling();
  motionQuery.addEventListener("change", updateScrolling);
});

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const progress = document.createElement("div");
progress.className = "scroll-progress";
progress.setAttribute("aria-hidden", "true");
document.body.prepend(progress);
const updateProgress = () =>
  progress.style.setProperty(
    "--progress",
    String(
      scrollY /
        Math.max(1, document.documentElement.scrollHeight - innerHeight),
    ),
  );
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();

let curtain;
let transition;
document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-transition]");
  if (
    !link ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    link.target ||
    link.hasAttribute("download")
  )
    return;
  const target = new URL(link.href);
  if (
    target.origin !== location.origin ||
    (target.pathname === location.pathname &&
      target.search === location.search &&
      target.hash)
  )
    return;
  if (!window.gsap || motionQuery.matches) return;
  event.preventDefault();
  if (curtain) return;
  curtain = document.createElement("div");
  curtain.className = "page-curtain";
  curtain.setAttribute("aria-hidden", "true");
  document.body.append(curtain);
  const navigate = () => location.assign(target.href);
  transition = window.gsap.to(curtain, {
    clipPath: "inset(0 0 0 0)",
    duration: 0.35,
    ease: "power4.inOut",
    onComplete: navigate,
  });
});

// A back/forward-cache restore must not retain the outgoing curtain or modal.
window.addEventListener("pageshow", () => {
  transition?.kill();
  curtain?.remove();
  curtain = undefined;
  closeMenu();
  updateProgress();
});
