import * as THREE from "three";


/* ==========================================================
   Overview camera
   ========================================================== */

export const OVERVIEW_CAMERA_POSITION =
  new THREE.Vector3(
    0.1,
    0.02,
    8.6
  );


/* ==========================================================
   Scene

   Lighting now lives entirely in lighting.js (addLighting),
   which main.js calls separately. Previously this file also
   built its own full lighting rig internally, so the scene
   was being lit by two overlapping sets of lights at once —
   that double illumination is the likely cause of the
   harsher, more saturated look compared to the reference's
   soft, diffuse lighting.
   ========================================================== */

export function createScene(
  container
) {
  const scene =
    new THREE.Scene();


  /* --------------------------------------------------------
     Background

     Nearly black, with a very slight blue tone.
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
    -0.3,
    0,
    0
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

     Keeps bright highlights from clipping while preserving
     the dark scientific aesthetic.
     -------------------------------------------------------- */

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


  renderer.toneMappingExposure =
    1.28;


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

     No `lights` here anymore — main.js gets lighting from
     addLighting(scene) in lighting.js instead.
     ======================================================== */

  return {
    scene,
    camera,
    renderer,
  };
}
