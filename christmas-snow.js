
(() => {
  function addChristmasSnow() {
    const hero = document.querySelector(".hero");
    if (!hero || hero.querySelector(".christmas-snow")) return;

    const style = document.createElement("style");
    style.textContent = `
      .hero { position: relative; overflow: hidden; }
      .christmas-snow {
        position: absolute;
        inset: 0;
        z-index: 3;
        pointer-events: none;
        overflow: hidden;
      }
      .christmas-snow span {
        position: absolute;
        top: -20px;
        left: var(--x);
        width: var(--size);
        height: var(--size);
        border-radius: 50%;
        background: white;
        opacity: .85;
        box-shadow: 0 0 5px rgba(255,255,255,.8);
        animation: snow-fall var(--duration) linear infinite;
        animation-delay: var(--delay);
      }
      @keyframes snow-fall {
        from { transform: translateY(-20px); }
        to { transform: translateY(650px); }
      }
      @media (prefers-reduced-motion: reduce) {
        .christmas-snow span { animation: none; }
      }
    `;
    document.head.appendChild(style);

    const snow = document.createElement("div");
    snow.className = "christmas-snow";
    snow.setAttribute("aria-hidden", "true");

    for (let i = 0; i < 28; i++) {
      const flake = document.createElement("span");
      flake.style.setProperty("--x", Math.random() * 100 + "%");
      flake.style.setProperty("--size", 2 + Math.random() * 4 + "px");
      flake.style.setProperty("--duration", 7 + Math.random() * 7 + "s");
      flake.style.setProperty("--delay", -Math.random() * 14 + "s");
      snow.appendChild(flake);
    }
    hero.appendChild(snow);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addChristmasSnow);
  } else {
    addChristmasSnow();
  }
})();
