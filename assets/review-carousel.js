(() => {
  "use strict";
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  function autoplay(region, advance, canAdvance, interval) {
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
    const schedule = autoplay(hero, advanceHero, () => true, 3000);
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
  const originals = [...track.children];
  let first = 0;
  let stride = 0;
  let looping = false;
  let hovered = false;
  const schedule = autoplay(track.closest("section"), advance, () => looping && !hovered, 2000);

  function copies() {
    return originals.map(card => {
      const copy = card.cloneNode(true);
      copy.dataset.reviewCopy = "";
      copy.setAttribute("aria-hidden", "true");
      copy.setAttribute("data-nosnippet", "");
      copy.querySelectorAll("a").forEach(link => { link.tabIndex = -1; });
      return copy;
    });
  }

  function currentIndex() {
    if (!stride) return 0;
    const index = Math.round((track.scrollLeft - first) / stride);
    return ((index % originals.length) + originals.length) % originals.length;
  }

  function measure() {
    const index = currentIndex();
    const columns = Number(getComputedStyle(track).getPropertyValue("--review-columns"));
    const needsLoop = originals.length > columns;
    if (needsLoop !== looping) {
      looping = needsLoop;
      track.classList.toggle("reviews-loop", looping);
      if (looping) {
        track.prepend(...copies());
        track.append(...copies());
      } else {
        track.querySelectorAll("[data-review-copy]").forEach(copy => copy.remove());
        track.scrollLeft = 0;
      }
    }
    controls.hidden = !looping;
    if (looping) {
      const left = originals[0].getBoundingClientRect().left;
      stride = originals[1].getBoundingClientRect().left - left;
      first = left - track.getBoundingClientRect().left + track.scrollLeft - parseFloat(getComputedStyle(track).scrollPaddingLeft);
      track.scrollTo({left:first + index * stride, behavior:"instant"});
    }
    schedule();
  }

  function normalize() {
    if (!looping || !stride) return;
    const rounded = Math.round((track.scrollLeft - first) / stride);
    if (rounded < 0 || rounded >= originals.length) {
      track.scrollTo({left:first + currentIndex() * stride, behavior:"instant"});
    }
  }

  function advance(step) {
    if (!looping) return;
    normalize();
    track.scrollTo({left:first + (currentIndex() + step) * stride, behavior:motion.matches ? "instant" : "smooth"});
  }

  track.addEventListener("scrollend", normalize);
  controls.addEventListener("click", event => {
    const button = event.target.closest("button[data-step]");
    if (button) { advance(Number(button.dataset.step)); schedule(); }
  });
  track.addEventListener("pointerenter", event => { hovered = event.pointerType === "mouse"; schedule(); });
  track.addEventListener("pointerleave", () => { hovered = false; schedule(); });
  track.addEventListener("wheel", schedule, {passive:true});
  new ResizeObserver(measure).observe(track);
})();
