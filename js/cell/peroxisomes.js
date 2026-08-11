import * as THREE from "three";

/* ==========================================================
   Deterministic pseudo-random helpers

   Keeps peroxisome appearance consistent after refresh.
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

   Peroxisomes are membrane-bound and generally rounded,
   but biological structures should not look manufactured.
   ========================================================== */

function deformGeometry(
  geometry,
  seed,
  strength = 0.012
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
        direction.x * 4.8 +
        direction.y * 3.7 +
        seed
      ) *
      strength;

    const waveTwo =
      Math.cos(
        direction.z * 5.1 -
        direction.x * 2.9 +
        seed * 0.8
      ) *
      strength *
      0.45;

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
   Create one peroxisome
   ========================================================== */

function createPeroxisome(
  seed = 1
) {
  const group =
    new THREE.Group();

  group.name =
    "peroxisome";

  group.userData.type =
    "peroxisome";

  group.userData.organelleId =
    "peroxisome";

  group.userData.info = {
    title:
      "Peroxisome",

    subtitle:
      "Oxidative metabolic compartment",

    summary:
      "A small membrane-bound organelle that performs oxidative reactions, breaks down very-long-chain fatty acids, and helps control hydrogen peroxide.",

    functions: [
      "Fatty acid oxidation",
      "Hydrogen peroxide metabolism",
      "Reactive oxygen species control",
      "Lipid metabolism",
    ],
  };

  /* ========================================================
     Size
     ======================================================== */

  const radius =
    randomBetween(
      seed + 1,
      0.115,
      0.155
    );

  /* ========================================================
     Materials
     ======================================================== */

  const membraneMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x48d6c7,

      transparent: true,
      opacity: 0.38,

      roughness: 0.2,
      metalness: 0,

      clearcoat: 0.75,
      clearcoatRoughness: 0.18,

      emissive: 0x0b5f59,
      emissiveIntensity: 0.34,

      side: THREE.DoubleSide,

      depthWrite: false,
      depthTest: true,
    });

  const matrixMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x1f746d,

      transparent: true,
      opacity: 0.24,

      roughness: 0.5,

      emissive: 0x0b3835,
      emissiveIntensity: 0.25,

      depthWrite: false,
    });

  const enzymeMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xa6fff2,

      emissive: 0x42d8c7,
      emissiveIntensity: 0.72,

      roughness: 0.28,
      metalness: 0,
    });

  const coreMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xd7fff8,

      emissive: 0x63e8d9,
      emissiveIntensity: 0.5,

      roughness: 0.26,

      transparent: true,
      opacity: 0.78,

      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
    });

  /* ========================================================
     Outer membrane
     ======================================================== */

  const membraneGeometry =
    deformGeometry(
      new THREE.SphereGeometry(
        radius,
        36,
        36
      ),
      seed,
      radius * 0.065
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
      0.94,
      1.06
    ),

    randomBetween(
      seed + 3,
      0.92,
      1.07
    ),

    randomBetween(
      seed + 4,
      0.94,
      1.06
    )
  );

  /* ========================================================
     Internal matrix
     ======================================================== */

  const matrix =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        radius * 0.82,
        28,
        28
      ),
      matrixMaterial
    );

  matrix.scale.copy(
    membrane.scale
  );

  /* ========================================================
     Dense enzyme-rich core

     Some peroxisomes contain highly concentrated enzyme
     regions. This gives them a distinct internal appearance
     from lysosomes.
     ======================================================== */

  const coreGeometry =
    new THREE.IcosahedronGeometry(
      radius * 0.25,
      1
    );

  const core =
    new THREE.Mesh(
      coreGeometry,
      coreMaterial
    );

  core.scale.set(
    1,
    0.78,
    0.88
  );

  core.rotation.set(
    randomBetween(
      seed + 8,
      -0.5,
      0.5
    ),

    randomBetween(
      seed + 9,
      -0.5,
      0.5
    ),

    randomBetween(
      seed + 10,
      -0.5,
      0.5
    )
  );

  /* ========================================================
     Enzyme particles
     ======================================================== */

  const enzymeGroup =
    new THREE.Group();

  const enzymes = [];

  const enzymeCount =
    Math.floor(
      randomBetween(
        seed + 20,
        7,
        12
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
            seed * 31 +
              index,
            0.009,
            0.016
          ),
          8,
          8
        ),
        enzymeMaterial
      );

    const direction =
      new THREE.Vector3(
        randomBetween(
          seed * 40 +
            index * 3 +
            1,
          -1,
          1
        ),

        randomBetween(
          seed * 40 +
            index * 3 +
            2,
          -1,
          1
        ),

        randomBetween(
          seed * 40 +
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
        radius * 0.34,
        radius * 0.64
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
        seed * 120 +
          index,
        0.28,
        0.6
      );

    enzymeGroup.add(
      particle
    );

    enzymes.push(
      particle
    );
  }

  /* ========================================================
     Assemble peroxisome
     ======================================================== */

  group.add(
    matrix,
    core,
    enzymeGroup,
    membrane
  );

  group.userData.membrane =
    membrane;

  group.userData.matrix =
    matrix;

  group.userData.core =
    core;

  group.userData.enzymes =
    enzymes;

  group.userData.phase =
    randomBetween(
      seed * 190,
      0,
      Math.PI * 2
    );

  return group;
}

/* ==========================================================
   Create all peroxisomes
   ========================================================== */

export function createPeroxisomes() {
  const peroxisomes = [
    createPeroxisome(1.7),
    createPeroxisome(3.2),
    createPeroxisome(4.8),
    createPeroxisome(6.5),
    createPeroxisome(8.1),
  ];

  /* ========================================================
     Animation
     ======================================================== */

  peroxisomes.animate =
    function animate(
      elapsedTime
    ) {
      peroxisomes.forEach(
        (
          peroxisome,
          index
        ) => {
          const phase =
            peroxisome.userData
              .phase;

          /*
           * Preserve scale assigned by layout.js.
           */

          const layoutScale =
            peroxisome.userData
              .layoutScale ??
            peroxisome.scale.x;

          /*
           * Very subtle membrane breathing.
           */

          const pulse =
            1 +
            Math.sin(
              elapsedTime *
                0.45 +
                phase
            ) *
              0.014;

          peroxisome.scale.setScalar(
            layoutScale *
              pulse
          );

          /*
           * Slow organelle rotation.
           */

          peroxisome.rotation.y +=
            0.00009 *
            (
              index % 2 === 0
                ? 1
                : -1
            );

          /*
           * Dense enzyme core movement.
           */

          const core =
            peroxisome.userData
              .core;

          core.rotation.x +=
            0.00045;

          core.rotation.y -=
            0.00035;

          /*
           * Internal enzyme movement.
           */

          peroxisome.userData
            .enzymes
            .forEach(
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
                      0.0045,

                  base.y +
                    Math.cos(
                      elapsedTime *
                        speed +
                        enzymePhase
                    ) *
                      0.0045,

                  base.z +
                    Math.sin(
                      elapsedTime *
                        0.48 +
                        enzymePhase
                    ) *
                      0.004
                );

                enzyme.scale.setScalar(
                  0.92 +
                    Math.sin(
                      elapsedTime *
                        0.8 +
                        enzymePhase
                    ) *
                      0.07
                );
              }
            );
        }
      );
    };

  return peroxisomes;
}