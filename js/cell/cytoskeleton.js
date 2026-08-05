import * as THREE from "three";

/* ==========================================================
   Helper: create a curved filament
   ========================================================== */

function createFilament(
  points,
  radius,
  baseMaterial,
  tubularSegments = 40
) {
  const curve =
    new THREE.CatmullRomCurve3(
      points,
      false
    );

  const geometry =
    new THREE.TubeGeometry(
      curve,
      tubularSegments,
      radius,
      6,
      false
    );

  /*
   * Each filament needs its own material.
   * Otherwise opacity animation on one
   * filament affects every filament.
   */
  const material =
    baseMaterial.clone();

  const filament =
    new THREE.Mesh(
      geometry,
      material
    );

  filament.userData.baseOpacity =
    material.opacity;

  filament.userData.phase =
    Math.random() *
    Math.PI *
    2;

  /*
   * Transparent filaments should not
   * block organelles behind them.
   */
  filament.material.depthWrite =
    false;

  return filament;
}

/* ==========================================================
   Helper: random direction
   ========================================================== */

function randomDirection() {
  return new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ).normalize();
}

/* ==========================================================
   Helper: random point inside a sphere
   ========================================================== */

function randomPointInside(
  radius = 2.2
) {
  const distance =
    Math.cbrt(
      Math.random()
    ) * radius;

  return randomDirection()
    .multiplyScalar(distance);
}

/* ==========================================================
   Helper: random point in an outer shell

   Useful for actin filaments near the membrane.
   ========================================================== */

function randomPointInShell(
  innerRadius,
  outerRadius
) {
  const distance =
    THREE.MathUtils.lerp(
      innerRadius,
      outerRadius,
      Math.random()
    );

  return randomDirection()
    .multiplyScalar(distance);
}

/* ==========================================================
   Cytoskeleton
   ========================================================== */

export function createCytoskeleton() {
  const group =
    new THREE.Group();

  group.name =
    "cytoskeleton";

  group.userData.type =
    "cytoskeleton";

  /* --------------------------------------------------------
     Base materials
     -------------------------------------------------------- */

  const microtubuleMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x31b7c7,

      transparent: true,
      opacity: 0.16,

      roughness: 0.5,
      metalness: 0,

      emissive: 0x083e46,
      emissiveIntensity: 0.22,

      depthWrite: false,
    });

  const actinMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x4bb78b,

      transparent: true,
      opacity: 0.1,

      roughness: 0.55,
      metalness: 0,

      emissive: 0x0d3528,
      emissiveIntensity: 0.16,

      depthWrite: false,
    });

  const intermediateMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x6079c5,

      transparent: true,
      opacity: 0.09,

      roughness: 0.58,
      metalness: 0,

      emissive: 0x111c43,
      emissiveIntensity: 0.14,

      depthWrite: false,
    });

  /* --------------------------------------------------------
     Centrosome
     -------------------------------------------------------- */

  const centrosome =
    new THREE.Group();

  centrosome.name =
    "centrosome";

  /*
   * Keep it close to the nucleus,
   * but not directly in front of DNA.
   */
  centrosome.position.set(
    -0.05,
    -0.28,
    -0.18
  );

  const centrioleMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xe7bd63,

      roughness: 0.42,

      emissive: 0x4d3308,
      emissiveIntensity: 0.3,
    });

  function createCentriole(
    rotation
  ) {
    const centriole =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.065,
          0.065,
          0.28,
          12,
          1,
          true
        ),
        centrioleMaterial
      );

    centriole.rotation.copy(
      rotation
    );

    return centriole;
  }

  centrosome.add(
    createCentriole(
      new THREE.Euler(
        Math.PI / 2,
        0,
        0.3
      )
    ),

    createCentriole(
      new THREE.Euler(
        0.2,
        0.6,
        Math.PI / 2
      )
    )
  );

  group.add(centrosome);

  /* --------------------------------------------------------
     Microtubules

     Radiate from the centrosome toward
     the outer regions of the cell.
     -------------------------------------------------------- */

  const microtubules = [];

  const microtubuleCount = 12;

  for (
    let index = 0;
    index < microtubuleCount;
    index += 1
  ) {
    const start =
      centrosome.position.clone();

    const end =
      randomPointInShell(
        1.75,
        2.45
      );

    /*
     * Create a curved midpoint rather
     * than a completely random path.
     */
    const middle =
      start
        .clone()
        .lerp(end, 0.52);

    middle.add(
      randomDirection()
        .multiplyScalar(
          THREE.MathUtils.randFloat(
            0.15,
            0.42
          )
        )
    );

    const filament =
      createFilament(
        [
          start,
          middle,
          end,
        ],
        0.01,
        microtubuleMaterial,
        44
      );

    group.add(filament);

    microtubules.push(
      filament
    );
  }

  /* --------------------------------------------------------
     Actin filaments

     Actin should sit mostly near the
     inside of the plasma membrane.
     -------------------------------------------------------- */

  const actinFilaments = [];

  const actinCount = 14;

  for (
    let index = 0;
    index < actinCount;
    index += 1
  ) {
    const start =
      randomPointInShell(
        2.15,
        2.5
      );

    const end =
      randomPointInShell(
        2.15,
        2.5
      );

    const middle =
      start
        .clone()
        .lerp(end, 0.5);

    middle.add(
      randomDirection()
        .multiplyScalar(
          THREE.MathUtils.randFloat(
            0.08,
            0.25
          )
        )
    );

    const filament =
      createFilament(
        [
          start,
          middle,
          end,
        ],
        0.005,
        actinMaterial,
        30
      );

    group.add(filament);

    actinFilaments.push(
      filament
    );
  }

  /* --------------------------------------------------------
     Intermediate filaments

     Provide a subtle network through
     the middle of the cytoplasm.
     -------------------------------------------------------- */

  const intermediateFilaments =
    [];

  const intermediateCount = 8;

  for (
    let index = 0;
    index < intermediateCount;
    index += 1
  ) {
    const start =
      randomPointInside(
        1.1
      );

    const end =
      randomPointInShell(
        1.65,
        2.2
      );

    const middle =
      start
        .clone()
        .lerp(end, 0.5);

    middle.add(
      randomDirection()
        .multiplyScalar(
          THREE.MathUtils.randFloat(
            0.12,
            0.32
          )
        )
    );

    const filament =
      createFilament(
        [
          start,
          middle,
          end,
        ],
        0.007,
        intermediateMaterial,
        34
      );

    group.add(filament);

    intermediateFilaments.push(
      filament
    );
  }

  /* --------------------------------------------------------
     Animation
     -------------------------------------------------------- */

  function animate(elapsedTime) {
    /*
     * The centrosome moves very slowly.
     */
    centrosome.rotation.y =
      elapsedTime * 0.035;

    centrosome.rotation.z =
      Math.sin(
        elapsedTime * 0.18
      ) * 0.025;

    /*
     * Very subtle opacity variation.
     * This keeps the filaments alive
     * without making them distracting.
     */
    microtubules.forEach(
      (filament, index) => {
        const variation =
          Math.sin(
            elapsedTime * 0.32 +
              filament.userData.phase +
              index * 0.12
          ) * 0.018;

        filament.material.opacity =
          filament.userData
            .baseOpacity +
          variation;
      }
    );

    actinFilaments.forEach(
      (filament, index) => {
        const variation =
          Math.sin(
            elapsedTime * 0.4 +
              filament.userData.phase +
              index * 0.08
          ) * 0.012;

        filament.material.opacity =
          filament.userData
            .baseOpacity +
          variation;
      }
    );

    intermediateFilaments.forEach(
      (filament, index) => {
        const variation =
          Math.sin(
            elapsedTime * 0.28 +
              filament.userData.phase +
              index * 0.1
          ) * 0.01;

        filament.material.opacity =
          filament.userData
            .baseOpacity +
          variation;
      }
    );
  }

  return {
    group,
    centrosome,
    microtubules,
    actinFilaments,
    intermediateFilaments,
    animate,
  };
}