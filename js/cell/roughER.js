import * as THREE from "three";

/* ==========================================================
   Deterministic pseudo-random helpers

   Keep the rough ER identical after every refresh.
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
   Evaluate one point on an ER membrane sheet
   ========================================================== */

function getPointOnSheet({
  sheetData,
  angleProgress,
  widthProgress,
  surfaceOffset = 0,
}) {
  const {
    startAngle,
    endAngle,
    innerRadius,
    width,
    yOffset,
    zPosition,
    verticalScale,
    waveCount,
    waveStrength,
    largeFoldStrength,
    verticalWave,
    depthWave,
    phase,
  } = sheetData;

  const angle =
    THREE.MathUtils.lerp(
      startAngle,
      endAngle,
      angleProgress
    );

  /*
   * Tapers the membrane near both open ends.
   */
  const endTaper =
    Math.pow(
      Math.sin(
        angleProgress *
        Math.PI
      ),
      0.42
    );

  /*
   * Gives the ribbon a slightly swollen
   * centre and narrower ends.
   */
  const taperedWidth =
    width *
    (
      0.72 +
      endTaper * 0.28
    );

  const crossSection =
    Math.sin(
      widthProgress *
      Math.PI
    );

  const smallFold =
    Math.sin(
      angle *
        waveCount +
      phase +
      widthProgress *
        1.6
    ) *
    waveStrength *
    (
      0.45 +
      crossSection * 0.55
    );

  const largeFold =
    Math.sin(
      angle * 1.75 +
      phase * 0.62
    ) *
    largeFoldStrength;

  const secondaryFold =
    Math.sin(
      angle *
        waveCount *
        1.8 -
      phase +
      widthProgress *
        Math.PI *
        2
    ) *
    waveStrength *
    0.2;

  const radius =
    innerRadius +
    taperedWidth *
      widthProgress +
    smallFold +
    largeFold +
    secondaryFold;

  const x =
    Math.cos(angle) *
    radius;

  const y =
    Math.sin(angle) *
      radius *
      verticalScale +
    yOffset +
    Math.sin(
      angle * 2.15 +
      phase
    ) *
      verticalWave;

  /*
   * A small depth variation stops the ER
   * from looking like flat concentric rings.
   */
  const z =
    zPosition +
    Math.cos(
      angle * 2.4 +
      phase
    ) *
      depthWave +
    crossSection *
      depthWave *
      0.55 +
    surfaceOffset;

  return {
    position:
      new THREE.Vector3(
        x,
        y,
        z
      ),

    angle,
  };
}

/* ==========================================================
   Create the broad surface of one membrane sheet
   ========================================================== */

function createMembraneSurface({
  sheetData,
  material,
}) {
  const angleSegments = 104;
  const widthSegments = 8;

  const positions = [];
  const indices = [];

  for (
    let angleIndex = 0;
    angleIndex <= angleSegments;
    angleIndex += 1
  ) {
    const angleProgress =
      angleIndex /
      angleSegments;

    for (
      let widthIndex = 0;
      widthIndex <= widthSegments;
      widthIndex += 1
    ) {
      const widthProgress =
        widthIndex /
        widthSegments;

      const point =
        getPointOnSheet({
          sheetData,
          angleProgress,
          widthProgress,
        });

      positions.push(
        point.position.x,
        point.position.y,
        point.position.z
      );
    }
  }

  const rowLength =
    widthSegments + 1;

  for (
    let angleIndex = 0;
    angleIndex < angleSegments;
    angleIndex += 1
  ) {
    for (
      let widthIndex = 0;
      widthIndex < widthSegments;
      widthIndex += 1
    ) {
      const a =
        angleIndex *
          rowLength +
        widthIndex;

      const b = a + 1;

      const c =
        (
          angleIndex + 1
        ) *
          rowLength +
        widthIndex;

      const d = c + 1;

      indices.push(
        a,
        c,
        b,

        b,
        c,
        d
      );
    }
  }

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );

  geometry.setIndex(
    indices
  );

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const surface =
    new THREE.Mesh(
      geometry,
      material
    );

  surface.castShadow = true;
  surface.receiveShadow = true;
  surface.renderOrder = 2;

  surface.userData.sheetData =
    sheetData;

  return surface;
}

/* ==========================================================
   Create one rounded edge around a membrane sheet
   ========================================================== */

function createSheetEdge({
  sheetData,
  widthProgress,
  radius,
  material,
}) {
  const points = [];

  const segments = 84;

  for (
    let index = 0;
    index <= segments;
    index += 1
  ) {
    const angleProgress =
      index / segments;

    const point =
      getPointOnSheet({
        sheetData,
        angleProgress,
        widthProgress,
      });

    points.push(
      point.position
    );
  }

  const curve =
    new THREE.CatmullRomCurve3(
      points
    );

  const geometry =
    new THREE.TubeGeometry(
      curve,
      92,
      radius,
      8,
      false
    );

  const edge =
    new THREE.Mesh(
      geometry,
      material
    );

  edge.castShadow = true;
  edge.renderOrder = 3;

  return edge;
}

/* ==========================================================
   Create one complete folded ER cisterna
   ========================================================== */

function createCisterna({
  sheetData,
  surfaceMaterial,
  edgeMaterial,
}) {
  const group =
    new THREE.Group();

  const surface =
    createMembraneSurface({
      sheetData,
      material:
        surfaceMaterial,
    });

  /*
   * Inner and outer tubes provide visible
   * rounded membrane thickness.
   */
  const innerEdge =
    createSheetEdge({
      sheetData,
      widthProgress: 0,
      radius: 0.014,
      material:
        edgeMaterial,
    });

  const outerEdge =
    createSheetEdge({
      sheetData,
      widthProgress: 1,
      radius: 0.018,
      material:
        edgeMaterial,
    });

  group.add(
    surface,
    innerEdge,
    outerEdge
  );

  return {
    group,
    surface,
    innerEdge,
    outerEdge,
  };
}

/* ==========================================================
   Create one ribosome
   ========================================================== */

function createRibosome(
  material
) {
  const group =
    new THREE.Group();

  const largeSubunit =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.024,
        10,
        10
      ),
      material
    );

  largeSubunit.scale.set(
    1.18,
    0.78,
    0.72
  );

  const smallSubunit =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.016,
        9,
        9
      ),
      material
    );

  smallSubunit.position.set(
    0.015,
    0.01,
    0.015
  );

  group.add(
    largeSubunit,
    smallSubunit
  );

  group.traverse(
    (object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.renderOrder = 4;
      }
    }
  );

  return group;
}

/* ==========================================================
   Attach ribosomes to one membrane sheet
   ========================================================== */

function attachRibosomesToSheet({
  sheetData,
  sheetIndex,
  count,
  material,
  parent,
  collection,
}) {
  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const seed =
      sheetIndex * 200 +
      index * 11;

    /*
     * Keep ribosomes away from the cut ends
     * and distribute them across the surface.
     */
    const angleProgress =
      randomBetween(
        seed + 1,
        0.055,
        0.945
      );

    const widthProgress =
      randomBetween(
        seed + 2,
        0.12,
        0.9
      );

    const point =
      getPointOnSheet({
        sheetData,
        angleProgress,
        widthProgress,

        /*
         * Places the ribosome on the
         * visible cytoplasmic surface.
         */
        surfaceOffset: 0.032,
      });

    const ribosome =
      createRibosome(
        material
      );

    ribosome.position.copy(
      point.position
    );

    ribosome.rotation.set(
      randomBetween(
        seed + 3,
        -0.22,
        0.22
      ),

      randomBetween(
        seed + 4,
        0,
        Math.PI * 2
      ),

      point.angle +
        Math.PI / 2
    );

    const scale =
      randomBetween(
        seed + 5,
        0.82,
        1.12
      );

    ribosome.scale.setScalar(
      scale
    );

    ribosome.userData.baseScale =
      scale;

    ribosome.userData.phase =
      randomBetween(
        seed + 6,
        0,
        Math.PI * 2
      );

    parent.add(
      ribosome
    );

    collection.push(
      ribosome
    );
  }
}

/* ==========================================================
   Rough endoplasmic reticulum
   ========================================================== */

export function createRoughER() {
  const group =
    new THREE.Group();

  group.name =
    "roughEndoplasmicReticulum";

  group.userData.type =
    "roughER";

  group.userData.organelleId =
    "roughER";

  group.userData.info = {
    title:
      "Rough Endoplasmic Reticulum",

    subtitle:
      "Protein synthesis network",

    summary:
      "A folded membrane network where ribosomes synthesize and begin processing proteins.",

    functions: [
      "Protein synthesis",
      "Protein folding",
      "Quality control",
      "Transport-vesicle formation",
    ],
  };

  /* ========================================================
     Materials
     ======================================================== */

  const surfaceMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x244f9f,

      transparent: true,
      opacity: 0.9,

      roughness: 0.34,
      metalness: 0,

      transmission: 0,

      clearcoat: 0.48,
      clearcoatRoughness: 0.28,

      emissive: 0x061a4f,
      emissiveIntensity: 0.24,

      side: THREE.DoubleSide,

      depthWrite: true,
      depthTest: true,
    });

  const edgeMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x3f71cc,

      emissive: 0x0a2e75,
      emissiveIntensity: 0.34,

      roughness: 0.3,
      metalness: 0,
    });

  const ribosomeMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xd9ad51,

      emissive: 0x5d3807,
      emissiveIntensity: 0.32,

      roughness: 0.42,
      metalness: 0,
    });

  const sheets = [];
  const sheetGroups = [];
  const ribosomes = [];

  /* ========================================================
     Concentric folded membrane sheets

     The folds wrap around most of the nucleus but
     leave an opening on the right toward the Golgi.
     ======================================================== */

  const sheetCount = 11;

  for (
    let index = 0;
    index < sheetCount;
    index += 1
  ) {
    const progress =
      index /
      (
        sheetCount - 1
      );

    const distanceFromMiddle =
      Math.abs(
        progress - 0.5
      ) * 2;

    const phase =
      index * 0.73;

    /*
     * Each outer layer sits farther from the nucleus.
     */
    const innerRadius =
      0.91 +
      index * 0.105;

    /*
     * Central layers are broader, while the innermost
     * and outermost layers are slightly narrower.
     */
    const width =
      0.17 +
      (
        1 -
        distanceFromMiddle
      ) *
        0.045;

    /*
     * A small stagger makes the open ends look naturally
     * irregular rather than perfectly aligned.
     */
    const startAngle =
      0.48 +
      distanceFromMiddle *
        0.08 +
      Math.sin(
        index * 1.21
      ) *
        0.045;

    const endAngle =
      5.82 -
      distanceFromMiddle *
        0.09 +
      Math.cos(
        index * 1.08
      ) *
        0.045;

    const sheetData = {
      startAngle,
      endAngle,
      innerRadius,
      width,

      yOffset:
        -0.035 +
        Math.sin(
          index * 0.82
        ) *
          0.025,

      /*
       * Keep the ER just behind the nucleus.
       */
      zPosition:
        -0.17 -
        progress * 0.035,

      verticalScale:
        0.76 +
        Math.sin(
          index * 0.55
        ) *
          0.018,

      waveCount:
        5.4 +
        (
          index % 3
        ) *
          0.55,

      waveStrength:
        0.027 +
        (
          index % 2
        ) *
          0.009,

      largeFoldStrength:
        0.028 +
        (
          index % 3
        ) *
          0.006,

      verticalWave:
        0.012 +
        (
          index % 2
        ) *
          0.007,

      depthWave:
        0.014 +
        (
          index % 3
        ) *
          0.004,

      phase,
    };

    const cisterna =
      createCisterna({
        sheetData,
        surfaceMaterial,
        edgeMaterial,
      });

    const layerGroup =
      cisterna.group;

    layerGroup.userData.phase =
      phase;

    layerGroup.userData.baseRotationZ =
      Math.sin(
        index * 0.68
      ) * 0.018;

    layerGroup.userData.basePositionZ =
      0;

    layerGroup.rotation.z =
      layerGroup.userData
        .baseRotationZ;

    /*
     * Dense ribosome coverage similar to the
     * rough ER in the target design.
     */
    const ribosomeCount =
      16 +
      (
        index % 5
      );

    attachRibosomesToSheet({
      sheetData,
      sheetIndex:
        index,

      count:
        ribosomeCount,

      material:
        ribosomeMaterial,

      parent:
        layerGroup,

      collection:
        ribosomes,
    });

    group.add(
      layerGroup
    );

    sheets.push(
      cisterna.surface
    );

    sheetGroups.push(
      layerGroup
    );
  }

  /* ========================================================
     Animation
     ======================================================== */

  function animate(
    elapsedTime
  ) {
    sheetGroups.forEach(
      (
        layerGroup,
        index
      ) => {
        const phase =
          layerGroup.userData
            .phase;

        /*
         * Extremely gentle membrane motion.
         * The ER should feel alive without wobbling.
         */
        layerGroup.rotation.z =
          layerGroup.userData
            .baseRotationZ +
          Math.sin(
            elapsedTime *
              0.14 +
            phase +
            index * 0.1
          ) *
            0.0035;

        layerGroup.position.z =
          layerGroup.userData
            .basePositionZ +
          Math.sin(
            elapsedTime *
              0.17 +
            phase
          ) *
            0.0025;
      }
    );

    ribosomes.forEach(
      (ribosome) => {
        const pulse =
          ribosome.userData
            .baseScale +
          Math.sin(
            elapsedTime *
              0.48 +
            ribosome.userData
              .phase
          ) *
            0.008;

        ribosome.scale.setScalar(
          pulse
        );
      }
    );
  }

  return {
    group,
    sheets,
    sheetGroups,
    ribosomes,
    animate,
  };
}