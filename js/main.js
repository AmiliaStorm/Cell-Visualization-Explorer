import * as THREE from "three";

import {
  createScene,
} from "./scene.js";

import {
  createControls,
} from "./controls.js";

import {
  addLighting,
} from "./lighting.js";

import {
  buildCell,
} from "./cell/cell.js";

import {
  createBilayerPatch,
} from "./cell/bilayer.js";

import {
  createPostProcessing,
} from "./postprocessing.js";

import {
  createProteinProductionSimulation,
} from "./simulation/proteinProduction.js";

import {
  createAppUI,
} from "./ui/appUI.js";

import {
  createCameraDirector,
} from "./ui/cameraDirector.js";

import {
  createOrganelleInteraction,
} from "./ui/OrganelleInteraction.js";

import {
  createPathwayMarkers,
} from "./ui/pathwayMarkers.js";

/* ==========================================================
   Canvas container
   ========================================================== */

const container =
  document.querySelector(
    "#cell-canvas"
  );

if (!container) {
  throw new Error(
    'Could not find "#cell-canvas".'
  );
}

/* ==========================================================
   Scene
   ========================================================== */

const {
  scene,
  camera,
  renderer,
} = createScene(
  container
);

/* ==========================================================
   Camera controls
   ========================================================== */

const controls =
  createControls(
    camera,
    renderer.domElement
  );

/* ==========================================================
   Lighting
   ========================================================== */

const lights =
  addLighting(
    scene
  );

/* ==========================================================
   Cell
   ========================================================== */

const cell =
  buildCell(
    scene
  );

/*
 * Do not override the cell position or scale here.
 * The final composition is controlled by cell.js,
 * layout.js, and contentGroup.
 */

/* ==========================================================
   Membrane bilayer patch (Cutaway view only)
   ========================================================== */

const bilayerPatch =
  createBilayerPatch();

bilayerPatch.group.position.set(
  1.9,
  0.55,
  1.05
);

bilayerPatch.group.rotation.set(
  0,
  -0.35,
  0
);

bilayerPatch.group.scale.setScalar(
  1.4
);

bilayerPatch.group.visible = false;

scene.add(
  bilayerPatch.group
);

/* ==========================================================
   Protein-production simulation
   ========================================================== */

const simulation =
  createProteinProductionSimulation({
    cell,
  });

/* ==========================================================
   Camera director
   ========================================================== */

const cameraDirector =
  createCameraDirector({
    camera,
    controls,
    simulation,
  });

/* ==========================================================
   Interface
   ========================================================== */

const ui =
  createAppUI({
    simulation,
  });

/* ==========================================================
   Pathway markers (overlaid on 3D scene)
   ========================================================== */

const pathwayMarkers =
  createPathwayMarkers({
    container,
    camera,
  });

/* ==========================================================
   Organelle interaction
   ========================================================== */

const organelleInteraction =
  createOrganelleInteraction({
    camera,
    renderer,
    cell,

    onSelect(organelle) {
      if (!organelle) {
        cameraDirector.clearFocus();

        console.log(
          "Selection cleared"
        );

        return;
      }

      cameraDirector.focusOn(
        organelle.object,

        organelle.id ===
          "nucleus"
          ? 3.6
          : 3.3
      );

      console.log(
        "Selected organelle:",
        organelle
      );
    },
  });

/* ==========================================================
   View mode buttons (3D / Cutaway)
   ========================================================== */

const viewMode3DButton =
  document.querySelector(
    "#view-mode-3d"
  );

const viewModeCutawayButton =
  document.querySelector(
    "#view-mode-cutaway"
  );

function setCutawayMode(isActive) {
  bilayerPatch.group.visible =
    isActive;

  /*
   * Dim the membrane slightly so the embedded
   * bilayer patch reads clearly against it.
   */
  cell.membrane.material.opacity =
    isActive ? 0.02 : 0.04;

  viewMode3DButton.classList.toggle(
    "active",
    !isActive
  );

  viewModeCutawayButton.classList.toggle(
    "active",
    isActive
  );
}

if (
  viewMode3DButton &&
  viewModeCutawayButton
) {
  viewMode3DButton.addEventListener(
    "click",
    () => setCutawayMode(false)
  );

  viewModeCutawayButton.addEventListener(
    "click",
    () => setCutawayMode(true)
  );
} else {
  console.warn(
    "Cutaway toggle buttons not found in the DOM."
  );
}

/* ==========================================================
   Post-processing
   ========================================================== */

const {
  composer,

  resize:
    resizePostProcessing,
} = createPostProcessing({
  renderer,
  scene,
  camera,
  container,
});

/* ==========================================================
   Animation clock
   ========================================================== */

const clock =
  new THREE.Clock();

/* ==========================================================
   Animation loop
   ========================================================== */

function animate() {
  const deltaTime =
    Math.min(
      clock.getDelta(),
      0.05
    );

  const elapsedTime =
    clock.elapsedTime;

  /*
   * Rotate the complete cell very gently while
   * the pathway is paused and no organelle is selected.
   */
  if (
    !simulation.isPlaying &&
    !organelleInteraction.selected
  ) {
    cell.group.rotation.y +=
      0.00008;
  }

  /*
   * Animate the organelles and internal cell structures.
   */
  cell.animate(
    elapsedTime,
    deltaTime
  );

  /*
   * Animate the bilayer patch (only visible in Cutaway).
   */
  bilayerPatch.animate(
    elapsedTime
  );

  /*
   * Update the protein-production pathway.
   *
   * Its internal animation clock only advances while
   * the simulation is playing.
   */
  simulation.update(
    deltaTime
  );

  /*
   * Update the timeline, buttons, and active-stage UI.
   */
  ui.update();

  /*
   * Update pathway marker positions and active state.
   */
  pathwayMarkers.update();
  pathwayMarkers.setActiveStage(
    simulation.stage
  );

  /*
   * Subtle animated lighting.
   *
   * These names match the updated lighting.js file.
   */
  if (
    lights.nucleusAccent
  ) {
    lights.nucleusAccent.intensity =
      0.82 +
      Math.sin(
        elapsedTime * 0.9
      ) *
        0.08;
  }

  if (
    lights.mitochondrialAccent
  ) {
    lights.mitochondrialAccent.intensity =
      0.75 +
      Math.sin(
        elapsedTime * 0.7 +
          1.4
      ) *
        0.08;
  }

  if (
    lights.golgiAccent
  ) {
    lights.golgiAccent.intensity =
      0.68 +
      Math.sin(
        elapsedTime * 0.6 +
          0.8
      ) *
        0.05;
  }

  /*
   * Update stage camera movement or organelle focus.
   *
   * cameraDirector also updates OrbitControls.
   */
  cameraDirector.update(
    deltaTime
  );

  /*
   * Render with post-processing.
   */
  composer.render(
    deltaTime
  );

  requestAnimationFrame(
    animate
  );
}

animate();

/* ==========================================================
   Keyboard shortcuts
   ========================================================== */

window.addEventListener(
  "keydown",
  (event) => {
    /*
     * Avoid triggering shortcuts while typing
     * inside an input or select element.
     */
    const target =
      event.target;

    const isFormElement =
      target instanceof
        HTMLInputElement ||
      target instanceof
        HTMLTextAreaElement ||
      target instanceof
        HTMLSelectElement;

    if (isFormElement) {
      return;
    }

    if (
      event.code ===
      "Space"
    ) {
      event.preventDefault();

      simulation.toggle();
    }

    if (
      event.key.toLowerCase() ===
      "r"
    ) {
      simulation.restart();
    }

    if (
      event.key ===
      "1"
    ) {
      simulation.setSpeed(
        1
      );
    }

    if (
      event.key ===
      "2"
    ) {
      simulation.setSpeed(
        2
      );
    }

    if (
      event.key ===
      "3"
    ) {
      simulation.setSpeed(
        0.5
      );
    }
  }
);

/* ==========================================================
   Resize handling
   ========================================================== */

function resizeScene() {
  const width =
    Math.max(
      container.clientWidth,
      1
    );

  const height =
    Math.max(
      container.clientHeight,
      1
    );

  camera.aspect =
    width / height;

  camera.updateProjectionMatrix();

  renderer.setSize(
    width,
    height,
    false
  );

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );

  resizePostProcessing(
    width,
    height
  );
}

window.addEventListener(
  "resize",
  resizeScene
);

/*
 * Ensure the renderer and composer match
 * the container after the page layout is ready.
 */
resizeScene();