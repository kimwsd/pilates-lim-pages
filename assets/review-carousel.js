(() => {
  "use strict";
  const interval = 3000;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  function autoplay(region, advance, canAdvance) {
    let visible = false;
    let held = false;
    let timer;

    function schedule() {
      clearTimeout(timer);
      if (visible && !document.hidden && !motion.matches && !held &&
          !region.querySelector(":focus-visible") && canAdvance()) {
        timer = setTimeout(() => { advance(1); schedule(); }, interval);
      }
    }

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }).observe(region);
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", schedule);
    region.addEventListener("focusin", schedule);
    region.addEventListener("focusout", () => requestAnimationFrame(schedule));
    region.addEventListener("pointerdown", () => { held = true; schedule(); });
    function release() {
      if (held) { held = false; schedule(); }
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return schedule;
  }

  const hero = document.querySelector(".reel");
  const slides = hero ? [...hero.querySelectorAll(".slide-select")] : [];
  if (slides.length > 1) {
    function advanceHero(step) {
      const index = slides.findIndex(slide => slide.checked);
      slides[(index + step + slides.length) % slides.length].checked = true;
    }
    const schedule = autoplay(hero, advanceHero, () => true);
    hero.addEventListener("change", schedule);
    let swipe;
    hero.addEventListener("touchstart", event => {
      swipe = event.touches.length === 1 && !event.target.closest("label,a,input") ? event.touches[0] : null;
    }, {passive:true});
    hero.addEventListener("touchcancel", () => { swipe = null; });
    hero.addEventListener("touchend", event => {
      if (!swipe) return;
      const end = event.changedTouches[0];
      const dx = end.clientX - swipe.clientX, dy = end.clientY - swipe.clientY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        advanceHero(dx < 0 ? 1 : -1);
        schedule();
      }
      swipe = null;
    }, {passive:true});
  }

  const track = document.getElementById("review-cards");
  const controls = document.querySelector(".review-controls");
  if (!track || !controls || !track.children.length) return;
  let positions = [];
  let hovered = false;
  const schedule = autoplay(track.closest("section"), advance, () => positions.length > 1 && !hovered);

  function measure() {
    const limit = track.scrollWidth - track.clientWidth;
    const start = track.firstElementChild.getBoundingClientRect().left;
    positions = [0];
    for (const card of track.children) {
      const left = Math.min(card.getBoundingClientRect().left - start, limit);
      if (left > positions.at(-1) + 1) positions.push(left);
    }
    controls.hidden = positions.length < 2;
    schedule();
  }

  function advance(step) {
    if (positions.length < 2) return;
    const current = track.scrollLeft;
    const next = step > 0 ? positions.find(x => x > current + 2) : positions.findLast(x => x < current - 2);
    const left = next ?? (step > 0 ? 0 : positions.at(-1));
    track.scrollTo({left, behavior:motion.matches || next === undefined ? "instant" : "smooth"});
  }

  controls.addEventListener("click", event => {
    const button = event.target.closest("button[data-step]");
    if (button) { advance(Number(button.dataset.step)); schedule(); }
  });
  track.addEventListener("pointerenter", event => { hovered = event.pointerType === "mouse"; schedule(); });
  track.addEventListener("pointerleave", () => { hovered = false; schedule(); });
  track.addEventListener("wheel", schedule, {passive:true});
  new ResizeObserver(measure).observe(track);
})();
