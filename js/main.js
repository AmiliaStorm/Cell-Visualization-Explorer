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
  environmentMap,
} =
  createScene(
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

   Pass the reflection map specifically into the cell so only
   membrane.js decides how strongly to use it.
   ========================================================== */

const cell =
  buildCell(
    scene,
    environmentMap
  );


/* ==========================================================
   Membrane bilayer patch
   ========================================================== */

const bilayerPatch =
  createBilayerPatch();


bilayerPatch.group.position.set(
  0.95,
  1.25,
  0.65
);


bilayerPatch.group.rotation.set(
  0.55,
  0.3,
  0.02
);


bilayerPatch.group.scale.setScalar(
  1.0
);


bilayerPatch.group.visible =
  false;


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
   Pathway markers
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


    onSelect(
      organelle
    ) {
      if (!organelle) {
        cameraDirector
          .clearFocus();


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
   View mode buttons
   ========================================================== */

const viewMode3DButton =
  document.querySelector(
    "#view-mode-3d"
  );


const viewModeCutawayButton =
  document.querySelector(
    "#view-mode-cutaway"
  );


function setCutawayMode(
  isActive
) {
  bilayerPatch.group.visible =
    isActive;


  /*
   * We now control the physical transparency using
   * transmission rather than opacity.
   */

  cell.membrane.material
    .transmission =
    isActive
      ? 0.90
      : cell.membrane
          .userData
          .baseTransmission;


  /*
   * Reduce reflection slightly in cutaway mode so the
   * membrane does not overpower the bilayer visualization.
   */

  cell.membrane.material
    .envMapIntensity =
    isActive
      ? 0.55
      : cell.membrane
          .userData
          .baseEnvMapIntensity;


  viewMode3DButton
    .classList
    .toggle(
      "active",
      !isActive
    );


  viewModeCutawayButton
    .classList
    .toggle(
      "active",
      isActive
    );
}


if (
  viewMode3DButton &&
  viewModeCutawayButton
) {
  viewMode3DButton
    .addEventListener(
      "click",

      () =>
        setCutawayMode(
          false
        )
    );


  viewModeCutawayButton
    .addEventListener(
      "click",

      () =>
        setCutawayMode(
          true
        )
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
} =
  createPostProcessing({
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


  /* --------------------------------------------------------
     Gentle full-cell rotation while idle
     -------------------------------------------------------- */

  if (
    !simulation.isPlaying &&
    !organelleInteraction.selected
  ) {
    cell.group.rotation.y +=
      0.00008;
  }


  /* --------------------------------------------------------
     Cell animation
     -------------------------------------------------------- */

  cell.animate(
    elapsedTime,
    deltaTime
  );


  /* --------------------------------------------------------
     Bilayer animation
     -------------------------------------------------------- */

  bilayerPatch.animate(
    elapsedTime
  );


  /* --------------------------------------------------------
     Protein pathway
     -------------------------------------------------------- */

  simulation.update(
    deltaTime
  );


  /* --------------------------------------------------------
     UI
     -------------------------------------------------------- */

  ui.update();


  /* --------------------------------------------------------
     Pathway markers
     -------------------------------------------------------- */

  pathwayMarkers.update();


  pathwayMarkers.setActiveStage(
    simulation.stage
  );


  /* ========================================================
     Subtle animated lighting

     Slightly restrained so the organelles stay saturated
     rather than becoming washed out.
     ======================================================== */

  if (
    lights.nucleusAccent
  ) {
    lights.nucleusAccent
      .intensity =
      0.70 +
      Math.sin(
        elapsedTime *
        0.9
      ) *
      0.06;
  }


  if (
    lights.mitochondrialAccent
  ) {
    lights
      .mitochondrialAccent
      .intensity =
      0.66 +
      Math.sin(
        elapsedTime *
          0.7 +
          1.4
      ) *
      0.06;
  }


  if (
    lights.golgiAccent
  ) {
    lights.golgiAccent
      .intensity =
      0.56 +
      Math.sin(
        elapsedTime *
          0.6 +
          0.8
      ) *
      0.04;
  }


  /* --------------------------------------------------------
     Camera movement / organelle focus
     -------------------------------------------------------- */

  cameraDirector.update(
    deltaTime
  );


  /* --------------------------------------------------------
     Render
     -------------------------------------------------------- */

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

  (
    event
  ) => {
    const target =
      event.target;


    const isFormElement =
      target instanceof
        HTMLInputElement ||

      target instanceof
        HTMLTextAreaElement ||

      target instanceof
        HTMLSelectElement;


    if (
      isFormElement
    ) {
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
      event.key
        .toLowerCase() ===
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
   Resize
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
    width /
    height;


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


resizeScene();