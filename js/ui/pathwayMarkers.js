import * as THREE from "three";

/*
 * World-space anchor points for each pathway stage.
 * Tuned to line up with layout.js positions.
 */
const STAGE_POINTS = {
  dna:         new THREE.Vector3(-0.92, 0.35, 0.55),
  mrna:        new THREE.Vector3(-0.45, 0.25, 0.30),
  translation: new THREE.Vector3(0.05, 0.00, 0.10),
  transport:   new THREE.Vector3(0.55, -0.10, 0.15),
  golgi:       new THREE.Vector3(1.05, 0.15, 0.35),
  secretion:   new THREE.Vector3(1.55, 0.20, 0.25),
};

const STAGE_ORDER = [
  "dna",
  "mrna",
  "translation",
  "transport",
  "golgi",
  "secretion",
];

export function createPathwayMarkers({
  container,
  camera,
}) {
  const overlay = document.createElement("div");
  overlay.className = "pathway-marker-overlay";
  container.appendChild(overlay);

  const svg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  svg.classList.add("pathway-marker-line");
  overlay.appendChild(svg);

  const path = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  path.setAttribute("class", "pathway-marker-path");
  svg.appendChild(path);

  const markerElements = {};

  STAGE_ORDER.forEach((stageId, index) => {
    const marker = document.createElement("div");
    marker.className = "pathway-marker";
    marker.dataset.stageId = stageId;

    const badge = document.createElement("div");
    badge.className = "pathway-marker-badge";
    badge.textContent = String(index + 1);

    marker.appendChild(badge);
    overlay.appendChild(marker);

    markerElements[stageId] = marker;
  });

  function setActiveStage(stageId) {
    STAGE_ORDER.forEach((id) => {
      markerElements[id].classList.toggle(
        "active",
        id === stageId
      );

      markerElements[id].classList.toggle(
      "completed",
      STAGE_ORDER.indexOf(id) < STAGE_ORDER.indexOf(stageId)
  );
    });
  }

  function projectToScreen(worldPoint) {
    const projected = worldPoint.clone().project(camera);

    const width = container.clientWidth;
    const height = container.clientHeight;

    return {
      x: (projected.x * 0.5 + 0.5) * width,
      y: (-projected.y * 0.5 + 0.5) * height,
    };
  }

  function update() {
    const screenPoints = [];

    STAGE_ORDER.forEach((stageId) => {
      const worldPoint = STAGE_POINTS[stageId];
      const screenPoint = projectToScreen(worldPoint);

      const marker = markerElements[stageId];

      marker.style.transform =
        `translate(${screenPoint.x}px, ${screenPoint.y}px)`;

      screenPoints.push(screenPoint);
    });

    const pathData = screenPoints
      .map((point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
      )
      .join(" ");

    path.setAttribute("d", pathData);
  }

  return {
    update,
    setActiveStage,
  };
}