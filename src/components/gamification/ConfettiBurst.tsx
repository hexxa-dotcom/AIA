"use client";
import confetti from "canvas-confetti";

export function fireConfetti(intensity: "soft" | "medium" | "big" = "medium") {
  const counts = { soft: 35, medium: 80, big: 180 };
  const count = counts[intensity];
  confetti({
    particleCount: count,
    spread: 70,
    origin: { y: 0.7 },
    colors: ["#141414", "#555552", "#8c8c88", "#c9c9c5", "#ffffff"],
    scalar: 0.9,
    ticks: 200,
  });
}

export function fireLevelUp() {
  const duration = 1500;
  const end = Date.now() + duration;
  const colors = ["#141414", "#8c8c88", "#d4d4d2", "#ffffff"];
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
