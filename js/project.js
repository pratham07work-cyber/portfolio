import { motionQuery, withMotion } from "./shared.js";

const consoleElement = document.querySelector("#arch-console");
const nodes = [...consoleElement.querySelectorAll("[data-node]")];
const details = [...consoleElement.querySelectorAll("[data-detail]")];
const tabs = [...consoleElement.querySelectorAll(".arch-tab-btn")];
const panels = [...consoleElement.querySelectorAll(".arch-view-panel")];
const nodeStatus = document.querySelector("#node-status");
const flowStatus = document.querySelector("#flow-status");
const flowSelect = document.querySelector("#flow-path");
const flowButton = document.querySelector("#run-sim-btn");
let timer;
let playing = false;

function selectNode(id, announce = true) {
  nodes.forEach((node) => {
    const active = node.dataset.node === id;
    node.classList.toggle("is-selected", active);
    node.setAttribute("aria-pressed", String(active));
  });
  details.forEach((detail) => (detail.hidden = detail.dataset.detail !== id));
  if (announce) {
    const detail = details.find((element) => element.dataset.detail === id);
    nodeStatus.textContent = `${detail.querySelector("h4").textContent}. ${detail.querySelector(".arch-hud__desc").textContent}`;
  }
}

function stopFlow() {
  clearTimeout(timer);
  playing = false;
  nodes.forEach((node) => node.classList.remove("is-lit"));
  flowButton.textContent = "Show example flow";
  flowButton.setAttribute("aria-pressed", "false");
}

function selectTab(index, focus = false) {
  stopFlow();
  tabs.forEach((tab, i) => {
    const active = i === index;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[i].hidden = !active;
  });
  if (focus) tabs[index].focus();
  window.ScrollTrigger?.refresh();
}

nodes.forEach((node, index) => {
  node.setAttribute("role", "button");
  node.setAttribute("tabindex", "0");
  node.setAttribute("aria-controls", `detail-${node.dataset.node}`);
  node.addEventListener("click", () => {
    stopFlow();
    selectNode(node.dataset.node);
  });
  node.addEventListener("keydown", (event) => {
    if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      node.dispatchEvent(new MouseEvent("click"));
    } else if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      event.preventDefault();
      const direction = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
      nodes[(index + direction + nodes.length) % nodes.length].focus();
    }
  });
});

consoleElement.querySelector(".arch-views-nav").setAttribute("role", "tablist");
tabs.forEach((tab, index) => {
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", panels[index].id);
  panels[index].setAttribute("role", "tabpanel");
  panels[index].setAttribute("aria-labelledby", tab.id);
  panels[index].tabIndex = 0;
  tab.addEventListener("click", () => selectTab(index));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectTab(next, true);
  });
});

flowButton.setAttribute("aria-pressed", "false");
flowButton.addEventListener("click", () => {
  if (playing) {
    stopFlow();
    flowStatus.textContent =
      "Example flow paused. Select a component to explore it.";
    return;
  }
  selectTab(0);
  const steps = flowSelect.value.split(",");
  const names = steps.map((id) =>
    nodes.find((node) => node.dataset.node === id).getAttribute("aria-label"),
  );
  const summary = `Illustrative path: ${names.join(" → ")}. No live requests or measurements are performed.`;
  flowStatus.textContent = summary;
  // Reduced motion presents the complete path without timed selection changes.
  if (motionQuery.matches) {
    selectNode(steps[0], false);
    return;
  }
  playing = true;
  flowButton.textContent = "Pause example flow";
  flowButton.setAttribute("aria-pressed", "true");
  let step = 0;
  const advance = () => {
    if (step === steps.length) {
      stopFlow();
      flowStatus.textContent = `Example complete. ${summary}`;
      return;
    }
    const id = steps[step++];
    selectNode(id, false);
    nodes.forEach((node) =>
      node.classList.toggle("is-lit", node.dataset.node === id),
    );
    timer = setTimeout(advance, 500);
  };
  advance();
});
flowSelect.addEventListener("change", () => {
  stopFlow();
  flowStatus.textContent = "";
});
motionQuery.addEventListener("change", stopFlow);
window.addEventListener("pagehide", stopFlow);

selectNode(nodes[0].dataset.node, false);
selectTab(0);
consoleElement.querySelector(".arch-controls").hidden = false;
consoleElement.querySelector(".arch-demo").hidden = false;

withMotion(() => {
  const gsap = window.gsap;
  gsap.from(".project-hero h1", {
    y: 25,
    opacity: 0,
    duration: 0.8,
    ease: "power4.out",
  });
  gsap.from(".display-banner h2", {
    y: 16,
    opacity: 0,
    duration: 0.6,
    scrollTrigger: {
      trigger: ".display-banner",
      start: "top 92%",
    },
  });
  gsap.from(".case-feature-list li", {
    x: -25,
    opacity: 0,
    stagger: 0.06,
    scrollTrigger: { trigger: ".case-feature-list", start: "top 90%" },
  });
  gsap.from(".arch-console", {
    y: 30,
    opacity: 0,
    duration: 0.7,
    scrollTrigger: { trigger: ".arch-console", start: "top 92%" },
  });
});
