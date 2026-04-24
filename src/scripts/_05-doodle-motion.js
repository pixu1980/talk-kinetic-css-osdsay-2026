const DOODLE_DEMO_STAGE_SELECTOR = "section[intro] .stage";

const initDoodleStage = (stage) => {
	if (
		!(stage instanceof HTMLElement) ||
		stage.dataset.doodleMotionReady === "true"
	) {
		return;
	}

	const title = stage.querySelector(".title");
	if (!(title instanceof HTMLElement)) {
		return;
	}

	stage.dataset.doodleMotionReady = "true";

	const clampPercentage = (value) => Math.max(0, Math.min(100, value));
	const formatPercent = (value) => `${value.toFixed(3)}%`;

	const trailConfigs = [
		{ selector: ".orbit--inner", speed: 0.27 },
		{ selector: ".orbit--middle", speed: 0.2 },
		{ selector: ".orbit--outer", speed: 0.13 },
		{ selector: ".orbit--fourth", speed: 0.09 },
		{ selector: ".orbit--fifth", speed: 0.06 },
	];

	const orbitTrail = trailConfigs
		.map((config) => {
			const element = stage.querySelector(config.selector);
			if (!(element instanceof HTMLElement)) {
				return null;
			}

			const state = {
				element,
				speed: config.speed,
				currentX: 50,
				currentY: 50,
				targetX: 50,
				targetY: 50,
			};

			element.style.setProperty(
				"--doodle-orbit-x",
				formatPercent(state.currentX),
			);
			element.style.setProperty(
				"--doodle-orbit-y",
				formatPercent(state.currentY),
			);

			return state;
		})
		.filter(Boolean);

	const animateOrbitTrail = () => {
		orbitTrail.forEach((orbit) => {
			orbit.currentX += (orbit.targetX - orbit.currentX) * orbit.speed;
			orbit.currentY += (orbit.targetY - orbit.currentY) * orbit.speed;

			orbit.element.style.setProperty(
				"--doodle-orbit-x",
				formatPercent(orbit.currentX),
			);
			orbit.element.style.setProperty(
				"--doodle-orbit-y",
				formatPercent(orbit.currentY),
			);
		});

		requestAnimationFrame(animateOrbitTrail);
	};

	if (orbitTrail.length > 0) {
		requestAnimationFrame(animateOrbitTrail);
	}

	let autoFrameId = null;
	let autoListenersAttached = false;
	let autoPlaying = true;
	let autoPhase = 0;
	let lastAutoTimestamp = null;

	const disableAutoMotion = () => {
		if (!autoPlaying) {
			return;
		}

		autoPlaying = false;
		if (autoFrameId !== null) {
			cancelAnimationFrame(autoFrameId);
			autoFrameId = null;
		}

		if (autoListenersAttached) {
			stage.removeEventListener("pointermove", disableAutoMotion);
			stage.removeEventListener("pointerdown", disableAutoMotion);
			autoListenersAttached = false;
		}

		lastAutoTimestamp = null;
	};

	const enableAutoListeners = () => {
		if (autoListenersAttached) {
			return;
		}

		stage.addEventListener("pointermove", disableAutoMotion, {
			passive: true,
		});
		stage.addEventListener("pointerdown", disableAutoMotion);
		autoListenersAttached = true;
	};

	const setPosition = (px, py) => {
		const clampedX = clampPercentage(px);
		const clampedY = clampPercentage(py);
		const xValue = formatPercent(clampedX);
		const yValue = formatPercent(clampedY);

		stage.style.setProperty("--doodle-title-x", xValue);
		stage.style.setProperty("--doodle-title-y", yValue);
		title.style.setProperty("--doodle-title-x", xValue);
		title.style.setProperty("--doodle-title-y", yValue);

		orbitTrail.forEach((orbit) => {
			orbit.targetX = clampedX;
			orbit.targetY = clampedY;
		});
	};

	const animateAutoMotion = (timestamp) => {
		if (!autoPlaying) {
			return;
		}

		const cycle = 6000;
		if (lastAutoTimestamp !== null) {
			autoPhase += (timestamp - lastAutoTimestamp) / cycle;
		}

		lastAutoTimestamp = timestamp;
		autoPhase %= 1;

		const angle = autoPhase * Math.PI * 2;
		const sinAngle = Math.sin(angle);
		const cosAngle = Math.cos(angle);
		const denom = sinAngle * sinAngle + 1;
		const rawX = cosAngle / denom;
		const rawY = (sinAngle * cosAngle) / denom;

		setPosition(50 + rawX * 36, 50 + rawY * 28);
		autoFrameId = requestAnimationFrame(animateAutoMotion);
	};

	const startAutoMotion = () => {
		autoPlaying = true;
		enableAutoListeners();

		if (autoFrameId !== null) {
			cancelAnimationFrame(autoFrameId);
		}

		lastAutoTimestamp = null;
		autoFrameId = requestAnimationFrame(animateAutoMotion);
	};

	const calibrateVisualOffset = (attempt = 0) => {
		if (attempt > 5) {
			return;
		}

		const styles = getComputedStyle(stage);
		const posX =
			Number.parseFloat(styles.getPropertyValue("--doodle-title-x")) || 50;
		const posY =
			Number.parseFloat(styles.getPropertyValue("--doodle-title-y")) || 50;
		if (Math.abs(posX - 50) > 0.5 || Math.abs(posY - 50) > 0.5) {
			return;
		}

		const stageRect = stage.getBoundingClientRect();
		const titleRect = title.getBoundingClientRect();
		if (!stageRect.height || !titleRect.height) {
			return;
		}

		const delta =
			titleRect.top -
			stageRect.top +
			titleRect.height / 2 -
			stageRect.height / 2;

		if (Math.abs(delta) < 0.2) {
			return;
		}

		const computedOffset = getComputedStyle(stage).getPropertyValue(
			"--doodle-title-offset",
		);
		const currentOffset = Number.parseFloat(computedOffset) || 0;

		stage.style.setProperty(
			"--doodle-title-offset",
			`${currentOffset + delta}px`,
		);

		requestAnimationFrame(() => calibrateVisualOffset(attempt + 1));
	};

	let calibrationFrame = null;
	const scheduleCalibration = () => {
		if (calibrationFrame !== null) {
			return;
		}

		calibrationFrame = requestAnimationFrame(() => {
			calibrationFrame = null;
			calibrateVisualOffset();
		});
	};

	let dragging = false;
	let offsetX = 0;
	let offsetY = 0;

	const onPointerDown = (event) => {
		event.preventDefault();
		disableAutoMotion();
		dragging = true;
		title.setPointerCapture?.(event.pointerId);

		const rect = title.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		offsetX = centerX - event.clientX;
		offsetY = centerY - event.clientY;
	};

	const onPointerMove = (event) => {
		if (!dragging) {
			return;
		}

		event.preventDefault();
		const stageRect = stage.getBoundingClientRect();
		const newCenterX = event.clientX + offsetX;
		const newCenterY = event.clientY + offsetY;
		const px = ((newCenterX - stageRect.left) / stageRect.width) * 100;
		const py = ((newCenterY - stageRect.top) / stageRect.height) * 100;

		setPosition(px, py);
	};

	const onPointerUp = (event) => {
		if (!dragging) {
			return;
		}

		event.preventDefault();
		dragging = false;
		title.releasePointerCapture?.(event.pointerId);
		scheduleCalibration();
	};

	title.addEventListener("pointerdown", onPointerDown);
	title.addEventListener("pointermove", onPointerMove);
	title.addEventListener("pointerup", onPointerUp);
	title.addEventListener("pointercancel", onPointerUp);

	title.addEventListener("keydown", (event) => {
		const step = 2;
		const styles = getComputedStyle(stage);
		const currentX = Number.parseFloat(
			styles.getPropertyValue("--doodle-title-x") || "50",
		);
		const currentY = Number.parseFloat(
			styles.getPropertyValue("--doodle-title-y") || "50",
		);

		let px = currentX;
		let py = currentY;

		if (event.key === "ArrowLeft") {
			px -= step;
		} else if (event.key === "ArrowRight") {
			px += step;
		} else if (event.key === "ArrowUp") {
			py -= step;
		} else if (event.key === "ArrowDown") {
			py += step;
		} else {
			return;
		}

		event.preventDefault();
		setPosition(px, py);
		scheduleCalibration();
	});

	let resizeFrame = null;
	window.addEventListener("resize", () => {
		if (resizeFrame !== null) {
			cancelAnimationFrame(resizeFrame);
		}

		resizeFrame = requestAnimationFrame(() => {
			resizeFrame = null;
			scheduleCalibration();
		});
	});

	if (document.fonts?.ready) {
		document.fonts.ready.then(() => {
			scheduleCalibration();
		});
	}

	setPosition(50, 50);
	startAutoMotion();
	scheduleCalibration();
};

export const initDoodleMotionDemo = () => {
	const stages = document.querySelectorAll(DOODLE_DEMO_STAGE_SELECTOR);
	if (stages.length === 0) {
		return;
	}

	stages.forEach((stage) => {
		initDoodleStage(stage);
	});
};
