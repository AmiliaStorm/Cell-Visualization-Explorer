import * as THREE from "three";

/* ==========================================================
   Deterministic random helpers
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

function rotateAroundZ(
  vector,
  angle
) {
  return vector
    .clone()
    .applyAxisAngle(
      new THREE.Vector3(0, 0, 1),
      angle
    );
}

/* ==========================================================
   Rounded capsule shape for one Golgi cisterna
   ========================================================== */

function createCapsuleShape(
  width,
  height
) {
  const radius =
    height * 0.5;

  const left =
    -width * 0.5 + radius;

  const right =
    width * 0.5 - radius;

  const bottom =
    -height * 0.5;

  const top =
    height * 0.5;

  const shape =
    new THREE.Shape();

  shape.moveTo(left, bottom);

  shape.lineTo(right, bottom);

  shape.absarc(
    right,
    0,
    radius,
    -Math.PI * 0.5,
    Math.PI * 0.5,
    false
  );

  shape.lineTo(left, top);

  shape.absarc(
    left,
    0,
    radius,
    Math.PI * 0.5,
    Math.PI * 1.5,
    false
  );

  shape.closePath();

  return shape;
}

/* ==========================================================
   Organic deformation for cisterna geometry
   ========================================================== */

function deformCisternaGeometry(
  geometry,
  {
    length,
    curveDepth,
    phase,
  }
) {
  const positions =
    geometry.attributes.position;

  for (
    let index = 0;
    index < positions.count;
    index += 1
  ) {
    let x =
      positions.getX(index);

    let y =
      positions.getY(index);

    let z =
      positions.getZ(index);

    const normalizedX =
      THREE.MathUtils.clamp(
        x / (length * 0.5),
        -1,
        1
      );

    const centerWeight =
      Math.pow(
        Math.cos(
          Math.abs(normalizedX) *
            Math.PI *
            0.5
        ),
        0.9
      );

    const edgeWeight =
      1 - centerWeight;

    const membraneBow =
      -curveDepth * centerWeight;

    const softRipple =
      Math.sin(
        normalizedX *
          Math.PI *
          2.2 +
          phase
      ) *
      0.022 *
      centerWeight;

    const microRipple =
      Math.sin(
        normalizedX *
          Math.PI *
          5.3 +
          phase * 0.75
      ) *
      0.007 *
      centerWeight;

    const verticalFold =
      Math.sin(
        normalizedX *
          Math.PI *
          1.3 +
          phase
      ) *
      0.016 *
      centerWeight +

      Math.sin(
        normalizedX *
          Math.PI *
          3.4 +
          phase * 0.6
      ) *
      0.006 *
      centerWeight;

    const endBulge =
      1 + edgeWeight * 0.12;

    y *= endBulge;
    y += verticalFold;

    z +=
      membraneBow +
      softRipple +
      microRipple;

    x +=
      Math.sin(
        normalizedX *
          Math.PI *
          1.8 +
          phase * 0.45
      ) *
      0.010 *
      centerWeight;

    positions.setXYZ(
      index,
      x,
      y,
      z
    );
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

/* ==========================================================
   Create one Golgi cisterna

   Flat, membranous, compact and slightly irregular.
   ========================================================== */

function createCisterna({
  length,
  height,
  thickness,
  curveDepth,
  phase,
  material,
}) {
  const shape =
    createCapsuleShape(
      length,
      height
    );

  const geometry =
    new THREE.ExtrudeGeometry(
      shape,
      {
        depth: thickness,
        steps: 1,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize:
          height * 0.045,
        bevelThickness:
          thickness * 0.22,
        curveSegments: 28,
      }
    );

  geometry.translate(
    0,
    0,
    -thickness * 0.5
  );

  deformCisternaGeometry(
    geometry,
    {
      length,
      curveDepth,
      phase,
    }
  );

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const cisAnchor =
    new THREE.Vector3(
      -length * 0.5 +
        height * 0.42,
      0,
      -curveDepth * 0.14
    );

  const transAnchor =
    new THREE.Vector3(
      length * 0.5 -
        height * 0.42,
      0,
      -curveDepth * 0.14
    );

  return {
    mesh,
    cisAnchor,
    transAnchor,
  };
}

/* ==========================================================
   Vesicle rim
   ========================================================== */

function createVesicleRim({
  shellRadius,
  material,
}) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(
      shellRadius * 0.96,
      shellRadius * 0.045,
      10,
      28
    ),
    material
  );
}

/* ==========================================================
   Budding vesicle with cargo
   ========================================================== */

function createBuddingVesicle({
  shellRadius,
  cargoCount,
  shellMaterial,
  cargoMaterial,
  rimMaterial,
  seed,
}) {
  const group =
    new THREE.Group();

  const shell =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        shellRadius,
        22,
        22
      ),
      shellMaterial
    );

  shell.scale.set(
    1,
    1.04,
    0.98
  );

  shell.castShadow = true;
  shell.receiveShadow = true;

  group.add(shell);

  const rim =
    createVesicleRim({
      shellRadius,
      material:
        rimMaterial,
    });

  rim.rotation.x =
    randomBetween(
      seed + 30,
      -0.3,
      0.3
    );

  rim.rotation.y =
    randomBetween(
      seed + 31,
      0,
      Math.PI
    );

  group.add(rim);

  const cargoParticles = [];

  for (
    let index = 0;
    index < cargoCount;
    index += 1
  ) {
    const localSeed =
      seed * 50 + index;

    const cargo =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          randomBetween(
            localSeed + 1,
            0.034,
            0.056
          ),
          10,
          10
        ),
        cargoMaterial
      );

    const direction =
      new THREE.Vector3(
        randomBetween(
          localSeed + 2,
          -1,
          1
        ),
        randomBetween(
          localSeed + 3,
          -1,
          1
        ),
        randomBetween(
          localSeed + 4,
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
        localSeed + 5,
        0,
        shellRadius * 0.5
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
        localSeed + 6,
        0,
        Math.PI * 2
      );

    cargo.castShadow = true;
    cargo.receiveShadow = true;

    group.add(cargo);
    cargoParticles.push(cargo);
  }

  return {
    group,
    shell,
    cargoParticles,
  };
}

/* ==========================================================
   Small membrane neck attaching vesicles
   ========================================================== */

function createMembraneNeck({
  offset,
  radius,
  material,
}) {
  const start =
    new THREE.Vector3(0, 0, 0);

  const end =
    offset
      .clone()
      .multiplyScalar(0.8);

  const midpoint =
    offset
      .clone()
      .multiplyScalar(0.46);

  midpoint.z += 0.02;
  midpoint.y +=
    offset.y * 0.10;

  const curve =
    new THREE.CatmullRomCurve3([
      start,
      midpoint,
      end,
    ]);

  const geometry =
    new THREE.TubeGeometry(
      curve,
      24,
      radius,
      10,
      false
    );

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
   Attached vesicle
   ========================================================== */

function createAttachedVesicle({
  anchorPoint,
  offset,
  shellRadius,
  cargoCount,
  shellMaterial,
  cargoMaterial,
  rimMaterial,
  neckMaterial,
  seed,
}) {
  const carrier =
    new THREE.Group();

  const vesicle =
    createBuddingVesicle({
      shellRadius,
      cargoCount,
      shellMaterial,
      cargoMaterial,
      rimMaterial,
      seed,
    });

  const neck =
    createMembraneNeck({
      offset,
      radius:
        shellRadius * 0.14,
      material:
        neckMaterial,
    });

  vesicle.group.position.copy(
    offset
  );

  carrier.add(neck);
  carrier.add(vesicle.group);

  carrier.position.copy(
    anchorPoint
  );

  carrier.userData.basePosition =
    anchorPoint.clone();

  carrier.userData.phase =
    seed * 0.72;

  carrier.userData.floatStrength =
    0.35;

  return {
    group: carrier,
    cargoParticles:
      vesicle.cargoParticles,
  };
}

/* ==========================================================
   Free vesicle
   ========================================================== */

function createFreeVesicle({
  position,
  shellRadius,
  cargoCount,
  shellMaterial,
  cargoMaterial,
  rimMaterial,
  seed,
}) {
  const vesicle =
    createBuddingVesicle({
      shellRadius,
      cargoCount,
      shellMaterial,
      cargoMaterial,
      rimMaterial,
      seed,
    });

  vesicle.group.position.copy(
    position
  );

  vesicle.group.userData.basePosition =
    position.clone();

  vesicle.group.userData.phase =
    seed * 0.93;

  vesicle.group.userData.floatStrength =
    1.0;

  return {
    group: vesicle.group,
    cargoParticles:
      vesicle.cargoParticles,
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

  group.userData.organelleId =
    "golgi";

  group.userData.info = {
    title:
      "Golgi Apparatus",

    subtitle:
      "Protein processing and sorting",

    summary:
      "A stack of curved cisternae that modifies, sorts and packages proteins. The cis face receives material from the ER; the trans face releases finished vesicles.",

    functions: [
      "Protein modification",
      "Protein sorting",
      "Vesicle packaging",
      "Secretion",
    ],
  };

  /* ========================================================
     Materials
     ======================================================== */

  const cisternaMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xbf6f8f,

      transparent: true,
      opacity: 0.98,

      roughness: 0.42,
      metalness: 0,

      transmission: 0.06,
      thickness: 0.16,

      clearcoat: 0.55,
      clearcoatRoughness: 0.24,

      emissive: 0x3a1527,
      emissiveIntensity: 0.14,

      side:
        THREE.DoubleSide,
    });

  const neckMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xd985a6,

      roughness: 0.34,
      metalness: 0,

      clearcoat: 0.42,
      clearcoatRoughness: 0.26,

      emissive: 0x43152b,
      emissiveIntensity: 0.12,
    });

  const vesicleShellMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xf3c0de,

      transparent: true,
      opacity: 0.40,

      roughness: 0.16,
      metalness: 0,

      transmission: 0.34,
      thickness: 0.14,

      clearcoat: 0.82,
      clearcoatRoughness: 0.12,

      emissive: 0x52203a,
      emissiveIntensity: 0.18,

      side:
        THREE.DoubleSide,

      depthWrite: false,
    });

  const cargoMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x9a4fe1,

      emissive: 0x5e25a0,
      emissiveIntensity: 0.78,

      roughness: 0.24,
      metalness: 0,

      clearcoat: 0.52,
      clearcoatRoughness: 0.18,
    });

  const rimMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xffd2f1,

      transparent: true,
      opacity: 0.62,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,
    });

  const cisternae = [];
  const cisternaGroups = [];
  const buddingVesicles = [];
  const allCargoParticles = [];
  const poleAnchors = [];

  /* ========================================================
     Compact layered stack

     Tighter, broader, flatter and less tube-like.
     ======================================================== */

  const layerDefinitions = [
    {
      length: 1.02,
      height: 0.13,
      thickness: 0.055,
      curveDepth: 0.12,
      y: 0.34,
      x: -0.05,
      z: 0.05,
      rotZ: -0.06,
    },
    {
      length: 1.16,
      height: 0.14,
      thickness: 0.058,
      curveDepth: 0.15,
      y: 0.24,
      x: -0.03,
      z: 0.035,
      rotZ: -0.045,
    },
    {
      length: 1.30,
      height: 0.15,
      thickness: 0.062,
      curveDepth: 0.18,
      y: 0.14,
      x: -0.02,
      z: 0.02,
      rotZ: -0.028,
    },
    {
      length: 1.42,
      height: 0.16,
      thickness: 0.066,
      curveDepth: 0.21,
      y: 0.04,
      x: -0.01,
      z: 0.005,
      rotZ: -0.012,
    },
    {
      length: 1.48,
      height: 0.17,
      thickness: 0.070,
      curveDepth: 0.24,
      y: -0.06,
      x: 0,
      z: -0.006,
      rotZ: 0.002,
    },
    {
      length: 1.40,
      height: 0.16,
      thickness: 0.066,
      curveDepth: 0.21,
      y: -0.16,
      x: 0.01,
      z: -0.02,
      rotZ: 0.018,
    },
    {
      length: 1.24,
      height: 0.15,
      thickness: 0.060,
      curveDepth: 0.17,
      y: -0.26,
      x: 0.03,
      z: -0.038,
      rotZ: 0.034,
    },
    {
      length: 1.06,
      height: 0.13,
      thickness: 0.054,
      curveDepth: 0.13,
      y: -0.35,
      x: 0.05,
      z: -0.052,
      rotZ: 0.05,
    },
  ];

  let middleCisPoint = null;
  let middleTransPoint = null;

  layerDefinitions.forEach(
    (
      definition,
      index
    ) => {
      const phase =
        index * 0.78;

      const layerGroup =
        new THREE.Group();

      const cisterna =
        createCisterna({
          length:
            definition.length,
          height:
            definition.height,
          thickness:
            definition.thickness,
          curveDepth:
            definition.curveDepth,
          phase,
          material:
            cisternaMaterial,
        });

      layerGroup.add(
        cisterna.mesh
      );

      layerGroup.position.set(
        definition.x,
        definition.y,
        definition.z
      );

      layerGroup.rotation.z =
        definition.rotZ;

      layerGroup.userData.baseY =
        definition.y;

      layerGroup.userData.baseZ =
        definition.z;

      layerGroup.userData.baseRotZ =
        definition.rotZ;

      layerGroup.userData.phase =
        phase;

      group.add(layerGroup);

      cisternae.push(
        cisterna.mesh
      );

      cisternaGroups.push(
        layerGroup
      );

      const cisAnchor =
        rotateAroundZ(
          cisterna.cisAnchor,
          definition.rotZ
        ).add(
          layerGroup.position
        );

      const transAnchor =
        rotateAroundZ(
          cisterna.transAnchor,
          definition.rotZ
        ).add(
          layerGroup.position
        );

      poleAnchors.push({
        cis: cisAnchor,
        trans: transAnchor,
      });

      if (index === 4) {
        middleCisPoint =
          cisAnchor.clone();

        middleTransPoint =
          transAnchor.clone();
      }
    }
  );

  /* ========================================================
     Attached vesicles at trans face
     ======================================================== */

  const transAttachmentPlan = [
    {
      layerIndex: 2,
      offset:
        new THREE.Vector3(
          0.12,
          0.08,
          0.05
        ),
      shellRadius: 0.15,
      cargoCount: 7,
      seed: 1,
    },
    {
      layerIndex: 4,
      offset:
        new THREE.Vector3(
          0.18,
          0.02,
          0.09
        ),
      shellRadius: 0.22,
      cargoCount: 12,
      seed: 2,
    },
    {
      layerIndex: 6,
      offset:
        new THREE.Vector3(
          0.13,
          -0.09,
          0.05
        ),
      shellRadius: 0.15,
      cargoCount: 7,
      seed: 3,
    },
  ];

  transAttachmentPlan.forEach(
    (item) => {
      const anchor =
        poleAnchors[
          item.layerIndex
        ].trans;

      const vesicle =
        createAttachedVesicle({
          anchorPoint:
            anchor,
          offset:
            item.offset,
          shellRadius:
            item.shellRadius,
          cargoCount:
            item.cargoCount,
          shellMaterial:
            vesicleShellMaterial,
          cargoMaterial,
          rimMaterial,
          neckMaterial,
          seed:
            item.seed,
        });

      group.add(
        vesicle.group
      );

      buddingVesicles.push(
        vesicle.group
      );

      allCargoParticles.push(
        ...vesicle.cargoParticles
      );
    }
  );

  /* ========================================================
     Small incoming vesicle at cis face
     ======================================================== */

  const cisAttachmentPlan = [
    {
      layerIndex: 3,
      offset:
        new THREE.Vector3(
          -0.11,
          0.06,
          -0.035
        ),
      shellRadius: 0.12,
      cargoCount: 5,
      seed: 10,
    },
  ];

  cisAttachmentPlan.forEach(
    (item) => {
      const anchor =
        poleAnchors[
          item.layerIndex
        ].cis;

      const vesicle =
        createAttachedVesicle({
          anchorPoint:
            anchor,
          offset:
            item.offset,
          shellRadius:
            item.shellRadius,
          cargoCount:
            item.cargoCount,
          shellMaterial:
            vesicleShellMaterial,
          cargoMaterial,
          rimMaterial,
          neckMaterial,
          seed:
            item.seed,
        });

      group.add(
        vesicle.group
      );

      buddingVesicles.push(
        vesicle.group
      );

      allCargoParticles.push(
        ...vesicle.cargoParticles
      );
    }
  );

  /* ========================================================
     Free vesicles near trans face
     ======================================================== */

  const freeVesiclePlan = [
    {
      position:
        middleTransPoint
          .clone()
          .add(
            new THREE.Vector3(
              0.36,
              0.16,
              0.11
            )
          ),
      shellRadius: 0.19,
      cargoCount: 9,
      seed: 20,
    },
    {
      position:
        middleTransPoint
          .clone()
          .add(
            new THREE.Vector3(
              0.42,
              -0.13,
              0.08
            )
          ),
      shellRadius: 0.16,
      cargoCount: 7,
      seed: 21,
    },
  ];

  freeVesiclePlan.forEach(
    (item) => {
      const vesicle =
        createFreeVesicle({
          position:
            item.position,
          shellRadius:
            item.shellRadius,
          cargoCount:
            item.cargoCount,
          shellMaterial:
            vesicleShellMaterial,
          cargoMaterial,
          rimMaterial,
          seed:
            item.seed,
        });

      group.add(
        vesicle.group
      );

      buddingVesicles.push(
        vesicle.group
      );

      allCargoParticles.push(
        ...vesicle.cargoParticles
      );
    }
  );

  /* ========================================================
     Presentation angle
     ======================================================== */

  group.rotation.set(
    -0.10,
    -0.23,
    -0.05
  );

  /* ========================================================
     Animation
     ======================================================== */

  function animate(
    elapsedTime
  ) {
    cisternaGroups.forEach(
      (layerGroup) => {
        const phase =
          layerGroup.userData
            .phase;

        layerGroup.position.y =
          layerGroup.userData
            .baseY +
          Math.sin(
            elapsedTime *
              0.16 +
              phase
          ) *
            0.0035;

        layerGroup.position.z =
          layerGroup.userData
            .baseZ +
          Math.cos(
            elapsedTime *
              0.12 +
              phase * 0.8
          ) *
            0.0028;

        layerGroup.rotation.z =
          layerGroup.userData
            .baseRotZ +
          Math.sin(
            elapsedTime *
              0.10 +
              phase
          ) *
            0.0035;
      }
    );

    buddingVesicles.forEach(
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

        const strength =
          vesicle.userData
            .floatStrength ?? 1;

        vesicle.position.set(
          base.x +
            Math.sin(
              elapsedTime *
                0.28 +
                phase
            ) *
              0.010 *
              strength,

          base.y +
            Math.cos(
              elapsedTime *
                0.22 +
                phase
            ) *
              0.008 *
              strength,

          base.z +
            Math.sin(
              elapsedTime *
                0.31 +
                phase +
                index * 0.14
            ) *
              0.007 *
              strength
        );
      }
    );

    allCargoParticles.forEach(
      (cargo) => {
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
                0.78 +
                phase
            ) *
              0.0055,

          base.y +
            Math.cos(
              elapsedTime *
                0.70 +
                phase
            ) *
              0.0055,

          base.z +
            Math.sin(
              elapsedTime *
                0.64 +
                phase
            ) *
              0.0045
        );

        const pulse =
          0.95 +
          Math.sin(
            elapsedTime *
              1.0 +
              phase
          ) *
            0.05;

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
    vesicles: buddingVesicles,
    cargoParticles: allCargoParticles,
    animate,
  };
}