import "@pixu-talks/core";

import "./baseline-status/baseline-status.js";

import { initFpsBasics } from "./_00-fps-basics.js";
import { initDoodleMotionDemo } from "./_05-doodle-motion.js";

import { initSlideHooks } from "./_slide-hooks.js";
import { initTiltLayeredCard } from "./_tilt-layered-card.js";

/**
 * Initialize all motion JavaScript
 */

document.addEventListener("DOMContentLoaded", () => {
	initDoodleMotionDemo();
	initFpsBasics();
	initSlideHooks();
	initTiltLayeredCard();
});
