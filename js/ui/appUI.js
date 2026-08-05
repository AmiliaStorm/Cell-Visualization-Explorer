const STAGE_DETAILS = {
  dna: {
    number: 1,
    title: "DNA",
    location: "Nucleus",
    description:
      "Protein instructions are stored in DNA.",
  },

  mrna: {
    number: 2,
    title: "mRNA",
    location: "Exits nucleus",
    description:
      "A messenger RNA copy is produced and exported.",
  },

  translation: {
    number: 3,
    title: "Translation",
    location: "Ribosome on rough ER",
    description:
      "The ribosome assembles amino acids into a protein.",
  },

  transport: {
    number: 4,
    title: "Transport Vesicle",
    location: "ER to Golgi",
    description:
      "The newly produced protein travels toward the Golgi.",
  },

  golgi: {
    number: 5,
    title: "Golgi Apparatus",
    location: "Modification and packaging",
    description:
      "The Golgi modifies, sorts, and packages the protein.",
  },

  secretion: {
    number: 6,
    title: "Secretion",
    location: "Cell membrane",
    description:
      "The completed protein is released outside the cell.",
  },
};

function formatTime(seconds) {
  const safeSeconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const minutes = Math.floor(
    safeSeconds / 60
  );

  const remainingSeconds =
    safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export function createAppUI({
  simulation,
}) {
  const playPauseButton =
    document.querySelector(
      "#play-pause-button"
    );

  const restartButton =
    document.querySelector(
      "#restart-button"
    );

  const startButton =
    document.querySelector(
      "#start-simulation-button"
    );

  const speedSelect =
    document.querySelector(
      "#speed-select"
    );

  const timelineSlider =
    document.querySelector(
      "#timeline-slider"
    );

  const timelineProgress =
    document.querySelector(
      "#timeline-progress"
    );

  const timelineTime =
    document.querySelector(
      "#timeline-time"
    );

  const stageNumber =
    document.querySelector(
      "#active-stage-number"
    );

  const stageTitle =
    document.querySelector(
      "#active-stage-title"
    );

  const stageLocation =
    document.querySelector(
      "#active-stage-location"
    );

  const timelineStageTitle =
    document.querySelector(
      "#timeline-stage-title"
    );

  const timelineStageDescription =
    document.querySelector(
      "#timeline-stage-description"
    );

  const pathwayStages = [
    ...document.querySelectorAll(
      ".pathway-stage"
    ),
  ];

  const timelineStages = [
    ...document.querySelectorAll(
      ".timeline-stage"
    ),
  ];

  const navItems = [
    ...document.querySelectorAll(
      ".nav-item"
    ),
  ];

  let lastStage = null;

  timelineSlider.max =
    String(
      simulation.totalDuration
    );

  function seekToStage(button) {
    const time = Number(
      button.dataset.stageTime
    );

    simulation.seek(time);
    simulation.play();
  }

  pathwayStages.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          seekToStage(button);
        }
      );
    }
  );

  timelineStages.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          seekToStage(button);
        }
      );
    }
  );

function toggleSimulation() {
  if (simulation.isPlaying) {
    simulation.pause();
  } else {
    simulation.play();
  }
}

playPauseButton.addEventListener(
  "click",
  toggleSimulation
);

startButton.addEventListener(
  "click",
  toggleSimulation
);

restartButton.addEventListener(
  "click",
  () => {
    simulation.restart();
  }
);

  speedSelect.addEventListener(
    "change",
    () => {
      simulation.setSpeed(
        Number(speedSelect.value)
      );
    }
  );

  timelineSlider.addEventListener(
    "input",
    () => {
      simulation.seek(
        Number(timelineSlider.value)
      );
    }
  );

  navItems.forEach((item) => {
    item.addEventListener(
      "click",
      () => {
        navItems.forEach(
          (navItem) => {
            navItem.classList.remove(
              "active"
            );
          }
        );

        item.classList.add("active");
      }
    );
  });

  function updateStage(stageId) {
    if (stageId === lastStage) {
      return;
    }

    lastStage = stageId;

    const details =
      STAGE_DETAILS[stageId];

    if (!details) {
      return;
    }

    stageNumber.textContent =
      String(details.number);

    stageTitle.textContent =
      details.title;

    stageLocation.textContent =
      details.location;

    timelineStageTitle.textContent =
      details.title;

    timelineStageDescription.textContent =
      details.description;

    pathwayStages.forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.stageId ===
            stageId
        );
      }
    );

    timelineStages.forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.stageId ===
            stageId
        );
      }
    );
  }

  function update() {
    const currentTime =
      simulation.time;

    const duration =
      simulation.totalDuration;

    const progress =
      duration > 0
        ? currentTime / duration
        : 0;

    timelineProgress.style.width =
      `${progress * 100}%`;

    timelineSlider.value =
      String(currentTime);

    timelineTime.textContent =
      `${formatTime(
        currentTime
      )} / ${formatTime(duration)}`;

    playPauseButton.textContent =
      simulation.isPlaying
        ? "Ⅱ"
        : "▶";

    startButton.innerHTML =
      simulation.isPlaying
        ? "<span>Ⅱ</span> Pause Protein Production"
        : "<span>▶</span> Continue Protein Production";

    updateStage(
      simulation.stage
    );
  }

  return {
    update,
  };
}