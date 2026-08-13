import * as THREE from "three";

/* ==========================================================
   Cinematic cell lighting

   Uses restrained ambient illumination, a clear key light,
   cool edge lighting, and localized organelle accents.
   ========================================================== */

export function addLighting(scene) {
  /* --------------------------------------------------------
     Low-level ambient illumination

     Bright enough to preserve detail in shadows,
     but low enough to maintain depth.
     -------------------------------------------------------- */

  const ambientLight =
    new THREE.AmbientLight(
      0x9cbde0,
      0.24
    );

  /* --------------------------------------------------------
     Hemisphere fill

     Gives the top of the cell a cool blue tone while
     allowing the underside to remain deeper and darker.
     -------------------------------------------------------- */

  const hemisphereLight =
    new THREE.HemisphereLight(
      0x8ecfff,
      0x0d1a28,
      0.62
    );

  /* --------------------------------------------------------
     Main key light

     Illuminates the nucleus, ER, and Golgi from the
     upper-left/front direction.
     -------------------------------------------------------- */

  const keyLight =
    new THREE.DirectionalLight(
      0xc9e5ff,
      1.45
    );

  keyLight.position.set(
    -4.5,
    4.2,
    5
  );

  keyLight.target.position.set(
    -0.3,
    0,
    0
  );

  keyLight.castShadow = true;

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

  /*
   * Prevent faint shadow artifacts on rounded,
   * layered organelle surfaces.
   */
  keyLight.shadow.bias =
    -0.00025;

  keyLight.shadow.normalBias =
    0.025;

  /* --------------------------------------------------------
     Soft frontal fill

     Prevents the DNA, ribosomes, and vesicles from
     becoming unreadably dark without flattening them.
     -------------------------------------------------------- */

  const frontFill =
    new THREE.PointLight(
      0x86bfff,
      0.55,
      9,
      2
    );

  frontFill.position.set(
    0,
    0.4,
    4
  );

  /* --------------------------------------------------------
     Cool back rim

     Creates separation between the cell membrane and
     the dark background.
     -------------------------------------------------------- */

  const backRimLight =
    new THREE.DirectionalLight(
      0x2d8fff,
      0.82
    );

  backRimLight.position.set(
    2,
    2.5,
    -5
  );

  backRimLight.target.position.set(
    0,
    0,
    0
  );

  /* --------------------------------------------------------
     Nucleus accent

     Adds restrained purple illumination around the
     nucleus without washing the whole scene purple.
     -------------------------------------------------------- */

  const nucleusAccent =
    new THREE.PointLight(
      0x9868ff,
      0.82,
      3.8,
      2
    );

  nucleusAccent.position.set(
    -1.35,
    0.55,
    1.15
  );

  /* --------------------------------------------------------
     Golgi accent

     Gives the Golgi a soft pink highlight that makes
     its curved cisternae easier to distinguish.
     -------------------------------------------------------- */

  const golgiAccent =
    new THREE.PointLight(
      0xff6fc8,
      0.68,
      3.5,
      2
    );

  golgiAccent.position.set(
    1.45,
    -0.25,
    1.1
  );

  /* --------------------------------------------------------
     Warm mitochondrial accent

     Produces warm highlights on the mitochondria and
     balances the otherwise cool-blue lighting.
     -------------------------------------------------------- */

  const mitochondrialAccent =
    new THREE.PointLight(
      0xff8a61,
      0.75,
      4.2,
      2
    );

  mitochondrialAccent.position.set(
    1.8,
    0.15,
    0.7
  );

  /* --------------------------------------------------------
     Lower bounce

     Very faint light preventing the bottom portion of
     the cell from disappearing into darkness.
     -------------------------------------------------------- */

  const lowerBounce =
    new THREE.PointLight(
      0x4c63bf,
      0.24,
      5,
      2
    );

  lowerBounce.position.set(
    -0.5,
    -3,
    1.3
  );

  scene.add(
    ambientLight,
    hemisphereLight,

    keyLight,
    keyLight.target,

    frontFill,

    backRimLight,
    backRimLight.target,

    nucleusAccent,
    golgiAccent,
    mitochondrialAccent,
    lowerBounce
  );

  return {
    ambientLight,
    hemisphereLight,

    keyLight,
    frontFill,
    backRimLight,

    nucleusAccent,
    golgiAccent,
    mitochondrialAccent,
    lowerBounce,
  };
}
