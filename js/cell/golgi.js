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
   Rounded cisterna shape
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
   Create one organic Golgi cisterna

   The geometry begins as a flattened rounded sac and is
   then deformed into a curved, asymmetric membrane.
   ========================================================== */

function createCisterna({
  width,
  height,
  depth,
  bend,
  wave,
  twist,
  asymmetry,
  phase,
  material,
}) {
  const shape =
    createRoundedRectangleShape(
      width,
      height,
      height * 0.48
    );


  const geometry =
    new THREE.ExtrudeGeometry(
      shape,
      {
        depth,

        steps: 2,

        bevelEnabled: true,

        bevelSegments: 4,

        bevelSize:
          height * 0.16,

        bevelThickness:
          depth * 0.11,

        curveSegments: 28,
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
     * Strong Golgi bow:
     * centre sits lower while the ends curve upward.
     */

    const bow =
      Math.pow(
        Math.abs(normalizedX),
        1.55
      ) *
      bend;


    /*
     * Uneven membrane waviness.
     */

    const broadWave =
      Math.sin(
        normalizedX *
          Math.PI *
          1.55 +
        phase
      ) *
      wave;


    const smallWave =
      Math.sin(
        normalizedX *
          Math.PI *
          3.8 +
        phase * 1.7
      ) *
      wave *
      0.32;


    /*
     * Prevent perfectly symmetrical ends.
     */

    const asymmetricLift =
      normalizedX *
      asymmetry;


    /*
     * Gives the membrane depth when viewed from front.
     */

    const depthCurve =
      Math.sin(
        normalizedX *
          Math.PI *
          0.85 +
        phase * 0.3
      ) *
      twist;


    const depthRipple =
      Math.cos(
        normalizedX *
          Math.PI *
          2.4 +
        phase
      ) *
      wave *
      0.7;


    /*
     * Slightly pinch the centre.
     */

    const centreCompression =
      1 -
      (
        1 -
        Math.abs(normalizedX)
      ) *
      0.055;


    position.setXYZ(
      index,

      x,

      y *
        centreCompression +
        bow +
        broadWave +
        smallWave +
        asymmetricLift,

      z +
        depthCurve +
        depthRipple
    );
  }


  position.needsUpdate = true;


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
   Approximate cisterna end position
   ========================================================== */

function getCisternaEndPosition({
  side,
  width,
  bend,
  wave,
  twist,
  asymmetry,
  phase,
}) {
  const normalizedX =
    side < 0
      ? -1
      : 1;


  const x =
    normalizedX *
    width *
    0.5;


  const y =
    bend +
    Math.sin(
      normalizedX *
        Math.PI *
        1.55 +
      phase
    ) *
      wave +
    normalizedX *
      asymmetry;


  const z =
    Math.sin(
      normalizedX *
        Math.PI *
        0.85 +
      phase * 0.3
    ) *
      twist;


  return new THREE.Vector3(
    x,
    y,
    z
  );
}


/* ==========================================================
   Swollen Golgi cisterna end
   ========================================================== */

function createCisternaEnd({
  position,
  height,
  depth,
  material,
  scaleMultiplier = 1,
}) {
  const end =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        height * 0.68,
        20,
        20
      ),
      material
    );


  end.position.copy(
    position
  );


  end.scale.set(
    1.22 *
      scaleMultiplier,

    0.82 *
      scaleMultiplier,

    (
      depth /
      (height * 1.3)
    ) *
      scaleMultiplier
  );


  end.castShadow = true;


  return end;
}


/* ==========================================================
   Golgi vesicle
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
        24,
        24
      ),
      shellMaterial
    );


  shell.renderOrder = 4;


  group.add(
    shell
  );


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

        radius * 0.15,

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


    group.add(
      cargo
    );


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


  group.userData.organelleId =
    "golgi";


  group.userData.info = {
    title:
      "Golgi Apparatus",

    subtitle:
      "Protein processing and sorting",

    summary:
      "A stack of flattened membrane cisternae that modifies, sorts and packages proteins and lipids.",

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

      roughness: 0.25,

      metalness: 0,

      transmission: 0,

      clearcoat: 0.72,

      clearcoatRoughness: 0.18,

      emissive:
        0x54113f,

      emissiveIntensity:
        0.38,

      side:
        THREE.DoubleSide,
    });


  const edgeMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xf07bc7,

      emissive:
        0x741755,

      emissiveIntensity:
        0.52,

      roughness: 0.24,

      metalness: 0,

      clearcoat: 0.65,

      clearcoatRoughness:
        0.18,
    });


  const vesicleMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xeb8ccc,

      transparent: true,

      opacity: 0.72,

      roughness: 0.18,

      metalness: 0,

      transmission: 0.14,

      thickness: 0.1,

      clearcoat: 0.78,

      clearcoatRoughness:
        0.16,

      depthWrite: false,
    });


  const cargoMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xd76cff,

      emissive:
        0x7b26ff,

      emissiveIntensity:
        1.15,

      roughness: 0.22,
    });


  const cisternae = [];

  const cisternaGroups = [];

  const vesicles = [];

  const cargoParticles = [];


/* ========================================================
   Organic Golgi stack

   Fewer, thicker cisternae than before.

   This makes the stack look more like the target model
   instead of seven thin parallel pink bars.
   ======================================================== */

  const layerDefinitions = [
    {
      width: 1.28,
      height: 0.16,
      depth: 0.24,

      bend: 0.17,
      wave: 0.020,
      twist: 0.075,
      asymmetry: -0.016,

      x: -0.07,
      y: 0.47,
      z: -0.10,

      rotationZ: -0.055,
      rotationY: 0.055,
    },

    {
      width: 1.47,
      height: 0.17,
      depth: 0.255,

      bend: 0.20,
      wave: 0.023,
      twist: 0.085,
      asymmetry: 0.010,

      x: -0.035,
      y: 0.27,
      z: -0.055,

      rotationZ: -0.030,
      rotationY: 0.030,
    },

    {
      width: 1.62,
      height: 0.18,
      depth: 0.27,

      bend: 0.235,
      wave: 0.025,
      twist: 0.095,
      asymmetry: -0.008,

      x: 0,
      y: 0.055,
      z: 0,

      rotationZ: -0.008,
      rotationY: 0.008,
    },

    {
      width: 1.68,
      height: 0.18,
      depth: 0.28,

      bend: 0.25,
      wave: 0.027,
      twist: 0.105,
      asymmetry: 0.014,

      x: 0.025,
      y: -0.17,
      z: 0.045,

      rotationZ: 0.016,
      rotationY: -0.018,
    },

    {
      width: 1.55,
      height: 0.17,
      depth: 0.275,

      bend: 0.225,
      wave: 0.024,
      twist: 0.10,
      asymmetry: -0.014,

      x: 0.055,
      y: -0.39,
      z: 0.09,

      rotationZ: 0.040,
      rotationY: -0.04,
    },

    {
      width: 1.34,
      height: 0.16,
      depth: 0.255,

      bend: 0.195,
      wave: 0.021,
      twist: 0.085,
      asymmetry: 0.018,

      x: 0.09,
      y: -0.59,
      z: 0.12,

      rotationZ: 0.065,
      rotationY: -0.06,
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
          width:
            definition.width,

          height:
            definition.height,

          depth:
            definition.depth,

          bend:
            definition.bend,

          wave:
            definition.wave,

          twist:
            definition.twist,

          asymmetry:
            definition.asymmetry,

          phase,

          material:
            cisternaMaterial,
        });


      layerGroup.add(
        cisterna
      );


      /* ----------------------------------------------------
         Bulbous cisterna ends
         ---------------------------------------------------- */

      const leftPosition =
        getCisternaEndPosition({
          side: -1,

          width:
            definition.width,

          bend:
            definition.bend,

          wave:
            definition.wave,

          twist:
            definition.twist,

          asymmetry:
            definition.asymmetry,

          phase,
        });


      const rightPosition =
        getCisternaEndPosition({
          side: 1,

          width:
            definition.width,

          bend:
            definition.bend,

          wave:
            definition.wave,

          twist:
            definition.twist,

          asymmetry:
            definition.asymmetry,

          phase,
        });


      const leftEnd =
        createCisternaEnd({
          position:
            leftPosition,

          height:
            definition.height,

          depth:
            definition.depth,

          material:
            edgeMaterial,

          scaleMultiplier:
            0.96,
        });


      const rightEnd =
        createCisternaEnd({
          position:
            rightPosition,

          height:
            definition.height,

          depth:
            definition.depth,

          material:
            edgeMaterial,

          scaleMultiplier:
            1.12,
        });


      layerGroup.add(
        leftEnd,
        rightEnd
      );


      /* ----------------------------------------------------
         Layer placement
         ---------------------------------------------------- */

      layerGroup.position.set(
        definition.x,
        definition.y,
        definition.z
      );


      layerGroup.rotation.z =
        definition.rotationZ;


      layerGroup.rotation.y =
        definition.rotationY;


      layerGroup.rotation.x =
        Math.sin(
          index * 0.72
        ) *
        0.022;


      layerGroup.userData.baseX =
        definition.x;


      layerGroup.userData.baseY =
        definition.y;


      layerGroup.userData.baseZ =
        definition.z;


      layerGroup.userData.baseRotationZ =
        definition.rotationZ;


      layerGroup.userData.baseRotationY =
        definition.rotationY;


      layerGroup.userData.phase =
        phase;


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
  );


  /* ========================================================
     Golgi vesicles

     More concentrated around the cisterna ends, particularly
     on the trans side.
     ======================================================== */

  const vesicleConfigurations = [
    {
      position:
        new THREE.Vector3(
          -0.92,
          0.46,
          0.12
        ),

      radius: 0.11,
      cargoCount: 4,
    },

    {
      position:
        new THREE.Vector3(
          -1.02,
          0.08,
          0.17
        ),

      radius: 0.09,
      cargoCount: 3,
    },

    {
      position:
        new THREE.Vector3(
          -0.92,
          -0.42,
          0.12
        ),

      radius: 0.10,
      cargoCount: 3,
    },

    {
      position:
        new THREE.Vector3(
          0.91,
          0.55,
          0.19
        ),

      radius: 0.12,
      cargoCount: 5,
    },

    {
      position:
        new THREE.Vector3(
          1.03,
          0.22,
          0.25
        ),

      radius: 0.105,
      cargoCount: 4,
    },

    {
      position:
        new THREE.Vector3(
          1.08,
          -0.12,
          0.22
        ),

      radius: 0.13,
      cargoCount: 5,
    },

    {
      position:
        new THREE.Vector3(
          0.98,
          -0.50,
          0.16
        ),

      radius: 0.115,
      cargoCount: 4,
    },

    {
      position:
        new THREE.Vector3(
          0.70,
          -0.78,
          0.08
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
       Gentle membrane motion
       ------------------------------------------------------ */

    cisternaGroups.forEach(
      (
        layerGroup,
        index
      ) => {
        const phase =
          layerGroup.userData
            .phase;


        layerGroup.position.x =
          layerGroup.userData
            .baseX +
          Math.sin(
            elapsedTime *
              0.16 +
            phase
          ) *
            0.004;


        layerGroup.position.y =
          layerGroup.userData
            .baseY +
          Math.sin(
            elapsedTime *
              0.22 +
            phase
          ) *
            0.006;


        layerGroup.position.z =
          layerGroup.userData
            .baseZ +
          Math.cos(
            elapsedTime *
              0.19 +
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
      }
    );


    /* ------------------------------------------------------
       Vesicle floating
       ------------------------------------------------------ */

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


    /* ------------------------------------------------------
       Cargo motion
       ------------------------------------------------------ */

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


  /* ========================================================
     Return API

     Kept compatible with your existing cell.js.
     ======================================================== */

  return {
    group,
    cisternae,
    cisternaGroups,
    vesicles,
    cargoParticles,
    animate,
  };
}