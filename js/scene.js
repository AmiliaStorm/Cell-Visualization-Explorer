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
   Lighting rig

   Designed for the dark scientific / bioluminescent look
   of the Cell Function Explorer concept.

   The goal is:
   - readable organelles
   - cyan membrane highlights
   - purple nucleus emphasis
   - warm mitochondrial highlights
   - dark background preserved
   ========================================================== */

function createLighting(scene) {

  /* --------------------------------------------------------
     Very soft global illumination

     Prevents shadowed sides from becoming completely black.
     -------------------------------------------------------- */

  const ambientLight =
    new THREE.AmbientLight(
      0x8eb8dc,
      0.24
    );

  scene.add(
    ambientLight
  );


  /* --------------------------------------------------------
     Cool environmental fill

     Blue light from above, very dark blue from below.
     -------------------------------------------------------- */

  const hemisphereLight =
    new THREE.HemisphereLight(
      0x87d8ff,
      0x03101c,
      0.58
    );

  hemisphereLight.position.set(
    0,
    5,
    2
  );

  scene.add(
    hemisphereLight
  );


  /* --------------------------------------------------------
     Main key light

     Front-right illumination gives the organelles their
     primary 3D form and glossy highlights.
     -------------------------------------------------------- */

  const keyLight =
    new THREE.DirectionalLight(
      0xb9ddff,
      2.15
    );

  keyLight.position.set(
    4.5,
    5,
    7
  );

  keyLight.castShadow = true;

  keyLight.shadow.mapSize.set(
    1024,
    1024
  );

  keyLight.shadow.camera.near =
    0.5;

  keyLight.shadow.camera.far =
    20;

  keyLight.shadow.bias =
    -0.0004;

  scene.add(
    keyLight
  );


  /* --------------------------------------------------------
     Cyan fill from left

     Helps the rough ER and membrane retain the blue/cyan
     appearance from the target design.
     -------------------------------------------------------- */

  const cyanFill =
    new THREE.PointLight(
      0x28bce8,
      7.0,
      10,
      2
    );

  cyanFill.position.set(
    -4,
    1.8,
    4
  );

  cyanFill.castShadow = false;

  scene.add(
    cyanFill
  );


  /* --------------------------------------------------------
     Nucleus accent

     Soft violet illumination around the nucleus.
     This is intentionally local rather than lighting the
     entire scene purple.
     -------------------------------------------------------- */

  const nucleusLight =
    new THREE.PointLight(
      0x7658ff,
      5.8,
      5.5,
      2
    );

  nucleusLight.position.set(
    -0.9,
    0.15,
    2.0
  );

  nucleusLight.castShadow = false;

  scene.add(
    nucleusLight
  );


  /* --------------------------------------------------------
     Warm organelle accent

     Adds warm reflections to mitochondria and gives some
     separation between the blue ER and right side of cell.
     -------------------------------------------------------- */

  const warmLight =
    new THREE.PointLight(
      0xff7958,
      4.2,
      6.5,
      2
    );

  warmLight.position.set(
    2.2,
    1.3,
    2.4
  );

  warmLight.castShadow = false;

  scene.add(
    warmLight
  );


  /* --------------------------------------------------------
     Magenta Golgi accent

     Helps the Golgi retain its pink / violet appearance
     instead of disappearing into the dark cytoplasm.
     -------------------------------------------------------- */

  const golgiLight =
    new THREE.PointLight(
      0xff5fc8,
      3.8,
      4.2,
      2
    );

  golgiLight.position.set(
    1.25,
    -0.2,
    2.0
  );

  golgiLight.castShadow = false;

  scene.add(
    golgiLight
  );


  /* --------------------------------------------------------
     Rear rim light

     Extremely subtle cyan illumination from behind.
     Adds separation from the background and reinforces
     the translucent cell silhouette.
     -------------------------------------------------------- */

  const rearLight =
    new THREE.DirectionalLight(
      0x127da9,
      0.75
    );

  rearLight.position.set(
    -2,
    2,
    -6
  );

  scene.add(
    rearLight
  );


  return {
    ambientLight,
    hemisphereLight,
    keyLight,
    cyanFill,
    nucleusLight,
    warmLight,
    golgiLight,
    rearLight,
  };
}


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
     Lighting
     ======================================================== */

  const lights =
    createLighting(
      scene
    );


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
    lights,
  };
}