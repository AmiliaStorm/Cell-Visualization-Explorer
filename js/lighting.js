import * as THREE from "three";


/* ==========================================================
   Cinematic biological lighting

   Designed for:
   - wet translucent membrane
   - readable organelles
   - strong depth
   - cool cyan edge lighting
   - restrained local organelle accents
   ========================================================== */

export function addLighting(scene) {

  /* ========================================================
     Ambient foundation
     ======================================================== */

  const ambientLight =
    new THREE.AmbientLight(
      0x91b5d8,
      0.17
    );


  /* ========================================================
     Hemisphere environment fill
     ======================================================== */

  const hemisphereLight =
    new THREE.HemisphereLight(
      0x8ed7ff,
      0x07111c,
      0.48
    );


  /* ========================================================
     Main soft key

     Upper-left/front illumination.
     Primary source for wet membrane reflections.
     ======================================================== */

  const keyLight =
    new THREE.DirectionalLight(
      0xd9f1ff,
      1.34
    );


  keyLight.position.set(
    -4.8,
    4.8,
    5.5
  );


  keyLight.target.position.set(
    -0.25,
    0,
    0
  );


  keyLight.castShadow =
    true;


  keyLight.shadow.mapSize.set(
    2048,
    2048
  );


  keyLight.shadow.camera.near =
    0.5;


  keyLight.shadow.camera.far =
    18;


  keyLight.shadow.camera.left =
    -5;


  keyLight.shadow.camera.right =
    5;


  keyLight.shadow.camera.top =
    5;


  keyLight.shadow.camera.bottom =
    -5;


  keyLight.shadow.bias =
    -0.00025;


  keyLight.shadow.normalBias =
    0.025;


  /* ========================================================
     Wet highlight light

     Gives the upper/front membrane a concentrated pearly
     reflection like the reference render.
     ======================================================== */

  const wetHighlight =
    new THREE.SpotLight(
      0xc8f3ff,
      1.65,
      11,
      Math.PI * 0.22,
      0.82,
      2
    );


  wetHighlight.position.set(
    -1.8,
    4.2,
    5.5
  );


  wetHighlight.target.position.set(
    0.1,
    0.35,
    0
  );


  /* ========================================================
     Secondary wet glint

     Creates asymmetric reflections so the membrane does not
     look perfectly computer-generated.
     ======================================================== */

  const sideGlint =
    new THREE.PointLight(
      0x59d7ff,
      0.62,
      7,
      2
    );


  sideGlint.position.set(
    3.8,
    1.6,
    3.4
  );


  /* ========================================================
     Soft frontal fill
     ======================================================== */

  const frontFill =
    new THREE.PointLight(
      0x86bfff,
      0.40,
      9,
      2
    );


  frontFill.position.set(
    0,
    0.3,
    4.2
  );


  /* ========================================================
     Strong cool back rim
     ======================================================== */

  const backRimLight =
    new THREE.DirectionalLight(
      0x3da8ff,
      0.98
    );


  backRimLight.position.set(
    2.4,
    3,
    -5
  );


  backRimLight.target.position.set(
    0,
    0,
    0
  );


  /* ========================================================
     Upper cyan edge kicker

     Adds additional separation along the upper membrane.
     ======================================================== */

  const upperEdgeLight =
    new THREE.DirectionalLight(
      0x70ddff,
      0.42
    );


  upperEdgeLight.position.set(
    -1,
    5,
    -1.5
  );


  upperEdgeLight.target.position.set(
    0,
    0,
    0
  );


  /* ========================================================
     Nucleus accent
     ======================================================== */

  const nucleusAccent =
    new THREE.PointLight(
      0x9868ff,
      0.70,
      3.8,
      2
    );


  nucleusAccent.position.set(
    -1.35,
    0.55,
    1.15
  );


  /* ========================================================
     Golgi accent
     ======================================================== */

  const golgiAccent =
    new THREE.PointLight(
      0xff78c9,
      0.56,
      3.4,
      2
    );


  golgiAccent.position.set(
    1.45,
    -0.25,
    1.1
  );


  /* ========================================================
     Mitochondrial accent
     ======================================================== */

  const mitochondrialAccent =
    new THREE.PointLight(
      0xff8a61,
      0.66,
      4.2,
      2
    );


  mitochondrialAccent.position.set(
    1.8,
    0.15,
    0.7
  );


  /* ========================================================
     Lower blue bounce
     ======================================================== */

  const lowerBounce =
    new THREE.PointLight(
      0x425fb0,
      0.18,
      5,
      2
    );


  lowerBounce.position.set(
    -0.5,
    -3,
    1.3
  );


  /* ========================================================
     Add everything
     ======================================================== */

  scene.add(
    ambientLight,

    hemisphereLight,

    keyLight,
    keyLight.target,

    wetHighlight,
    wetHighlight.target,

    sideGlint,

    frontFill,

    backRimLight,
    backRimLight.target,

    upperEdgeLight,
    upperEdgeLight.target,

    nucleusAccent,

    golgiAccent,

    mitochondrialAccent,

    lowerBounce
  );


  /* ========================================================
     Public lighting API
     ======================================================== */

  return {
    ambientLight,

    hemisphereLight,

    keyLight,

    wetHighlight,

    sideGlint,

    frontFill,

    backRimLight,

    upperEdgeLight,

    nucleusAccent,

    golgiAccent,

    mitochondrialAccent,

    lowerBounce,
  };
}