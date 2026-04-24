const LOOP_DURATION_MS = 1000;

const normalizeProgress = (progress) => {
	const wrappedProgress = progress % 100;

	return wrappedProgress < 0 ? wrappedProgress + 100 : wrappedProgress;
};

const formatProgress = (progress) => `${progress.toFixed(1)}%`;

const formatFrameBudget = (fps) => `${(1000 / fps).toFixed(2)}ms per frame`;

const setPlayingState = (button, isPlaying) => {
	button.setAttribute("aria-pressed", String(isPlaying));
	button.textContent = isPlaying ? "Pause image" : "Play image";
};

const createRenderer = (elements, state) => () => {
	const progress = normalizeProgress(state.progress);
	const sampleStep = 100 / state.fps;

	elements.preview.style.setProperty("--fps-progress", progress.toFixed(3));
	elements.positionInput.value = progress.toFixed(1);
	elements.positionOutput.textContent = formatProgress(progress);
	elements.rateOutput.textContent = `${state.fps}fps`;
	elements.statusRate.textContent = `${state.fps}fps`;
	elements.statusBudget.textContent = formatFrameBudget(state.fps);

	elements.frames.forEach((frame, index) => {
		const frameProgress = normalizeProgress(progress + index * sampleStep);

		frame.root.style.setProperty("--fps-progress", frameProgress.toFixed(3));
		frame.progress.textContent = formatProgress(frameProgress);
	});
};

const createStopPlayback = (state, playButton) => () => {
	state.playing = false;
	state.lastTimestamp = 0;
	state.frameAccumulator = 0;

	if (state.rafId) {
		cancelAnimationFrame(state.rafId);
		state.rafId = 0;
	}

	setPlayingState(playButton, false);
};

const initDemo = (root) => {
	const positionInput = root.querySelector("[data-fps-position]");
	const positionOutput = root.querySelector("[data-fps-position-output]");
	const rateInput = root.querySelector("[data-fps-rate]");
	const rateOutput = root.querySelector("[data-fps-rate-output]");
	const playButton = root.querySelector("[data-fps-play]");
	const preview = root.querySelector("[data-fps-preview]");
	const statusRate = root.querySelector("[data-fps-status-rate]");
	const statusBudget = root.querySelector("[data-fps-status-budget]");

	if (
		!(
			positionInput instanceof HTMLInputElement &&
			rateInput instanceof HTMLInputElement &&
			positionOutput instanceof HTMLOutputElement &&
			rateOutput instanceof HTMLOutputElement &&
			playButton instanceof HTMLButtonElement &&
			preview instanceof HTMLElement &&
			statusRate instanceof HTMLElement &&
			statusBudget instanceof HTMLElement
		)
	) {
		return;
	}

	const frames = [...root.querySelectorAll("[data-fps-frame]")]
		.map((frame) => {
			const progress = frame.querySelector("[data-fps-frame-progress]");

			if (
				!(frame instanceof HTMLElement) ||
				!(progress instanceof HTMLElement)
			) {
				return null;
			}

			return { root: frame, progress };
		})
		.filter(Boolean);

	if (frames.length === 0) {
		return;
	}

	const state = {
		fps: Number(rateInput.value),
		progress: Number(positionInput.value),
		playing: false,
		lastTimestamp: 0,
		frameAccumulator: 0,
		rafId: 0,
	};

	const render = createRenderer(
		{
			frames,
			playButton,
			positionInput,
			positionOutput,
			preview,
			rateOutput,
			statusBudget,
			statusRate,
		},
		state,
	);

	const stopPlayback = createStopPlayback(state, playButton);

	const stepPlayback = (timestamp) => {
		if (!state.playing) {
			return;
		}

		if (state.lastTimestamp === 0) {
			state.lastTimestamp = timestamp;
		}

		const delta = timestamp - state.lastTimestamp;
		const frameDuration = LOOP_DURATION_MS / state.fps;

		state.lastTimestamp = timestamp;
		state.frameAccumulator += delta;

		let shouldRender = false;

		while (state.frameAccumulator >= frameDuration) {
			state.frameAccumulator -= frameDuration;
			state.progress = normalizeProgress(state.progress + 100 / state.fps);
			shouldRender = true;
		}

		if (shouldRender) {
			render();
		}

		state.rafId = requestAnimationFrame(stepPlayback);
	};

	positionInput.addEventListener("input", () => {
		state.progress = Number(positionInput.value);
		state.frameAccumulator = 0;
		render();
	});

	rateInput.addEventListener("input", () => {
		state.fps = Number(rateInput.value);
		state.frameAccumulator = 0;
		render();
	});

	playButton.addEventListener("click", () => {
		if (state.playing) {
			stopPlayback();
			return;
		}

		state.playing = true;
		state.lastTimestamp = 0;
		state.frameAccumulator = 0;
		setPlayingState(playButton, true);
		state.rafId = requestAnimationFrame(stepPlayback);
	});

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			stopPlayback();
		}
	});

	if (typeof Reveal !== "undefined") {
		Reveal.on("slidechanged", () => {
			if (!root.closest(".present")) {
				stopPlayback();
			}
		});
	}

	setPlayingState(playButton, false);
	render();
};

export const initFpsBasics = () => {
	const demos = document.querySelectorAll("[data-fps-demo]");

	demos.forEach((demo) => {
		if (demo instanceof HTMLElement) {
			initDemo(demo);
		}
	});
};
