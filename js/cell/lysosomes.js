import * as THREE from "three";

/* ==========================================================
   Deterministic pseudo-random helpers

   Keeps lysosome appearance consistent after refresh.
   ========================================================== */

function pseudoRandom(seed) {
  const value =
    Math.sin(seed * 12.9898) *
    43758.5453;

  return value -
    Math.floor(value);
}

function randomBetween(
  seed,
  minimum,
  maximum
) {
  return THREE.MathUtils.lerp(
    minimum,
    maximum,
    pseudoRandom(seed)
  );
}

/* ==========================================================
   Slightly deform spherical geometry

   Lysosomes should look biological rather than perfectly
   manufactured, but remain mostly round vesicles.
   ========================================================== */

function deformGeometry(
  geometry,
  seed,
  strength = 0.018
) {
  const position =
    geometry.attributes.position;

  const vertex =
    new THREE.Vector3();

  const direction =
    new THREE.Vector3();

  for (
    let index = 0;
    index < position.count;
    index += 1
  ) {
    vertex.fromBufferAttribute(
      position,
      index
    );

    direction
      .copy(vertex)
      .normalize();

    const waveOne =
      Math.sin(
        direction.x * 4.1 +
        direction.y * 3.2 +
        seed
      ) * strength;

    const waveTwo =
      Math.cos(
        direction.z * 5.3 -
        direction.x * 2.4 +
        seed * 0.7
      ) *
      strength *
      0.55;

    vertex.addScaledVector(
      direction,
      waveOne + waveTwo
    );

    position.setXYZ(
      index,
      vertex.x,
      vertex.y,
      vertex.z
    );
  }

  position.needsUpdate = true;

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

/* ==========================================================
   Create one lysosome
   ========================================================== */

function createLysosome(
  seed = 1
) {
  const group =
    new THREE.Group();

  group.name =
    "lysosome";

  group.userData.type =
    "lysosome";

  group.userData.organelleId =
    "lysosome";

  group.userData.info = {
    title:
      "Lysosome",

    subtitle:
      "Cellular recycling compartment",

    summary:
      "An acidic membrane-bound organelle containing enzymes that break down macromolecules and damaged cellular material.",

    functions: [
      "Macromolecule breakdown",
      "Organelle recycling",
      "Waste processing",
      "Autophagy",
    ],
  };

  /* ========================================================
     Materials
     ======================================================== */

  const membraneMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xb54b9d,

      transparent: true,
      opacity: 0.42,

      roughness: 0.24,
      metalness: 0,

      transmission: 0,
      thickness: 0.1,

      clearcoat: 0.7,
      clearcoatRoughness: 0.2,

      emissive: 0x4d123f,
      emissiveIntensity: 0.3,

      side: THREE.DoubleSide,

      depthWrite: false,
      depthTest: true,
    });

  const lumenMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x5d174f,

      transparent: true,
      opacity: 0.34,

      roughness: 0.52,

      emissive: 0x300926,
      emissiveIntensity: 0.28,

      depthWrite: false,
    });

  const enzymeMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xf096d8,

      emissive: 0xb42d8f,
      emissiveIntensity: 0.75,

      roughness: 0.32,
      metalness: 0,
    });

  const cargoMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffc45c,

      emissive: 0xb85d0d,
      emissiveIntensity: 0.5,

      roughness: 0.38,
      metalness: 0,
    });

  /* ========================================================
     Outer membrane
     ======================================================== */

  const radius =
    randomBetween(
      seed + 1,
      0.14,
      0.19
    );

  const membraneGeometry =
    deformGeometry(
      new THREE.SphereGeometry(
        radius,
        40,
        40
      ),
      seed,
      radius * 0.08
    );

  const membrane =
    new THREE.Mesh(
      membraneGeometry,
      membraneMaterial
    );

  membrane.castShadow = true;
  membrane.renderOrder = 5;

  membrane.scale.set(
    randomBetween(
      seed + 2,
      0.92,
      1.08
    ),

    randomBetween(
      seed + 3,
      0.9,
      1.06
    ),

    randomBetween(
      seed + 4,
      0.92,
      1.08
    )
  );

  /* ========================================================
     Acidic lumen
     ======================================================== */

  const lumen =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        radius * 0.82,
        32,
        32
      ),
      lumenMaterial
    );

  lumen.scale.copy(
    membrane.scale
  );

  /* ========================================================
     Hydrolytic enzyme particles
     ======================================================== */

  const enzymeGroup =
    new THREE.Group();

  const enzymes = [];

  const enzymeCount =
    Math.floor(
      randomBetween(
        seed + 5,
        8,
        14
      )
    );

  for (
    let index = 0;
    index < enzymeCount;
    index += 1
  ) {
    const particle =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          randomBetween(
            seed * 40 +
              index,
            0.012,
            0.022
          ),
          9,
          9
        ),
        enzymeMaterial
      );

    const direction =
      new THREE.Vector3(
        randomBetween(
          seed * 50 +
            index * 3 +
            1,
          -1,
          1
        ),

        randomBetween(
          seed * 50 +
            index * 3 +
            2,
          -1,
          1
        ),

        randomBetween(
          seed * 50 +
            index * 3 +
            3,
          -1,
          1
        )
      );

    if (
      direction.lengthSq() <
      0.001
    ) {
      direction.set(
        1,
        0,
        0
      );
    }

    direction.normalize();

    const distance =
      randomBetween(
        seed * 70 +
          index,
        0.025,
        radius * 0.58
      );

    particle.position.copy(
      direction.multiplyScalar(
        distance
      )
    );

    particle.userData.basePosition =
      particle.position.clone();

    particle.userData.phase =
      randomBetween(
        seed * 90 +
          index,
        0,
        Math.PI * 2
      );

    particle.userData.speed =
      randomBetween(
        seed * 110 +
          index,
        0.32,
        0.72
      );

    enzymeGroup.add(
      particle
    );

    enzymes.push(
      particle
    );
  }

  /* ========================================================
     Small degradative cargo fragments
     ======================================================== */

  const cargoGroup =
    new THREE.Group();

  const cargoFragments = [];

  const cargoCount =
    seed % 2 === 0
      ? 3
      : 2;

  for (
    let index = 0;
    index < cargoCount;
    index += 1
  ) {
    const cargo =
      new THREE.Mesh(
        new THREE.IcosahedronGeometry(
          randomBetween(
            seed * 130 +
              index,
            0.018,
            0.032
          ),
          0
        ),
        cargoMaterial
      );

    cargo.position.set(
      randomBetween(
        seed * 150 +
          index * 3 +
          1,
        -radius * 0.38,
        radius * 0.38
      ),

      randomBetween(
        seed * 150 +
          index * 3 +
          2,
        -radius * 0.38,
        radius * 0.38
      ),

      randomBetween(
        seed * 150 +
          index * 3 +
          3,
        -radius * 0.38,
        radius * 0.38
      )
    );

    cargo.userData.basePosition =
      cargo.position.clone();

    cargo.userData.phase =
      randomBetween(
        seed * 170 +
          index,
        0,
        Math.PI * 2
      );

    cargoGroup.add(
      cargo
    );

    cargoFragments.push(
      cargo
    );
  }

  /* ========================================================
     Assemble lysosome
     ======================================================== */

  group.add(
    lumen,
    enzymeGroup,
    cargoGroup,
    membrane
  );

  group.userData.membrane =
    membrane;

  group.userData.lumen =
    lumen;

  group.userData.enzymes =
    enzymes;

  group.userData.cargoFragments =
    cargoFragments;

  group.userData.phase =
    randomBetween(
      seed * 200,
      0,
      Math.PI * 2
    );

  group.userData.baseRotation =
    group.rotation.clone();

  return group;
}

/* ==========================================================
   Create all lysosomes
   ========================================================== */

export function createLysosomes() {
  const lysosomes = [
    createLysosome(1.2),
    createLysosome(2.6),
    createLysosome(4.1),
    createLysosome(5.8),
    createLysosome(7.4),
  ];

  lysosomes.animate =
    function animate(
      elapsedTime
    ) {
      lysosomes.forEach(
        (
          lysosome,
          index
        ) => {
          const phase =
            lysosome.userData
              .phase;

          /*
           * Preserve the scale assigned in layout.js.
           */
          const layoutScale =
            lysosome.userData
              .layoutScale ??
            lysosome.scale.x;

          const pulse =
            1 +
            Math.sin(
              elapsedTime *
                0.5 +
                phase
            ) *
              0.018;

          lysosome.scale.setScalar(
            layoutScale *
              pulse
          );

          /*
           * Subtle whole-organelle rotation.
           */
          lysosome.rotation.y +=
            0.00012 *
            (
              index % 2 === 0
                ? 1
                : -1
            );

          lysosome.userData.enzymes.forEach(
            (enzyme) => {
              const base =
                enzyme.userData
                  .basePosition;

              const enzymePhase =
                enzyme.userData
                  .phase;

              const speed =
                enzyme.userData
                  .speed;

              enzyme.position.set(
                base.x +
                  Math.sin(
                    elapsedTime *
                      speed +
                      enzymePhase
                  ) *
                    0.008,

                base.y +
                  Math.cos(
                    elapsedTime *
                      speed +
                      enzymePhase
                  ) *
                    0.008,

                base.z +
                  Math.sin(
                    elapsedTime *
                      0.55 +
                      enzymePhase
                  ) *
                    0.007
              );

              enzyme.scale.setScalar(
                0.86 +
                  Math.sin(
                    elapsedTime *
                      1.1 +
                      enzymePhase
                  ) *
                    0.1
              );
            }
          );

          lysosome.userData.cargoFragments.forEach(
            (cargo) => {
              const base =
                cargo.userData
                  .basePosition;

              const cargoPhase =
                cargo.userData
                  .phase;

              cargo.position.set(
                base.x +
                  Math.sin(
                    elapsedTime *
                      0.3 +
                      cargoPhase
                  ) *
                    0.006,

                base.y +
                  Math.cos(
                    elapsedTime *
                      0.34 +
                      cargoPhase
                  ) *
                    0.006,

                base.z +
                  Math.sin(
                    elapsedTime *
                      0.28 +
                      cargoPhase
                  ) *
                    0.005
              );

              cargo.rotation.x +=
                0.001;

              cargo.rotation.y +=
                0.0014;
            }
          );
        }
      );
    };

  return lysosomes;
}