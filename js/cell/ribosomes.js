import * as THREE from "three";

/* ==========================================================
   Seeded random generator

   Keeps ribosome positions stable after refreshing.
   ========================================================== */

function createSeededRandom(
  seed = 4815
) {
  let state = seed >>> 0;

  return function random() {
    state =
      (
        state * 1664525 +
        1013904223
      ) >>> 0;

    return (
      state /
      4294967296
    );
  };
}

function randomBetween(
  random,
  minimum,
  maximum
) {
  return THREE.MathUtils.lerp(
    minimum,
    maximum,
    random()
  );
}

/* ==========================================================
   Ellipsoid helpers
   ========================================================== */

function ellipsoidDistance({
  point,
  center,
  radii,
}) {
  const x =
    (
      point.x -
      center.x
    ) / radii.x;

  const y =
    (
      point.y -
      center.y
    ) / radii.y;

  const z =
    (
      point.z -
      center.z
    ) / radii.z;

  return Math.sqrt(
    x * x +
    y * y +
    z * z
  );
}

function randomDirection(
  random
) {
  const direction =
    new THREE.Vector3();

  do {
    direction.set(
      random() * 2 - 1,
      random() * 2 - 1,
      random() * 2 - 1
    );
  } while (
    direction.lengthSq() <
      0.001 ||
    direction.lengthSq() > 1
  );

  return direction.normalize();
}

/* ==========================================================
   Position free ribosomes inside the cytoplasm

   They are kept away from the nucleus/rough ER
   and from the central Golgi apparatus.
   ========================================================== */

function createRibosomePosition({
  random,
  cellRadii,
  nucleusCenter,
  nucleusExclusionRadii,
  golgiCenter,
  golgiExclusionRadii,
}) {
  for (
    let attempt = 0;
    attempt < 200;
    attempt += 1
  ) {
    const direction =
      randomDirection(
        random
      );

    const distance =
      Math.cbrt(
        random()
      );

    const position =
      new THREE.Vector3(
        direction.x *
          cellRadii.x *
          distance,

        direction.y *
          cellRadii.y *
          distance,

        direction.z *
          cellRadii.z *
          distance
      );

    const nucleusDistance =
      ellipsoidDistance({
        point: position,
        center:
          nucleusCenter,
        radii:
          nucleusExclusionRadii,
      });

    const golgiDistance =
      ellipsoidDistance({
        point: position,
        center:
          golgiCenter,
        radii:
          golgiExclusionRadii,
      });

    if (
      nucleusDistance > 1.08 &&
      golgiDistance > 1.05
    ) {
      return position;
    }
  }

  return new THREE.Vector3(
    0.6,
    1.6,
    -0.5
  );
}

/* ==========================================================
   Create free cytoplasmic ribosomes
   ========================================================== */

export function createRibosomes({
  count = 30,
  seed = 4815,
} = {}) {
  const group =
    new THREE.Group();

  group.name =
    "freeRibosomes";

  group.userData.type =
    "ribosomes";

  const random =
    createSeededRandom(
      seed
    );

  /*
   * The membrane is larger than these values,
   * so this keeps ribosomes safely inside it.
   */
  const cellRadii =
    new THREE.Vector3(
      2.8,
      2.25,
      2.35
    );

  const nucleusCenter =
    new THREE.Vector3(
      -0.82,
      0.08,
      0
    );

  /*
   * Includes the nucleus and most of the rough ER.
   */
  const nucleusExclusionRadii =
    new THREE.Vector3(
      1.42,
      1.25,
      1.15
    );

  const golgiCenter =
    new THREE.Vector3(
      1.15,
      -0.15,
      0.05
    );

  const golgiExclusionRadii =
    new THREE.Vector3(
      0.88,
      0.76,
      0.68
    );

  /* --------------------------------------------------------
     Shared geometry and materials
     -------------------------------------------------------- */

  const largeSubunitGeometry =
    new THREE.SphereGeometry(
      0.032,
      10,
      10
    );

  const smallSubunitGeometry =
    new THREE.SphereGeometry(
      0.021,
      9,
      9
    );

  const largeSubunitMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xc9a74f,

      emissive: 0x3d2906,
      emissiveIntensity: 0.16,

      roughness: 0.58,
      metalness: 0,
    });

  const smallSubunitMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xe0c56f,

      emissive: 0x493509,
      emissiveIntensity: 0.14,

      roughness: 0.55,
      metalness: 0,
    });

  const ribosomes = [];

  /* --------------------------------------------------------
     Build ribosomes
     -------------------------------------------------------- */

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const ribosome =
      new THREE.Group();

    const largeSubunit =
      new THREE.Mesh(
        largeSubunitGeometry,
        largeSubunitMaterial
      );

    largeSubunit.scale.set(
      1.15,
      0.78,
      0.74
    );

    const smallSubunit =
      new THREE.Mesh(
        smallSubunitGeometry,
        smallSubunitMaterial
      );

    smallSubunit.position.set(
      0.022,
      0.013,
      0.016
    );

    smallSubunit.scale.set(
      1,
      0.82,
      0.78
    );

    ribosome.add(
      largeSubunit,
      smallSubunit
    );

    ribosome.position.copy(
      createRibosomePosition({
        random,
        cellRadii,

        nucleusCenter,
        nucleusExclusionRadii,

        golgiCenter,
        golgiExclusionRadii,
      })
    );

    ribosome.rotation.set(
      randomBetween(
        random,
        0,
        Math.PI * 2
      ),

      randomBetween(
        random,
        0,
        Math.PI * 2
      ),

      randomBetween(
        random,
        0,
        Math.PI * 2
      )
    );

    const scale =
      randomBetween(
        random,
        0.72,
        1.02
      );

    ribosome.scale.setScalar(
      scale
    );

    ribosome.userData.baseScale =
      scale;

    ribosome.userData.phase =
      randomBetween(
        random,
        0,
        Math.PI * 2
      );

    group.add(
      ribosome
    );

    ribosomes.push(
      ribosome
    );
  }

  group.userData.ribosomes =
    ribosomes;

  return group;
}