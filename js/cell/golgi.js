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


/* ==========================================================
   Create one curved, ring-like Golgi cisterna

   Built from a closed curve so the geometry reads as a
   rounded, tube-like band rather than a flat extruded
   rectangle, matching the reference design.
   ========================================================== */

function createCisterna({
  radius,
  tubeRadius,
  arc,
  waviness,
  twist,
  phase,
  material,
}) {
  const segments = 64;

  const points = [];


  for (
    let index = 0;
    index <= segments;
    index += 1
  ) {
    const progress =
      index / segments;


    const angle =
      -arc * 0.5 +
      arc * progress;


    /*
     * Base ring shape.
     */

    const baseX =
      Math.sin(angle) *
      radius;


    const baseZ =
      (
        Math.cos(angle) -
        1
      ) *
      radius *
      0.35;


    /*
     * Organic waviness so the band isn't a perfect
     * mathematical ring.
     */

    const waveY =
      Math.sin(
        progress *
          Math.PI *
          3.4 +
        phase
      ) *
      waviness;


    const waveTwist =
      Math.cos(
        progress *
          Math.PI *
          2.1 +
        phase * 1.3
      ) *
      twist;


    points.push(
      new THREE.Vector3(
        baseX,
        waveY,
        baseZ +
          waveTwist
      )
    );
  }


  const curve =
    new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      0.5
    );


  const geometry =
    new THREE.TubeGeometry(
      curve,

      Math.round(
        segments * 1.1
      ),

      tubeRadius,

      14,

      false
    );


  geometry.computeVertexNormals();


  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );


  mesh.castShadow = true;
  mesh.receiveShadow = true;


  return {
    mesh,
    curve,
  };
}


/* ==========================================================
   Swollen end cap

   Placed at the open end of each curved band so it reads
   as a rounded, bulbous terminus rather than an abrupt cut.
   ========================================================== */

function createCisternaEnd({
  position,
  radius,
  material,
}) {
  const end =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        radius,
        18,
        18
      ),
      material
    );


  end.position.copy(
    position
  );


  end.castShadow = true;


  return end;
}


/* ==========================================================
   Golgi vesicle cluster

   Several small vesicles grouped tightly together rather
   than single particles spread individually, matching the
   dense clusters seen in the reference image.
   ========================================================== */

function createVesicleCluster({
  vesicleCount,
  spread,
  shellMaterial,
  seed,
}) {
  const group =
    new THREE.Group();


  const vesicles = [];


  for (
    let index = 0;
    index < vesicleCount;
    index += 1
  ) {
    const localSeed =
      seed * 40 +
      index;


    const vesicleRadius =
      randomBetween(
        localSeed + 1,

        0.045,

        0.085
      );


    const vesicle =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          vesicleRadius,

          16,

          16
        ),

        shellMaterial
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
  direction.lengthSq() < 0.001
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

        spread
      );


    vesicle.position.copy(
      direction.multiplyScalar(
        distance
      )
    );


    vesicle.userData.basePosition =
      vesicle.position.clone();


    vesicle.userData.phase =
      randomBetween(
        localSeed + 6,

        0,

        Math.PI * 2
      );


    vesicle.castShadow = true;


    group.add(
      vesicle
    );


    vesicles.push(
      vesicle
    );
  }


  return {
    group,
    vesicles,
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
      "A stack of curved, tube-like cisternae that modifies, sorts and packages proteins and lipids.",

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
      color: 0xd35ca8,

      transparent: true,

      opacity: 0.96,

      roughness: 0.24,

      metalness: 0,

      transmission: 0,

      clearcoat: 0.75,

      clearcoatRoughness: 0.16,

      emissive:
        0x54113f,

      emissiveIntensity:
        0.4,

      side:
        THREE.DoubleSide,
    });


  const endMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xf07bc7,

      emissive:
        0x741755,

      emissiveIntensity:
        0.55,

      roughness: 0.22,

      metalness: 0,

      clearcoat: 0.68,

      clearcoatRoughness:
        0.16,
    });


  /*
   * Darker, more saturated purple than before,
   * matching the reference vesicle clusters.
   */

  const vesicleMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x8b3fb8,

      transparent: true,

      opacity: 0.9,

      roughness: 0.2,

      metalness: 0,

      transmission: 0.06,

      thickness: 0.12,

      clearcoat: 0.8,

      clearcoatRoughness:
        0.14,

      emissive:
        0x4a1670,

      emissiveIntensity:
        0.5,
    });


  const cisternae = [];

  const cisternaGroups = [];

  const vesicleClusters = [];

  const allVesicles = [];


  /* ========================================================
     Curved cisterna stack

     Six curved, tube-like bands arranged as a staggered,
     folded stack rather than near-concentric rings. Each
     layer has its own arc length, its own xOffset/zOffset,
     and its own rotationX so the bands overlap and tilt
     against each other the way folded membrane actually
     would, instead of reading as flat parallel stacking.
     ======================================================== */

  const layerDefinitions = [
    {
      radius: 0.58,
      tubeRadius: 0.072,
      arc: Math.PI * 0.92,
      waviness: 0.045,
      twist: 0.09,

      y: 0.48,
      xOffset: 0.06,
      zOffset: -0.04,

      rotationZ: -0.08,
      rotationY: 0.14,
      rotationX: 0.10,
    },

    {
      radius: 0.66,
      tubeRadius: 0.078,
      arc: Math.PI * 1.05,
      waviness: 0.05,
      twist: 0.075,

      y: 0.29,
      xOffset: 0.02,
      zOffset: -0.01,

      rotationZ: -0.04,
      rotationY: 0.08,
      rotationX: 0.05,
    },

    {
      radius: 0.74,
      tubeRadius: 0.084,
      arc: Math.PI * 1.18,
      waviness: 0.04,
      twist: 0.06,

      y: 0.08,
      xOffset: -0.03,
      zOffset: 0.02,

      rotationZ: -0.01,
      rotationY: 0.02,
      rotationX: -0.02,
    },

    {
      radius: 0.76,
      tubeRadius: 0.084,
      arc: Math.PI * 1.1,
      waviness: 0.042,
      twist: 0.065,

      y: -0.13,
      xOffset: -0.07,
      zOffset: 0.04,

      rotationZ: 0.02,
      rotationY: -0.05,
      rotationX: -0.06,
    },

    {
      radius: 0.7,
      tubeRadius: 0.079,
      arc: Math.PI * 0.98,
      waviness: 0.05,
      twist: 0.08,

      y: -0.34,
      xOffset: -0.10,
      zOffset: 0.05,

      rotationZ: 0.06,
      rotationY: -0.11,
      rotationX: -0.10,
    },

    {
      radius: 0.6,
      tubeRadius: 0.072,
      arc: Math.PI * 0.85,
      waviness: 0.055,
      twist: 0.1,

      y: -0.53,
      xOffset: -0.13,
      zOffset: 0.06,

      rotationZ: 0.1,
      rotationY: -0.16,
      rotationX: -0.14,
    },
  ];


  layerDefinitions.forEach(
    (
      definition,
      index
    ) => {
      const phase =
        index * 0.83;


      const layerGroup =
        new THREE.Group();


      const cisterna =
        createCisterna({
          radius:
            definition.radius,

          tubeRadius:
            definition.tubeRadius,

          arc:
            definition.arc,

          waviness:
            definition.waviness,

          twist:
            definition.twist,

          phase,

          material:
            cisternaMaterial,
        });


      layerGroup.add(
        cisterna.mesh
      );


      /* ----------------------------------------------------
         Bulbous ends at both open tips of the curved band
         ---------------------------------------------------- */

      const startPoint =
        cisterna.curve.getPoint(
          0
        );


      const endPoint =
        cisterna.curve.getPoint(
          1
        );


      const startEnd =
        createCisternaEnd({
          position:
            startPoint,

          radius:
            definition.tubeRadius *
            1.35,

          material:
            endMaterial,
        });


      const endEnd =
        createCisternaEnd({
          position:
            endPoint,

          radius:
            definition.tubeRadius *
            1.5,

          material:
            endMaterial,
        });


      layerGroup.add(
        startEnd,
        endEnd
      );


      /* ----------------------------------------------------
         Layer placement

         xOffset/zOffset stagger each layer sideways instead
         of sharing one central axis, and rotationX is now an
         explicit per-layer value rather than a shared tiny
         wobble, so the stack folds rather than just stacks.
         ---------------------------------------------------- */

      layerGroup.position.set(
        -0.05 + definition.xOffset,
        definition.y,
        definition.zOffset
      );


      layerGroup.rotation.z =
        definition.rotationZ;


      layerGroup.rotation.y =
        definition.rotationY;


      layerGroup.rotation.x =
        definition.rotationX;


      layerGroup.userData.baseY =
        definition.y;


      layerGroup.userData.baseRotationZ =
        definition.rotationZ;


      layerGroup.userData.baseRotationY =
        definition.rotationY;


      layerGroup.userData.baseRotationX =
        definition.rotationX;


      layerGroup.userData.phase =
        phase;


      group.add(
        layerGroup
      );


      cisternae.push(
        cisterna.mesh
      );


      cisternaGroups.push(
        layerGroup
      );
    }
  );


  /* ========================================================
     Vesicle clusters

     Dense clumps of small vesicles positioned around the
     stack, especially near the trans (secretion) side,
     matching the reference image's tight groupings.
     ======================================================== */

  const clusterConfigurations = [
    {
      position:
        new THREE.Vector3(
          -0.68,
          0.4,
          0.18
        ),

      vesicleCount: 5,
      spread: 0.13,
    },

    {
      position:
        new THREE.Vector3(
          -0.78,
          0.02,
          0.22
        ),

      vesicleCount: 4,
      spread: 0.11,
    },

    {
      position:
        new THREE.Vector3(
          -0.7,
          -0.38,
          0.18
        ),

      vesicleCount: 4,
      spread: 0.12,
    },

    {
      position:
        new THREE.Vector3(
          0.7,
          0.5,
          0.24
        ),

      vesicleCount: 6,
      spread: 0.15,
    },

    {
      position:
        new THREE.Vector3(
          0.82,
          0.16,
          0.3
        ),

      vesicleCount: 5,
      spread: 0.13,
    },

    {
      position:
        new THREE.Vector3(
          0.86,
          -0.16,
          0.27
        ),

      vesicleCount: 6,
      spread: 0.15,
    },

    {
      position:
        new THREE.Vector3(
          0.74,
          -0.46,
          0.2
        ),

      vesicleCount: 5,
      spread: 0.13,
    },

    {
      position:
        new THREE.Vector3(
          0.5,
          -0.7,
          0.12
        ),

      vesicleCount: 3,
      spread: 0.1,
    },
  ];


  clusterConfigurations.forEach(
    (
      configuration,
      index
    ) => {
      const cluster =
        createVesicleCluster({
          vesicleCount:
            configuration.vesicleCount,

          spread:
            configuration.spread,

          shellMaterial:
            vesicleMaterial,

          seed:
            index + 1,
        });


      cluster.group.position.copy(
        configuration.position
      );


      cluster.group.userData
        .basePosition =
        configuration
          .position
          .clone();


      cluster.group.userData.phase =
        index * 1.17;


      group.add(
        cluster.group
      );


      vesicleClusters.push(
        cluster.group
      );


      allVesicles.push(
        ...cluster.vesicles
      );
    }
  );


  /* ========================================================
     Slight 3D presentation angle
     ======================================================== */

  group.rotation.set(
    -0.055,
    -0.10,
    -0.025
  );


  /* ========================================================
     Animation
     ======================================================== */

  function animate(
    elapsedTime
  ) {

    /* ------------------------------------------------------
       Gentle band motion

       rotation.x now animates around each layer's own
       baseRotationX (set from layerDefinitions) instead of
       ignoring it, so the fold angle is preserved at rest.
       ------------------------------------------------------ */

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
              0.22 +
            phase
          ) *
            0.006;


        layerGroup.rotation.z =
          layerGroup.userData
            .baseRotationZ +
          Math.sin(
            elapsedTime *
              0.18 +
            phase +
            index * 0.12
          ) *
            0.004;


        layerGroup.rotation.y =
          layerGroup.userData
            .baseRotationY +
          Math.cos(
            elapsedTime *
              0.15 +
            phase
          ) *
            0.003;


        layerGroup.rotation.x =
          layerGroup.userData
            .baseRotationX +
          Math.sin(
            elapsedTime *
              0.16 +
            phase
          ) *
            0.004;
      }
    );


    /* ------------------------------------------------------
       Cluster floating
       ------------------------------------------------------ */

    vesicleClusters.forEach(
      (
        cluster,
        index
      ) => {
        const base =
          cluster.userData
            .basePosition;


        const phase =
          cluster.userData
            .phase;


        cluster.position.set(
          base.x +
            Math.sin(
              elapsedTime *
                0.4 +
              phase
            ) *
              0.016,

          base.y +
            Math.cos(
              elapsedTime *
                0.34 +
              phase
            ) *
              0.013,

          base.z +
            Math.sin(
              elapsedTime *
                0.46 +
              phase +
              index * 0.2
            ) *
              0.011
        );


        cluster.rotation.y =
          elapsedTime *
          (
            0.04 +
            index * 0.003
          );
      }
    );


    /* ------------------------------------------------------
       Individual vesicle jitter within each cluster
       ------------------------------------------------------ */

    allVesicles.forEach(
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
                0.7 +
              phase
            ) *
              0.008,

          base.y +
            Math.cos(
              elapsedTime *
                0.62 +
              phase
            ) *
              0.008,

          base.z +
            Math.sin(
              elapsedTime *
                0.58 +
              phase +
              index * 0.05
            ) *
              0.006
        );


        const pulse =
          0.9 +
          Math.sin(
            elapsedTime *
              1.05 +
            phase
          ) *
            0.08;


        vesicle.scale.setScalar(
          pulse
        );
      }
    );
  }


  /* ========================================================
     Return API

     Kept compatible with your existing cell.js
     (cargoParticles is now the flattened vesicle list).
     ======================================================== */

  return {
    group,
    cisternae,
    cisternaGroups,
    vesicles: vesicleClusters,
    cargoParticles: allVesicles,
    animate,
  };
}
