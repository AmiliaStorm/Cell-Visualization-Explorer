import * as THREE from "three";

/* ==========================================================
   Camera shots for each simulation stage

   These shots focus on the active process while keeping
   enough of the complete cell visible for context.
   ========================================================== */

const CAMERA_SHOTS = {
  dna: {
    position: new THREE.Vector3(
      -0.9,
      0.3,
      8.8
    ),

    target: new THREE.Vector3(
      -0.58,
      0.06,
      0.08
    ),
  },

  mrna: {
    position: new THREE.Vector3(
      -0.48,
      -0.02,
      8.45
    ),

    target: new THREE.Vector3(
      -0.18,
      -0.2,
      0.34
    ),
  },

  translation: {
    position: new THREE.Vector3(
      0,
      -0.3,
      8.25
    ),

    target: new THREE.Vector3(
      0.14,
      -0.62,
      0.4
    ),
  },

  transport: {
    position: new THREE.Vector3(
      0.55,
      -0.28,
      8.35
    ),

    target: new THREE.Vector3(
      0.58,
      -0.5,
      0.38
    ),
  },

  golgi: {
    position: new THREE.Vector3(
      1.05,
      -0.08,
      8.45
    ),

    target: new THREE.Vector3(
      0.9,
      -0.16,
      0.28
    ),
  },

  secretion: {
    position: new THREE.Vector3(
      1.4,
      0.32,
      8.75
    ),

    target: new THREE.Vector3(
      1.75,
      0.48,
      0.34
    ),
  },
};

/* ==========================================================
   Camera director
   ========================================================== */

export function createCameraDirector({
  camera,
  controls,
  simulation,
}) {
  const desiredPosition =
    camera.position.clone();

  const desiredTarget =
    controls.target.clone();

  const organelleWorldPosition =
    new THREE.Vector3();

  const organelleDirection =
    new THREE.Vector3();

  const organelleOffset =
    new THREE.Vector3();

  let currentStage = null;
  let focusedOrganelle = null;
  let mode = "simulation";

  /* --------------------------------------------------------
     Move toward one simulation-stage shot
     -------------------------------------------------------- */

  function setStage(stageId) {
    const shot =
      CAMERA_SHOTS[stageId];

    if (!shot) {
      return;
    }

    currentStage = stageId;
    focusedOrganelle = null;
    mode = "simulation";

    desiredPosition.copy(
      shot.position
    );

    desiredTarget.copy(
      shot.target
    );
  }

  /* --------------------------------------------------------
     Focus on a manually selected organelle
     -------------------------------------------------------- */

  function focusOn(
    organelle,
    distance = 3.4
  ) {
    if (!organelle) {
      return;
    }

    focusedOrganelle =
      organelle;

    mode = "organelle";

    organelle.updateWorldMatrix(
      true,
      false
    );

    organelle.getWorldPosition(
      organelleWorldPosition
    );

    desiredTarget.copy(
      organelleWorldPosition
    );

    /*
     * Preserve the current viewing angle,
     * but do not zoom excessively close.
     */
    organelleDirection
      .copy(camera.position)
      .sub(controls.target);

    if (
      organelleDirection.lengthSq() <
      0.0001
    ) {
      organelleDirection.set(
        0,
        0,
        1
      );
    }

    const safeDistance =
      Math.max(
        distance,
        3.2
      );

    organelleDirection
      .normalize()
      .multiplyScalar(
        safeDistance
      );

    desiredPosition
      .copy(
        organelleWorldPosition
      )
      .add(
        organelleDirection
      );
  }

  /* --------------------------------------------------------
     Return from organelle focus to simulation camera
     -------------------------------------------------------- */

  function clearFocus() {
    focusedOrganelle = null;
    mode = "simulation";

    if (simulation?.stage) {
      setStage(
        simulation.stage
      );
    }
  }

  /* --------------------------------------------------------
     Follow a moving focused organelle
     -------------------------------------------------------- */

  function updateOrganelleFocus() {
    if (!focusedOrganelle) {
      return;
    }

    focusedOrganelle.updateWorldMatrix(
      true,
      false
    );

    focusedOrganelle.getWorldPosition(
      organelleWorldPosition
    );

    /*
     * Preserve the camera-to-target offset
     * while the organelle moves.
     */
    organelleOffset
      .copy(
        desiredPosition
      )
      .sub(
        desiredTarget
      );

    desiredTarget.copy(
      organelleWorldPosition
    );

    desiredPosition
      .copy(
        organelleWorldPosition
      )
      .add(
        organelleOffset
      );
  }

  /* --------------------------------------------------------
     Per-frame update
     -------------------------------------------------------- */

  function update(
    deltaTime
  ) {
    const safeDeltaTime =
      Math.min(
        Math.max(
          deltaTime,
          0
        ),
        0.05
      );

    if (
      mode === "organelle"
    ) {
      updateOrganelleFocus();
    } else if (
      simulation?.stage &&
      simulation.stage !==
        currentStage
    ) {
      setStage(
        simulation.stage
      );
    }

    /*
     * Frame-rate-independent smoothing.
     *
     * A lower value creates slower cinematic movement;
     * a higher value reaches the destination faster.
     */
    const smoothing =
      1 -
      Math.exp(
        -4.2 *
          safeDeltaTime
      );

    camera.position.lerp(
      desiredPosition,
      smoothing
    );

    controls.target.lerp(
      desiredTarget,
      smoothing
    );

    controls.update();
  }

  /* --------------------------------------------------------
     Public stage-selection method
     -------------------------------------------------------- */

  function focusStage(
    stageId
  ) {
    setStage(
      stageId
    );
  }

  return {
    update,
    focusStage,
    focusOn,
    clearFocus,

    get mode() {
      return mode;
    },

    get focusedOrganelle() {
      return focusedOrganelle;
    },

    get currentStage() {
      return currentStage;
    },
  };
}