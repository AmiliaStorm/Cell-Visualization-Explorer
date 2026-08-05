import * as THREE from "three";

/* ==========================================================
   Deterministic random helpers

   Keeps the Golgi arrangement consistent after refreshing.
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
   Rounded rectangle shape

   Used as the base cross-section of each cisterna.
   ========================================================== */

function createRoundedRectangleShape(
  width,
  height,
  cornerRadius
) {
  const shape =
    new THREE.Shape();

  const halfWidth =
    width * 0.5;

  const halfHeight =
    height * 0.5;

  const radius =
    Math.min(
      cornerRadius,
      halfWidth,
      halfHeight
    );

  shape.moveTo(
    -halfWidth + radius,
    -halfHeight
  );

  shape.lineTo(
    halfWidth - radius,
    -halfHeight
  );

  shape.quadraticCurveTo(
    halfWidth,
    -halfHeight,
    halfWidth,
    -halfHeight + radius
  );

  shape.lineTo(
    halfWidth,
    halfHeight - radius
  );

  shape.quadraticCurveTo(
    halfWidth,
    halfHeight,
    halfWidth - radius,
    halfHeight
  );

  shape.lineTo(
    -halfWidth + radius,
    halfHeight
  );

  shape.quadraticCurveTo(
    -halfWidth,
    halfHeight,
    -halfWidth,
    halfHeight - radius
  );

  shape.lineTo(
    -halfWidth,
    -halfHeight + radius
  );

  shape.quadraticCurveTo(
    -halfWidth,
    -halfHeight,
    -halfWidth + radius,
    -halfHeight
  );

  return shape;
}

/* ==========================================================
   Create one curved Golgi cisterna
   ========================================================== */

function createCisterna({
  width,
  height,
  depth,
  bend,
  wave,
  twist,
  material,
}) {
  const shape =
    createRoundedRectangleShape(
      width,
      height,
      height * 0.46
    );

  const geometry =
    new THREE.ExtrudeGeometry(
      shape,
      {
        depth,
        steps: 1,

        bevelEnabled: true,
        bevelSegments: 3,

        bevelSize: 0.022,
        bevelThickness: 0.018,

        curveSegments: 22,
      }
    );

  geometry.center();

  const position =
    geometry.attributes.position;

  for (
    let index = 0;
    index < position.count;
    index += 1
  ) {
    const x =
      position.getX(index);

    const y =
      position.getY(index);

    const z =
      position.getZ(index);

    const normalizedX =
      THREE.MathUtils.clamp(
        x / (width * 0.5),
        -1,
        1
      );

    /*
     * Bend in the y-direction so the
     * curvature is clearly visible
     * from the front camera.
     *
     * The ends rise more than the centre,
     * producing the characteristic
     * curved Golgi cisterna shape.
     */
    const visibleBend =
      Math.pow(
        Math.abs(normalizedX),
        1.65
      ) * bend;

    const surfaceWave =
      Math.sin(
        normalizedX *
        Math.PI *
        2
      ) * wave;

    const depthWave =
      Math.sin(
        normalizedX *
        Math.PI
      ) * twist;

    position.setXYZ(
      index,

      x,

      y +
        visibleBend +
        surfaceWave,

      z +
        depthWave +
        Math.cos(
          normalizedX *
          Math.PI *
          2
        ) *
          wave *
          0.22
    );
  }

  position.needsUpdate =
    true;

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/* ==========================================================
   Calculate the approximate cisterna-end position
   ========================================================== */

function getCisternaEndPosition({
  side,
  width,
  bend,
  wave,
}) {
  const normalizedX =
    side < 0 ? -1 : 1;

  return new THREE.Vector3(
    normalizedX *
      width *
      0.5,

    bend,

    wave * 0.22
  );
}

/* ==========================================================
   Create a swollen cisterna end
   ========================================================== */

function createCisternaEnd({
  position,
  height,
  depth,
  material,
}) {
  const end =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        height * 0.65,
        18,
        18
      ),
      material
    );

  end.position.copy(
    position
  );

  end.scale.set(
    1.1,
    0.78,
    depth /
      (height * 1.3)
  );

  end.castShadow = true;

  return end;
}

/* ==========================================================
   Create one Golgi vesicle with cargo
   ========================================================== */

function createVesicle({
  radius,
  shellMaterial,
  cargoMaterial,
  cargoCount,
  seed,
}) {
  const group =
    new THREE.Group();

  const shell =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        radius,
        22,
        22
      ),
      shellMaterial
    );

  shell.renderOrder = 4;

  group.add(shell);

  const cargoParticles = [];

  for (
    let index = 0;
    index < cargoCount;
    index += 1
  ) {
    const cargo =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          radius * 0.18,
          9,
          9
        ),
        cargoMaterial
      );

    const localSeed =
      seed * 20 +
      index;

    const direction =
      new THREE.Vector3(
        randomBetween(
          localSeed + 1,
          -1,
          1
        ),

        randomBetween(
          localSeed + 2,
          -1,
          1
        ),

        randomBetween(
          localSeed + 3,
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
        localSeed + 4,
        radius * 0.16,
        radius * 0.52
      );

    cargo.position.copy(
      direction.multiplyScalar(
        distance
      )
    );

    cargo.userData.basePosition =
      cargo.position.clone();

    cargo.userData.phase =
      randomBetween(
        localSeed + 5,
        0,
        Math.PI * 2
      );

    group.add(cargo);

    cargoParticles.push(
      cargo
    );
  }

  return {
    group,
    shell,
    cargoParticles,
  };
}

/* ==========================================================
   Golgi apparatus
   ========================================================== */

export function createGolgi() {
  const group =
    new THREE.Group();

  group.name =
    "golgiApparatus";

  group.userData.type =
    "golgi";

  /* --------------------------------------------------------
     Materials
     -------------------------------------------------------- */

  const cisternaMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xc95b9d,

      transparent: true,
      opacity: 0.92,

      roughness: 0.3,
      metalness: 0,

      transmission: 0,

      clearcoat: 0.58,
      clearcoatRoughness: 0.24,

      emissive: 0x4b1239,
      emissiveIntensity: 0.25,

      side: THREE.DoubleSide,
    });

  const edgeMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xe578b6,

      emissive: 0x641749,
      emissiveIntensity: 0.4,

      roughness: 0.3,
      metalness: 0,
    });

  const vesicleMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xe884bd,

      transparent: true,
      opacity: 0.68,

      roughness: 0.2,
      metalness: 0,

      transmission: 0.12,
      thickness: 0.1,

      clearcoat: 0.7,
      clearcoatRoughness: 0.2,

      depthWrite: false,
    });

  const cargoMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xc95cff,

      emissive: 0x721eff,
      emissiveIntensity: 1.1,

      roughness: 0.26,
    });

  const cisternae = [];
  const cisternaGroups = [];
  const vesicles = [];
  const cargoParticles = [];

  /* --------------------------------------------------------
     Curved Golgi stack
     -------------------------------------------------------- */

  const layerCount = 7;

  for (
    let index = 0;
    index < layerCount;
    index += 1
  ) {
    const progress =
      index /
      (layerCount - 1);

    const distanceFromMiddle =
      Math.abs(
        progress - 0.5
      ) * 2;

    /*
     * Middle cisternae are longest.
     * Top and bottom layers are shorter.
     */
    const width =
      1.48 -
      distanceFromMiddle *
        0.27;

    const height =
      0.115 +
      (
        1 -
        distanceFromMiddle
      ) *
        0.018;

    const depth =
      0.2 +
      progress * 0.018;

    const bend =
      0.16 +
      progress * 0.035;

    const wave =
      0.012 +
      (
        index % 2
      ) * 0.008;

    const twist =
      0.055 +
      progress * 0.025;

    const layerGroup =
      new THREE.Group();

    const cisterna =
      createCisterna({
        width,
        height,
        depth,
        bend,
        wave,
        twist,
        material:
          cisternaMaterial,
      });

    layerGroup.add(
      cisterna
    );

    const leftEndPosition =
      getCisternaEndPosition({
        side: -1,
        width,
        bend,
        wave,
      });

    const rightEndPosition =
      getCisternaEndPosition({
        side: 1,
        width,
        bend,
        wave,
      });

    const leftEnd =
      createCisternaEnd({
        position:
          leftEndPosition,
        height,
        depth,
        material:
          edgeMaterial,
      });

    const rightEnd =
      createCisternaEnd({
        position:
          rightEndPosition,
        height,
        depth,
        material:
          edgeMaterial,
      });

    /*
     * The trans side is slightly more
     * swollen than the cis side.
     */
    rightEnd.scale.multiplyScalar(
      1.08
    );

    layerGroup.add(
      leftEnd,
      rightEnd
    );

    layerGroup.position.y =
      (
        index -
        (layerCount - 1) / 2
      ) * 0.185;

    layerGroup.position.x =
      Math.sin(
        index * 0.8
      ) * 0.035;

    layerGroup.position.z =
      (
        index -
        (layerCount - 1) / 2
      ) * 0.035;

    layerGroup.rotation.z =
      Math.sin(
        index * 0.68
      ) * 0.028;

    layerGroup.rotation.y =
      Math.cos(
        index * 0.7
      ) * 0.025;

    layerGroup.userData.baseY =
      layerGroup.position.y;

    layerGroup.userData.baseZ =
      layerGroup.position.z;

    layerGroup.userData.baseRotationZ =
      layerGroup.rotation.z;

    layerGroup.userData.phase =
      index * 0.88;

    group.add(
      layerGroup
    );

    cisternae.push(
      cisterna
    );

    cisternaGroups.push(
      layerGroup
    );
  }

  /* --------------------------------------------------------
     Incoming and outgoing Golgi vesicles
     -------------------------------------------------------- */

  const vesicleConfigurations = [
    {
      position:
        new THREE.Vector3(
          -0.93,
          0.48,
          0.08
        ),
      radius: 0.115,
      cargoCount: 4,
    },

    {
      position:
        new THREE.Vector3(
          -1.02,
          0.08,
          0.14
        ),
      radius: 0.095,
      cargoCount: 3,
    },

    {
      position:
        new THREE.Vector3(
          -0.83,
          -0.42,
          0.04
        ),
      radius: 0.105,
      cargoCount: 3,
    },

    {
      position:
        new THREE.Vector3(
          0.93,
          0.43,
          0.13
        ),
      radius: 0.12,
      cargoCount: 5,
    },

    {
      position:
        new THREE.Vector3(
          1.02,
          0.02,
          0.2
        ),
      radius: 0.105,
      cargoCount: 4,
    },

    {
      position:
        new THREE.Vector3(
          0.9,
          -0.48,
          0.08
        ),
      radius: 0.125,
      cargoCount: 5,
    },

    {
      position:
        new THREE.Vector3(
          0.68,
          -0.73,
          -0.03
        ),
      radius: 0.09,
      cargoCount: 3,
    },
  ];

  vesicleConfigurations.forEach(
    (
      configuration,
      index
    ) => {
      const vesicle =
        createVesicle({
          radius:
            configuration.radius,

          shellMaterial:
            vesicleMaterial,

          cargoMaterial,

          cargoCount:
            configuration
              .cargoCount,

          seed:
            index + 1,
        });

      vesicle.group.position.copy(
        configuration.position
      );

      vesicle.group.userData
        .basePosition =
        configuration
          .position
          .clone();

      vesicle.group.userData.phase =
        index * 1.17;

      group.add(
        vesicle.group
      );

      vesicles.push(
        vesicle.group
      );

      cargoParticles.push(
        ...vesicle
          .cargoParticles
      );
    }
  );

  /*
   * Slight overall perspective angle.
   * Layout.js handles the final position,
   * rotation and scale of this group.
   */
  group.rotation.set(
    -0.04,
    -0.12,
    -0.03
  );

  /* --------------------------------------------------------
     Animation
     -------------------------------------------------------- */

  function animate(
    elapsedTime
  ) {
    cisternaGroups.forEach(
      (
        layerGroup,
        index
      ) => {
        const phase =
          layerGroup.userData
            .phase;

        layerGroup.position.y =
          layerGroup.userData
            .baseY +
          Math.sin(
            elapsedTime *
              0.24 +
            phase
          ) *
            0.007;

        layerGroup.position.z =
          layerGroup.userData
            .baseZ +
          Math.cos(
            elapsedTime *
              0.2 +
            phase
          ) *
            0.005;

        layerGroup.rotation.z =
          layerGroup.userData
            .baseRotationZ +
          Math.sin(
            elapsedTime *
              0.21 +
            phase +
            index * 0.12
          ) *
            0.005;
      }
    );

    vesicles.forEach(
      (
        vesicle,
        index
      ) => {
        const base =
          vesicle.userData
            .basePosition;

        const phase =
          vesicle.userData
            .phase;

        vesicle.position.set(
          base.x +
            Math.sin(
              elapsedTime *
                0.42 +
              phase
            ) *
              0.018,

          base.y +
            Math.cos(
              elapsedTime *
                0.36 +
              phase
            ) *
              0.014,

          base.z +
            Math.sin(
              elapsedTime *
                0.48 +
              phase +
              index * 0.2
            ) *
              0.012
        );

        vesicle.rotation.y =
          elapsedTime *
          (
            0.05 +
            index * 0.004
          );
      }
    );

    cargoParticles.forEach(
      (
        cargo,
        index
      ) => {
        const base =
          cargo.userData
            .basePosition;

        const phase =
          cargo.userData
            .phase;

        cargo.position.set(
          base.x +
            Math.sin(
              elapsedTime *
                0.75 +
              phase
            ) *
              0.005,

          base.y +
            Math.cos(
              elapsedTime *
                0.68 +
              phase
            ) *
              0.005,

          base.z +
            Math.sin(
              elapsedTime *
                0.62 +
              phase +
              index * 0.05
            ) *
              0.004
        );

        const pulse =
          0.88 +
          Math.sin(
            elapsedTime *
              1.1 +
            phase
          ) *
            0.09;

        cargo.scale.setScalar(
          pulse
        );
      }
    );
  }

  return {
    group,
    cisternae,
    cisternaGroups,
    vesicles,
    cargoParticles,
    animate,
  };
}