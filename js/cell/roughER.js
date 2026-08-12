import * as THREE from "three";

/* ==========================================================
   Deterministic pseudo-random helpers

   Keeps the rough ER identical after every refresh.
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
   Create organic horseshoe-style control points

   Instead of perfect concentric circles, each cisterna gets
   its own irregular path around the nucleus.
   ========================================================== */

function createOrganicArcPoints({
  index,
  radiusX,
  radiusY,
  startAngle,
  endAngle,
  xOffset = 0,
  yOffset = 0,
  zOffset = 0,
  pointCount = 9,
}) {
  const points = [];

  for (
    let pointIndex = 0;
    pointIndex < pointCount;
    pointIndex += 1
  ) {
    const progress =
      pointIndex /
      (pointCount - 1);

    const angle =
      THREE.MathUtils.lerp(
        startAngle,
        endAngle,
        progress
      );

    const seed =
      index * 100 +
      pointIndex * 17;

    /* Large irregular fold */

    const radialWave =
      Math.sin(
        progress *
          Math.PI *
          2.35 +
        index * 0.72
      ) *
      (
        0.055 +
        index * 0.002
      );

    /* Smaller local membrane variation */

    const randomWave =
      randomBetween(
        seed + 1,
        -0.045,
        0.045
      );

    const effectiveRadiusX =
      radiusX +
      radialWave +
      randomWave;

    const effectiveRadiusY =
      radiusY +
      radialWave * 0.65 +
      randomBetween(
        seed + 2,
        -0.025,
        0.025
      );

    let x =
      Math.cos(angle) *
        effectiveRadiusX +
      xOffset;

    let y =
      Math.sin(angle) *
        effectiveRadiusY +
      yOffset;

    /*
     * Uneven lateral folding.
     * This breaks the "perfect ring" appearance further.
     */

    x +=
      Math.sin(
        progress * Math.PI * 4 +
        index
      ) *
      0.035;

    y +=
      Math.sin(
        progress * Math.PI * 3.1 +
        index * 0.58
      ) *
      0.028;

    /*
     * Give the membrane some depth.
     */

    const z =
      zOffset +
      Math.sin(
        progress *
          Math.PI *
          2.6 +
        index * 0.83
      ) *
        0.045 +
      Math.cos(
        progress *
          Math.PI *
          5.2 +
        index
      ) *
        0.016;

    points.push(
      new THREE.Vector3(
        x,
        y,
        z
      )
    );
  }

  return points;
}


/* ==========================================================
   Sample a point across one cisterna

   widthProgress:
   0 = one membrane edge
   1 = opposite edge
   ========================================================== */

function getPointOnCisterna({
  curve,
  progress,
  widthProgress,
  width,
  phase = 0,
  surfaceOffset = 0,
}) {
  const center =
    curve.getPointAt(
      progress
    );

  const tangent =
    curve
      .getTangentAt(
        progress
      )
      .normalize();

  /*
   * Perpendicular direction within XY plane.
   */

  const lateral =
    new THREE.Vector3(
      -tangent.y,
      tangent.x,
      0
    ).normalize();

  /*
   * Taper near open membrane ends.
   */

  const taper =
    0.48 +
    Math.pow(
      Math.sin(
        progress *
        Math.PI
      ),
      0.55
    ) *
      0.52;

  /*
   * Slightly different width across the membrane.
   */

  const localWidth =
    width *
    taper *
    (
      1 +
      Math.sin(
        progress *
          Math.PI *
          3 +
        phase
      ) *
        0.08
    );

  const lateralDistance =
    (
      widthProgress -
      0.5
    ) *
    localWidth;

  const position =
    center
      .clone()
      .addScaledVector(
        lateral,
        lateralDistance
      );

  /*
   * Gentle bulge through the width of the cisterna.
   */

  const crossSection =
    Math.sin(
      widthProgress *
      Math.PI
    );

  position.z +=
    crossSection *
      0.025 +
    Math.sin(
      progress *
        Math.PI *
        4.1 +
      phase
    ) *
      crossSection *
      0.012 +
    surfaceOffset;

  return {
    position,
    tangent,
    lateral,
  };
}


/* ==========================================================
   Create broad cisterna surface
   ========================================================== */

function createMembraneSurface({
  curve,
  width,
  phase,
  material,
}) {
  const lengthSegments = 90;
  const widthSegments = 8;

  const positions = [];
  const indices = [];

  for (
    let lengthIndex = 0;
    lengthIndex <= lengthSegments;
    lengthIndex += 1
  ) {
    const progress =
      lengthIndex /
      lengthSegments;

    for (
      let widthIndex = 0;
      widthIndex <= widthSegments;
      widthIndex += 1
    ) {
      const widthProgress =
        widthIndex /
        widthSegments;

      const sample =
        getPointOnCisterna({
          curve,
          progress,
          widthProgress,
          width,
          phase,
        });

      positions.push(
        sample.position.x,
        sample.position.y,
        sample.position.z
      );
    }
  }

  const rowLength =
    widthSegments + 1;

  for (
    let lengthIndex = 0;
    lengthIndex < lengthSegments;
    lengthIndex += 1
  ) {
    for (
      let widthIndex = 0;
      widthIndex < widthSegments;
      widthIndex += 1
    ) {
      const a =
        lengthIndex *
          rowLength +
        widthIndex;

      const b =
        a + 1;

      const c =
        (
          lengthIndex + 1
        ) *
          rowLength +
        widthIndex;

      const d =
        c + 1;

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

  return surface;
}


/* ==========================================================
   Rounded membrane edge
   ========================================================== */

function createSheetEdge({
  curve,
  width,
  phase,
  widthProgress,
  radius,
  material,
}) {
  const points = [];

  const segments = 82;

  for (
    let index = 0;
    index <= segments;
    index += 1
  ) {
    const progress =
      index /
      segments;

    const sample =
      getPointOnCisterna({
        curve,
        progress,
        widthProgress,
        width,
        phase,
      });

    points.push(
      sample.position
    );
  }

  const edgeCurve =
    new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      0.45
    );

  const geometry =
    new THREE.TubeGeometry(
      edgeCurve,
      88,
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
   Create complete rough-ER cisterna
   ========================================================== */

function createCisterna({
  configuration,
  surfaceMaterial,
  edgeMaterial,
}) {
  const group =
    new THREE.Group();

  const curve =
    new THREE.CatmullRomCurve3(
      configuration.points,
      false,
      "catmullrom",
      0.45
    );

  const surface =
    createMembraneSurface({
      curve,
      width:
        configuration.width,

      phase:
        configuration.phase,

      material:
        surfaceMaterial,
    });

  const innerEdge =
    createSheetEdge({
      curve,

      width:
        configuration.width,

      phase:
        configuration.phase,

      widthProgress: 0,

      radius: 0.018,

      material:
        edgeMaterial,
    });

  const outerEdge =
    createSheetEdge({
      curve,

      width:
        configuration.width,

      phase:
        configuration.phase,

      widthProgress: 1,

      radius: 0.021,

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
    curve,
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
   Attach ribosomes
   ========================================================== */

function attachRibosomesToCisterna({
  configuration,
  curve,
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
      sheetIndex * 300 +
      index * 17;

    /*
     * Avoid the very ends.
     */

    const progress =
      randomBetween(
        seed + 1,
        0.06,
        0.94
      );

    const widthProgress =
      randomBetween(
        seed + 2,
        0.10,
        0.90
      );

    const sample =
      getPointOnCisterna({
        curve,

        progress,
        widthProgress,

        width:
          configuration.width,

        phase:
          configuration.phase,

        surfaceOffset: 0.035,
      });

    const ribosome =
      createRibosome(
        material
      );

    ribosome.position.copy(
      sample.position
    );

    /*
     * Approximate alignment with the membrane path.
     */

    const tangentAngle =
      Math.atan2(
        sample.tangent.y,
        sample.tangent.x
      );

    ribosome.rotation.set(
      randomBetween(
        seed + 3,
        -0.18,
        0.18
      ),

      randomBetween(
        seed + 4,
        -0.25,
        0.25
      ),

      tangentAngle
    );

    const scale =
      randomBetween(
        seed + 5,
        0.82,
        1.13
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
   Rough Endoplasmic Reticulum
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
      color: 0x174eae,

      transparent: true,
      opacity: 0.93,

      roughness: 0.28,
      metalness: 0,

      transmission: 0,

      clearcoat: 0.58,
      clearcoatRoughness: 0.21,

      emissive: 0x061d62,
      emissiveIntensity: 0.38,

      side:
        THREE.DoubleSide,

      depthWrite: true,
      depthTest: true,
    });


  const edgeMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x347bed,

      emissive: 0x0c3a99,
      emissiveIntensity: 0.48,

      roughness: 0.23,
      metalness: 0,

      clearcoat: 0.45,
      clearcoatRoughness: 0.22,
    });


  const ribosomeMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xd5ad4f,

      emissive: 0x674009,
      emissiveIntensity: 0.38,

      roughness: 0.38,
      metalness: 0,
    });


  const sheets = [];
  const sheetGroups = [];
  const ribosomes = [];


  /* ========================================================
     Organic cisternae

     These are NOT perfect concentric rings.

     Each membrane has:
     - its own radius
     - its own centre
     - different open ends
     - different depth
     - different vertical compression
     ======================================================== */

  const cisternaDefinitions = [
    {
      radiusX: 1.02,
      radiusY: 0.82,

      startAngle: 0.72,
      endAngle: 5.48,

      xOffset: -0.02,
      yOffset: 0.01,

      zOffset: -0.08,

      width: 0.19,
    },

    {
      radiusX: 1.14,
      radiusY: 0.91,

      startAngle: 0.64,
      endAngle: 5.38,

      xOffset: -0.07,
      yOffset: 0.035,

      zOffset: -0.105,

      width: 0.21,
    },

    {
      radiusX: 1.27,
      radiusY: 0.99,

      startAngle: 0.74,
      endAngle: 5.56,

      xOffset: -0.11,
      yOffset: -0.015,

      zOffset: -0.13,

      width: 0.22,
    },

    {
      radiusX: 1.40,
      radiusY: 1.06,

      startAngle: 0.59,
      endAngle: 5.34,

      xOffset: -0.13,
      yOffset: 0.025,

      zOffset: -0.15,

      width: 0.225,
    },

    {
      radiusX: 1.53,
      radiusY: 1.15,

      startAngle: 0.70,
      endAngle: 5.50,

      xOffset: -0.17,
      yOffset: -0.035,

      zOffset: -0.17,

      width: 0.22,
    },

    {
      radiusX: 1.67,
      radiusY: 1.22,

      startAngle: 0.55,
      endAngle: 5.28,

      xOffset: -0.19,
      yOffset: 0.015,

      zOffset: -0.19,

      width: 0.215,
    },

    {
      radiusX: 1.80,
      radiusY: 1.30,

      startAngle: 0.67,
      endAngle: 5.44,

      xOffset: -0.23,
      yOffset: -0.04,

      zOffset: -0.21,

      width: 0.20,
    },

    {
      radiusX: 1.92,
      radiusY: 1.37,

      startAngle: 0.51,
      endAngle: 5.20,

      xOffset: -0.26,
      yOffset: 0.035,

      zOffset: -0.23,

      width: 0.185,
    },
  ];


  cisternaDefinitions.forEach(
    (
      definition,
      index
    ) => {
      const phase =
        index * 0.79;

      const points =
        createOrganicArcPoints({
          index,

          radiusX:
            definition.radiusX,

          radiusY:
            definition.radiusY,

          startAngle:
            definition.startAngle,

          endAngle:
            definition.endAngle,

          xOffset:
            definition.xOffset,

          yOffset:
            definition.yOffset,

          zOffset:
            definition.zOffset,

          pointCount:
            9 +
            (index % 2),
        });


      const configuration = {
        ...definition,
        phase,
        points,
      };


      const cisterna =
        createCisterna({
          configuration,
          surfaceMaterial,
          edgeMaterial,
        });


      const layerGroup =
        cisterna.group;


      /* ------------------------------------------------------
         Tiny unique angle for every membrane.
         ------------------------------------------------------ */

      layerGroup.rotation.z =
        Math.sin(
          index * 1.17
        ) *
        0.026;


      layerGroup.rotation.x =
        Math.sin(
          index * 0.73
        ) *
        0.018;


      layerGroup.userData.phase =
        phase;


      layerGroup.userData.baseRotationZ =
        layerGroup.rotation.z;


      layerGroup.userData.baseRotationX =
        layerGroup.rotation.x;


      layerGroup.userData.basePositionZ =
        0;


      /*
       * Dense ribosome population.
       */

      const ribosomeCount =
        18 +
        (
          index % 4
        ) *
          2;


      attachRibosomesToCisterna({
        configuration,

        curve:
          cisterna.curve,

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
  );


  /* ========================================================
     A few shorter side folds

     These prevent the entire rough ER from reading as one
     giant horseshoe and make it feel like a true membrane
     network.
     ======================================================== */

  const sideFoldDefinitions = [
    {
      points: [
        new THREE.Vector3(
          -1.50,
          0.90,
          -0.12
        ),

        new THREE.Vector3(
          -1.80,
          0.74,
          -0.14
        ),

        new THREE.Vector3(
          -1.94,
          0.42,
          -0.16
        ),

        new THREE.Vector3(
          -1.88,
          0.12,
          -0.18
        ),
      ],

      width: 0.18,
    },

    {
      points: [
        new THREE.Vector3(
          -1.78,
          -0.10,
          -0.17
        ),

        new THREE.Vector3(
          -1.90,
          -0.39,
          -0.19
        ),

        new THREE.Vector3(
          -1.72,
          -0.72,
          -0.21
        ),

        new THREE.Vector3(
          -1.43,
          -0.90,
          -0.20
        ),
      ],

      width: 0.175,
    },

    {
      points: [
        new THREE.Vector3(
          -0.85,
          -1.20,
          -0.18
        ),

        new THREE.Vector3(
          -0.48,
          -1.38,
          -0.20
        ),

        new THREE.Vector3(
          -0.05,
          -1.42,
          -0.18
        ),

        new THREE.Vector3(
          0.34,
          -1.28,
          -0.16
        ),
      ],

      width: 0.17,
    },
  ];


  sideFoldDefinitions.forEach(
    (
      definition,
      sideIndex
    ) => {
      const index =
        cisternaDefinitions.length +
        sideIndex;

      const phase =
        index * 0.79;

      const configuration = {
        ...definition,
        phase,
      };


      const cisterna =
        createCisterna({
          configuration,
          surfaceMaterial,
          edgeMaterial,
        });


      const layerGroup =
        cisterna.group;


      layerGroup.userData.phase =
        phase;


      layerGroup.userData.baseRotationZ =
        Math.sin(
          index * 0.91
        ) *
        0.022;


      layerGroup.userData.baseRotationX =
        Math.cos(
          index * 0.68
        ) *
        0.014;


      layerGroup.rotation.z =
        layerGroup.userData
          .baseRotationZ;


      layerGroup.rotation.x =
        layerGroup.userData
          .baseRotationX;


      layerGroup.userData.basePositionZ =
        0;


      attachRibosomesToCisterna({
        configuration,

        curve:
          cisterna.curve,

        sheetIndex:
          index,

        count:
          12,

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
  );


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
         * Extremely subtle membrane motion.
         */

        layerGroup.rotation.z =
          layerGroup.userData
            .baseRotationZ +
          Math.sin(
            elapsedTime *
              0.13 +
            phase +
            index * 0.08
          ) *
            0.0027;


        layerGroup.rotation.x =
          layerGroup.userData
            .baseRotationX +
          Math.sin(
            elapsedTime *
              0.11 +
            phase
          ) *
            0.0018;


        layerGroup.position.z =
          layerGroup.userData
            .basePositionZ +
          Math.sin(
            elapsedTime *
              0.15 +
            phase
          ) *
            0.0022;
      }
    );


    ribosomes.forEach(
      (
        ribosome
      ) => {
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


  /* ========================================================
     Return API

     Same structure as the previous roughER.js so cell.js
     should not need to change.
     ======================================================== */

  return {
    group,
    sheets,
    sheetGroups,
    ribosomes,
    animate,
  };
}