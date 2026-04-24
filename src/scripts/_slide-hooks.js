/**
 * Reveal slide hooks
 *
 * Purpose:
 * - Add a minimal accessibility enhancement when the slide changes.
 *
 * DOM contract:
 * - When Reveal is available, on each slide change:
 *   - Find `.motion-title` inside the active slide.
 *   - Set `aria-live="polite"` so screen readers can announce it.
 */

export const initSlideHooks = () => {
	if (typeof Reveal === "undefined") {
		return;
	}

	Reveal.on("slidechanged", (event) => {
		const currentSlide = event.currentSlide;
		const title = currentSlide?.querySelector(".motion-title");
		if (title) {
			title.setAttribute("aria-live", "polite");
		}
	});
};
