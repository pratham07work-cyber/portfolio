import { motionQuery, withMotion } from "./shared.js";

const selector = document.querySelector(".swipe-selector");
const stage = document.querySelector("#card-stage");
const cards = [...stage.querySelectorAll(".swipe-card")];
const copies = [...document.querySelectorAll("[data-project-copy]")];
const status = document.querySelector("#selector-status");
let current = 0;
let changing = false;
let animation;
let drag;

function render(restoreFocus = false, announce = false) {
  cards.forEach((card, index) => {
    const offset = (index - current + cards.length) % cards.length;
    card.dataset.index = String(offset);
    card.inert = offset !== 0;
    card.tabIndex = offset === 0 ? 0 : -1;
    card.style.removeProperty("transform");
    card.style.removeProperty("opacity");
    copies[index].hidden = index !== current;
  });
  if (restoreFocus) cards[current].focus({ preventScroll: true });
  if (announce) status.textContent = cards[current].getAttribute("aria-label");
  changing = false;
}

function change(direction, exitDirection = direction) {
  if (changing || cards.length < 2) return;
  changing = true;
  const card = cards[current];
  const restoreFocus = card.contains(document.activeElement);
  const finish = () => {
    current = (current + direction + cards.length) % cards.length;
    render(restoreFocus, true);
  };
  if (window.gsap && !motionQuery.matches) {
    // Reused DOM nodes can retain GSAP's previous transform cache after a lap.
    animation = window.gsap.fromTo(
      card,
      { x: 0, y: 0, rotation: 0, opacity: 1 },
      {
        x: exitDirection * Math.max(stage.clientWidth, 400),
        rotation: exitDirection * 15,
        opacity: 0,
        duration: 0.3,
        ease: "power3.in",
        onComplete: finish,
      },
    );
  } else finish();
}

function resetDrag() {
  if (!drag) return;
  const { card, pointerId } = drag;
  drag = undefined;
  if (card.hasPointerCapture(pointerId)) card.releasePointerCapture(pointerId);
  card.style.removeProperty("transform");
}

cards.forEach((card) => {
  card.addEventListener("pointerdown", (event) => {
    // Interactive descendants keep their native click/activation behavior.
    if (
      changing ||
      card.inert ||
      !event.isPrimary ||
      event.button !== 0 ||
      event.target.closest("a, button, input, select, textarea")
    )
      return;
    drag = { card, pointerId: event.pointerId, x: event.clientX, moved: 0 };
    card.setPointerCapture(event.pointerId);
  });
  card.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.moved = event.clientX - drag.x;
    card.style.transform = `translate(${drag.moved}px, ${Math.abs(drag.moved) * 0.04}px) rotate(${drag.moved / 25}deg)`;
  });
  card.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const moved = drag.moved;
    resetDrag();
    if (Math.abs(moved) > 80) change(moved < 0 ? 1 : -1, Math.sign(moved));
  });
  card.addEventListener("pointercancel", resetDrag);
  card.addEventListener("lostpointercapture", resetDrag);
});

document
  .querySelector("#previous-card")
  .addEventListener("click", () => change(-1));
document.querySelector("#next-card").addEventListener("click", () => change(1));
selector.addEventListener("keydown", (event) => {
  if (
    !["ArrowLeft", "ArrowRight"].includes(event.key) ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  event.preventDefault();
  if (!event.repeat) change(event.key === "ArrowLeft" ? -1 : 1);
});

function updatePreference() {
  const hadFocus = selector.contains(document.activeElement);
  animation?.kill();
  resetDrag();
  render();
  selector.hidden = motionQuery.matches;
  if (motionQuery.matches && hadFocus)
    document.querySelector(".project-grid__card").focus();
}
updatePreference();
motionQuery.addEventListener("change", updatePreference);

withMotion(() => {
  const gsap = window.gsap;
  gsap.from(".hero-letter", {
    yPercent: 100,
    opacity: 0,
    duration: 0.8,
    stagger: 0.035,
    ease: "power4.out",
  });
  gsap.from(".hero-photo", {
    clipPath: "inset(0 0 100% 0)",
    duration: 0.8,
    ease: "power4.inOut",
  });
  gsap.from(".hero-stamp", {
    scale: 1.4,
    rotation: 20,
    duration: 0.55,
    ease: "back.out(2)",
  });
  document.querySelectorAll(".display-banner h2").forEach((element) =>
    gsap.from(element, {
      y: 16,
      opacity: 0,
      duration: 0.6,
      scrollTrigger: {
        trigger: element.parentElement,
        start: "top 92%",
      },
    }),
  );
  document
    .querySelectorAll(".section-heading .line > span, .project-grid__card")
    .forEach((element) =>
      gsap.from(element, {
        y: 35,
        opacity: 0,
        duration: 0.6,
        scrollTrigger: { trigger: element, start: "top 92%" },
      }),
    );
});
