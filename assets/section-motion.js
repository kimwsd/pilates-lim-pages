(() => {
  if (!window.IntersectionObserver || !Element.prototype.animate) return;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const sections = [
    ".door > div", ".lim-main > section:not(.reel)", ".sub-head",
    ".about-intro", ".about-story", ".about-cards > section",
    ".program-lead", ".program-choices", ".program-notes > section", ".program-cards > a",
    ".reading > :not(.program-cards, .program-notes, .review-board)",
    ".review-filters", ".review-gallery > a", ".review-empty", ".review-results > .story-row", "body > footer"
  ].join(",");
  const animations = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (preference.matches || entry.target.matches(":focus-within")) continue;
      const animation = entry.target.animate(
        [{opacity:0.35, translate:"0 12px"}, {opacity:1, translate:"0 0"}],
        {duration:460, easing:"cubic-bezier(.22,.68,.25,1)"}
      );
      animations.add(animation);
      animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    }
  });
  function register() {
    observer.disconnect();
    if (!preference.matches) document.querySelectorAll(sections).forEach(section => observer.observe(section));
  }
  preference.addEventListener("change", () => {
    for (const animation of animations) animation.cancel();
    register();
  });
  register();
})();
