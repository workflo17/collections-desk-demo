// The showcase's only script. On a tour page it shows the step, rings the control the step is about,
// and on Next types the step's values and presses it, then opens the page the desk answered with when
// the build pressed it for real. Everywhere else a button answers with a note: this copy is recorded,
// so nothing here changes the ledger.
(() => {
  const banner = document.querySelector(".showcase-banner");
  const root = banner ? banner.getAttribute("data-root") || "" : "";
  const tourStart = `${root}tour/01/index.html`;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((ok) => setTimeout(ok, reduced ? Math.min(ms, 80) : ms));
  const data = (() => {
    const el = document.getElementById("showcase-tour");
    try {
      return el ? JSON.parse(el.textContent) : null;
    } catch {
      return null;
    }
  })();

  let toastTimer = 0;
  function toast(text, withTour) {
    let el = document.querySelector(".showcase-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "showcase-toast";
      el.setAttribute("role", "status");
      document.body.append(el);
    }
    el.textContent = text;
    if (withTour) {
      const a = document.createElement("a");
      a.href = tourStart;
      a.textContent = "Take the tour";
      el.append(" ", a);
    }
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 6000);
  }

  const submitButton = (form) => form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]');
  const target = data ? document.querySelector("[data-tour-target]") : null;

  // the front page's demo buttons open the desk where the tour's second step stands
  document.addEventListener("submit", (ev) => {
    const form = ev.target;
    if (!(form instanceof HTMLFormElement)) return;
    ev.preventDefault();
    if (form.hasAttribute("data-showcase-start")) {
      location.href = form.getAttribute("action");
      return;
    }
    if (data && target && (form === target || target.contains(form) || form.contains(target))) {
      next();
      return;
    }
    toast(data ? "In the tour, press Next to see what this button does." : "This copy is recorded, so its buttons don't change anything.", !data);
  });

  document.addEventListener("click", (ev) => {
    const a = ev.target instanceof Element ? ev.target.closest("a") : null;
    if (!a) return;
    const missing = a.getAttribute("data-showcase-missing");
    if (missing) {
      ev.preventDefault();
      toast(/^\/(signup|login)/.test(missing) ? "Accounts aren't open on this recorded copy." : "That page isn't part of this recorded copy.", !data);
      return;
    }
    if (data && a === target && data.act === "follow") {
      ev.preventDefault();
      next();
    }
  });

  if (!data) return;

  // ---- the tour ------------------------------------------------------------------------------
  document.documentElement.classList.add("showcase-touring");
  const ring = target ? (target.tagName === "FORM" ? submitButton(target) || target : target) : null;
  if (ring) ring.classList.add("tour-ring");

  const panel = document.createElement("section");
  panel.className = "tour-panel";
  panel.setAttribute("aria-label", "Guided tour");
  panel.innerHTML = `<div class="tour-bar"><i></i></div><p class="tour-count"></p><h2></h2><p class="tour-text"></p>
<div class="tour-row"><button type="button" class="tour-back">Back</button><button type="button" class="tour-next"></button><a class="tour-leave">Leave the tour</a></div>`;
  panel.querySelector(".tour-bar i").style.width = `${(data.n / data.total) * 100}%`;
  panel.querySelector(".tour-count").textContent = `Tour · ${data.n} of ${data.total}`;
  panel.querySelector("h2").textContent = data.title;
  panel.querySelector(".tour-text").textContent = data.text;
  const back = panel.querySelector(".tour-back");
  if (data.back) back.addEventListener("click", () => (location.href = data.back));
  else back.hidden = true;
  const nextBtn = panel.querySelector(".tour-next");
  nextBtn.textContent = data.n === data.total ? "Explore the desk" : "Next";
  nextBtn.addEventListener("click", () => next());
  const leave = panel.querySelector(".tour-leave");
  leave.href = data.end;
  if (data.n === data.total) leave.hidden = true;
  document.body.append(panel);

  if (ring) {
    const r = ring.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - panel.offsetHeight - 24) ring.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  }

  document.addEventListener("keydown", (ev) => {
    const typing = ev.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);
    if (typing || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (ev.key === "ArrowRight") next();
    if (ev.key === "ArrowLeft" && data.back) location.href = data.back;
  });

  let busy = false;
  async function next() {
    if (busy) return;
    busy = true;
    nextBtn.disabled = true;
    if (data.act === "submit" && target) {
      const form = target.tagName === "FORM" ? target : target.closest("form");
      for (const [name, value] of Object.entries(data.fill || {})) {
        const el = form && form.elements.namedItem(name);
        if (!el || !("value" in el)) continue;
        await wait(220);
        if (el.type === "checkbox" || el.type === "radio") {
          el.checked = true;
          continue;
        }
        if (el.tagName === "SELECT") {
          el.value = value;
          continue;
        }
        el.focus({ preventScroll: false });
        el.value = "";
        for (const ch of value) {
          el.value += ch;
          await wait(38);
        }
      }
      if (ring) {
        await wait(250);
        ring.classList.add("tour-press");
      }
      await wait(420);
    } else if (data.act === "follow" && ring) {
      ring.classList.add("tour-press");
      await wait(320);
    }
    location.href = data.next;
  }
})();
