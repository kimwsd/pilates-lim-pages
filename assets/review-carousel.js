(() => {
  const track = document.getElementById("review-cards");
  const controls = document.querySelector(".review-controls");
  if (!track || !controls || !track.children.length) return;

  const play = controls.querySelector("[data-play]");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let playing = !motion.matches;
  let visible = false;
  let hovered = false;
  let dragging = false;
  let timer;
  let positions = [];

  function schedule() {
    clearTimeout(timer);
    play.textContent = playing ? "자동 넘김 멈춤" : "자동 넘김 시작";
    if (playing && visible && positions.length > 1 && !document.hidden && !hovered && !dragging &&
        !track.contains(document.activeElement)) {
      timer = setTimeout(() => advance(1), 5000);
    }
  }

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
    schedule();
  }

  controls.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button === play) playing = !playing;
    else {
      playing = false;
      advance(Number(button.dataset.step));
    }
    schedule();
  });
  track.addEventListener("pointerenter", event => {hovered = event.pointerType === "mouse"; schedule()});
  track.addEventListener("pointerleave", () => {hovered = false; schedule()});
  track.addEventListener("pointerdown", () => {dragging = true; schedule()});
  function release() {if (dragging) {dragging = false; schedule()}}
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  track.addEventListener("focusin", schedule);
  track.addEventListener("focusout", () => requestAnimationFrame(schedule));
  track.addEventListener("scroll", schedule, {passive:true});
  document.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", () => {playing = !motion.matches; schedule()});
  new ResizeObserver(measure).observe(track);
  new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; schedule()}).observe(track);
  measure();
})();
