(() => {
  const stages = [...document.querySelectorAll(".stage")];
  const points = [...document.querySelectorAll(".timeline-point")];
  const progress = document.getElementById("timelineProgress");

  if (!stages.length || !points.length || !progress) return;

  let active = 0;

  function setActive(index) {
    active = Math.max(0, Math.min(index, stages.length - 1));

    stages.forEach((stage, i) => {
      stage.classList.toggle("is-current", i === active);
    });

    points.forEach((point, i) => {
      point.classList.toggle("is-active", i === active);
      point.setAttribute("aria-current", i === active ? "step" : "false");
    });

    const width = active === 0 ? 0 : (active / (points.length - 1)) * 86;
    progress.style.width = `${width}%`;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        setActive(Number(visible[0].target.dataset.stage));
      }
    },
    {
      root: null,
      rootMargin: "-26% 0px -46% 0px",
      threshold: [0.1, 0.25, 0.45, 0.65]
    }
  );

  stages.forEach((stage) => observer.observe(stage));

  points.forEach((point) => {
    point.addEventListener("click", () => {
      const index = Number(point.dataset.stage);
      stages[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  setActive(0);
})();
