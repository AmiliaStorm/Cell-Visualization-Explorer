import * as THREE from "three";

import {
  RoomEnvironment,
} from "three/addons/environments/RoomEnvironment.js";


/* ==========================================================
   Overview camera
   ========================================================== */

export const OVERVIEW_CAMERA_POSITION =
  new THREE.Vector3(
    0.1,
    0.02,
    8.6
  );


export const OVERVIEW_CAMERA_TARGET =
  new THREE.Vector3(
    -0.3,
    0,
    0
  );


/* ==========================================================
   Scene
   ========================================================== */

export function createScene(
  container
) {
  const scene =
    new THREE.Scene();


  /* --------------------------------------------------------
     Background
     -------------------------------------------------------- */

  scene.background =
    new THREE.Color(
      0x01070e
    );


  const width =
    container.clientWidth;


  const height =
    container.clientHeight;


  /* ========================================================
     Camera
     ======================================================== */

  const camera =
    new THREE.PerspectiveCamera(
      40,
      width / height,
      0.1,
      100
    );


  camera.position.copy(
    OVERVIEW_CAMERA_POSITION
  );


  camera.lookAt(
    OVERVIEW_CAMERA_TARGET
  );


  /* ========================================================
     Renderer
     ======================================================== */

  const renderer =
    new THREE.WebGLRenderer({
      antialias: true,

      alpha: false,

      powerPreference:
        "high-performance",
    });


  renderer.setSize(
    width,
    height
  );


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  /* --------------------------------------------------------
     Filmic tone mapping
     -------------------------------------------------------- */

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


  renderer.toneMappingExposure =
    1.28;


  /* ========================================================
     Reflection environment

     IMPORTANT:
     We create the environment map here, but DO NOT assign it
     to scene.environment.

     This allows us to give the wet reflection specifically
     to the plasma membrane without washing out every other
     organelle.
     ======================================================== */

  const environment =
    new RoomEnvironment();


  const pmremGenerator =
    new THREE.PMREMGenerator(
      renderer
    );


  const environmentMap =
    pmremGenerator
      .fromScene(
        environment,
        0.06
      )
      .texture;


  environment.dispose();


  pmremGenerator.dispose();


  /* ========================================================
     Shadows
     ======================================================== */

  renderer.shadowMap.enabled =
    true;


  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  renderer.transmissionResolutionScale =
    0.75;


  /* ========================================================
     Attach renderer
     ======================================================== */

  container.appendChild(
    renderer.domElement
  );


  /* ========================================================
     Return
     ======================================================== */

  return {
    scene,
    camera,
    renderer,
    environmentMap,
  };
}


/* ==========================================================
   Camera focus controller
   ========================================================== */

export function createCameraFocusController(
  camera
) {
  const currentTarget =
    OVERVIEW_CAMERA_TARGET.clone();


  let transition =
    null;


  let focusedObject =
    null;


  let isFocused =
    false;


  /* ========================================================
     Easing
     ======================================================== */

  function easeInOutCubic(
    value
  ) {
    if (
      value < 0.5
    ) {
      return (
        4 *
        value *
        value *
        value
      );
    }


    return (
      1 -
      Math.pow(
        -2 * value + 2,
        3
      ) /
        2
    );
  }


  /* ========================================================
     Start transition
     ======================================================== */

  function startTransition({
    position,
    target,
    duration = 900,
    onComplete = null,
  }) {
    transition = {
      startTime:
        performance.now(),

      duration,

      startPosition:
        camera.position.clone(),

      endPosition:
        position.clone(),

      startTarget:
        currentTarget.clone(),

      endTarget:
        target.clone(),

      onComplete,
    };
  }


  /* ========================================================
     Calculate organelle focus view
     ======================================================== */

  function calculateFocusView(
    object
  ) {
    if (!object) {
      return null;
    }


    const boundingBox =
      new THREE.Box3()
        .setFromObject(
          object
        );


    if (
      boundingBox.isEmpty()
    ) {
      return null;
    }


    const boundingSphere =
      new THREE.Sphere();


    boundingBox.getBoundingSphere(
      boundingSphere
    );


    const center =
      boundingSphere.center.clone();


    const radius =
      Math.max(
        boundingSphere.radius,
        0.15
      );


    const verticalFov =
      THREE.MathUtils.degToRad(
        camera.fov
      );


    let distance =
      radius /
      Math.tan(
        verticalFov * 0.5
      );


    distance *=
      1.55;


    distance =
      Math.max(
        distance,
        1.15
      );


    const viewDirection =
      camera.position
        .clone()
        .sub(
          currentTarget
        )
        .normalize();


    const position =
      center
        .clone()
        .add(
          viewDirection
            .multiplyScalar(
              distance
            )
        );


    position.x +=
      radius * 0.12;


    return {
      position,

      target:
        center,
    };
  }


  /* ========================================================
     Focus
     ======================================================== */

  function focusOnObject(
    object
  ) {
    if (!object) {
      return;
    }


    const view =
      calculateFocusView(
        object
      );


    if (!view) {
      return;
    }


    focusedObject =
      object;


    isFocused =
      false;


    startTransition({
      position:
        view.position,

      target:
        view.target,

      duration:
        950,

      onComplete: () => {
        isFocused =
          true;
      },
    });
  }


  /* ========================================================
     Return to overview
     ======================================================== */

  function returnToOverview() {
    isFocused =
      false;


    startTransition({
      position:
        OVERVIEW_CAMERA_POSITION,

      target:
        OVERVIEW_CAMERA_TARGET,

      duration:
        1000,

      onComplete: () => {
        focusedObject =
          null;

        isFocused =
          false;
      },
    });
  }


  /* ========================================================
     Update
     ======================================================== */

  function update() {
    if (!transition) {
      camera.lookAt(
        currentTarget
      );

      return;
    }


    const now =
      performance.now();


    const rawProgress =
      (
        now -
        transition.startTime
      ) /
      transition.duration;


    const progress =
      THREE.MathUtils.clamp(
        rawProgress,
        0,
        1
      );


    const eased =
      easeInOutCubic(
        progress
      );


    camera.position.lerpVectors(
      transition.startPosition,
      transition.endPosition,
      eased
    );


    currentTarget.lerpVectors(
      transition.startTarget,
      transition.endTarget,
      eased
    );


    camera.lookAt(
      currentTarget
    );


    if (
      progress >= 1
    ) {
      const callback =
        transition.onComplete;


      transition =
        null;


      if (callback) {
        callback();
      }
    }
  }


  /* ========================================================
     Public API
     ======================================================== */

  return {
    focusOnObject,

    returnToOverview,

    update,


    getFocusedObject() {
      return focusedObject;
    },


    getCurrentTarget() {
      return currentTarget;
    },


    getIsFocused() {
      return isFocused;
    },


    getIsTransitioning() {
      return (
        transition !== null
      );
    },
  };
}