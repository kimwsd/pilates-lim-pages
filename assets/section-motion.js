(() => {
  if (!window.IntersectionObserver || !Element.prototype.animate) return;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const sections = [
    ".door > div", ".lim-main > section:not(.reel)", ".sub-head",
    ".about-intro", ".about-story", ".about-cards > section",
    ".program-lead", ".program-choices", ".program-notes > section", ".program-cards > a",
    ".reading > :not(.program-cards, .program-notes, .review-board, .team-profile)",
    ".team-identity", ".credential-list h4", ".credential-list li",
    ".review-filters", ".review-gallery > a", ".review-empty", ".review-results > .story-row", "body > footer"
  ].join(",");
  const animations = new Set();
  const observer = new IntersectionObserver(entries => {
    // Stagger only rows entering together; later rows start as soon as they are scrolled into view.
    const visibleRows = new Map();
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (preference.matches || entry.target.matches(":focus-within")) continue;
      const list = entry.target.closest("ul[data-credentials]");
      let delay = 0;
      if (list) {
        const position = visibleRows.get(list) || 0;
        delay = 40 + Math.min(position, 5) * 45;
        visibleRows.set(list, position + 1);
      }
      const animation = entry.target.animate(
        [{opacity:0.35, translate:"0 12px"}, {opacity:1, translate:"0 0"}],
        {duration:460, delay, fill:"backwards", easing:"cubic-bezier(.22,.68,.25,1)"}
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
