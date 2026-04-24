/**
 * Tilt Layered Card interactions
 *
 * Purpose:
 * - Track pointer position and expose it to CSS as --tilt-card--pos-x and --tilt-card--pos-y.
 *
 * DOM contract:
 * - Requires one or more elements matching `.card-container`.
 * - Each container receives CSS custom properties:
 *   - --tilt-card--pos-x: number in range [-1, 1]
 *   - --tilt-card--pos-y: number in range [-1, 1]
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const initTiltLayeredCard = () => {
	const containers = document.querySelectorAll(".card-container");

	if (containers.length === 0) {
		return;
	}

	containers.forEach((container) => {
		let isDragging = false;

		const updateFromPointer = (event) => {
			const rect = container.getBoundingClientRect();
			const x = clamp(
				((event.clientX - rect.left) / rect.width) * 2 - 1,
				-1,
				1,
			);
			const y = clamp(
				((event.clientY - rect.top) / rect.height) * 2 - 1,
				-1,
				1,
			);

			container.style.setProperty("--tilt-card--pos-x", x.toFixed(3));
			container.style.setProperty("--tilt-card--pos-y", y.toFixed(3));
		};

		const resetPointer = () => {
			container.style.removeProperty("--tilt-card--pos-x");
			container.style.removeProperty("--tilt-card--pos-y");
		};

		container.addEventListener("pointerdown", (event) => {
			if (event.button !== 0) {
				return;
			}

			isDragging = true;
			container.classList.add("is-dragging");
			container.setPointerCapture(event.pointerId);
			updateFromPointer(event);
		});

		container.addEventListener("pointermove", (event) => {
			if (!isDragging) {
				return;
			}

			updateFromPointer(event);
		});

		const stopDrag = (event) => {
			if (!isDragging) {
				return;
			}

			isDragging = false;
			container.classList.remove("is-dragging");
			resetPointer();

			try {
				container.releasePointerCapture(event.pointerId);
			} catch {
				// Ignore if capture was already released.
			}
		};

		container.addEventListener("pointerup", stopDrag);
		container.addEventListener("pointercancel", stopDrag);

		container.addEventListener("pointerleave", () => {
			if (isDragging) {
				return;
			}

			resetPointer();
		});
	});
};
