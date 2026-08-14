import * as THREE from "three";


/* ==========================================================
   Organic membrane deformation

   Creates a broad, slightly irregular animal-cell shape
   rather than a perfect mathematical ellipsoid.
   ========================================================== */

function deformGeometry(
  geometry
) {
  const position =
    geometry.attributes.position;


  const originalPositions =
    new Float32Array(
      position.array
    );


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
      .copy(
        vertex
      )
      .normalize();


    /* ------------------------------------------------------
       Large-scale organic variation
       ------------------------------------------------------ */

    const waveOne =
      Math.sin(
        direction.x * 3.1 +
        direction.y * 2.0 -
        direction.z * 1.5
      ) *
      0.075;


    const waveTwo =
      Math.sin(
        direction.z * 4.2 -
        direction.x * 2.6 +
        direction.y * 0.8
      ) *
      0.045;


    const waveThree =
      Math.cos(
        direction.y * 5.4 +
        direction.z * 2.8
      ) *
      0.028;


    /* ------------------------------------------------------
       Gentle asymmetric bulges

       Prevent the silhouette from looking perfectly
       computer-generated.
       ------------------------------------------------------ */

    const rightBulge =
      Math.max(
        direction.x,
        0
      ) *
      Math.sin(
        direction.y * 2.8 +
        direction.z
      ) *
      0.035;


    const leftVariation =
      Math.max(
        -direction.x,
        0
      ) *
      Math.cos(
        direction.y * 3.2 -
        direction.z * 1.4
      ) *
      0.025;


    const deformation =
      waveOne +
      waveTwo +
      waveThree +
      rightBulge +
      leftVariation;


    vertex.addScaledVector(
      direction,
      deformation
    );


    position.setXYZ(
      index,
      vertex.x,
      vertex.y,
      vertex.z
    );
  }


  position.needsUpdate =
    true;


  geometry.computeVertexNormals();


  geometry.computeBoundingSphere();


  return {
    position,
    originalPositions,
  };
}


/* ==========================================================
   Primary cyan rim

   Keeps the bright biological edge from the reference,
   but avoids turning the whole membrane into neon.
   ========================================================== */

function createRimMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      rimColor: {
        value:
          new THREE.Color(
            0x6cdcff
          ),
      },


      rimStrength: {
        value:
          0.64,
      },


      rimPower: {
        value:
          3.2,
      },
    },


    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;


      void main() {
        vec4 worldPosition =
          modelMatrix *
          vec4(
            position,
            1.0
          );


        vWorldPosition =
          worldPosition.xyz;


        vNormal =
          normalize(
            mat3(
              modelMatrix
            ) *
            normal
          );


        gl_Position =
          projectionMatrix *
          viewMatrix *
          worldPosition;
      }
    `,


    fragmentShader: `
      uniform vec3 rimColor;
      uniform float rimStrength;
      uniform float rimPower;

      varying vec3 vNormal;
      varying vec3 vWorldPosition;


      void main() {
        vec3 viewDirection =
          normalize(
            cameraPosition -
            vWorldPosition
          );


        float rim =
          1.0 -
          max(
            dot(
              normalize(
                vNormal
              ),
              viewDirection
            ),
            0.0
          );


        rim =
          pow(
            rim,
            rimPower
          );


        float alpha =
          rim *
          0.12;


        gl_FragColor =
          vec4(
            rimColor *
            rimStrength,
            alpha
          );
      }
    `,


    transparent:
      true,


    blending:
      THREE.AdditiveBlending,


    depthWrite:
      false,


    depthTest:
      true,


    side:
      THREE.FrontSide,
  });
}


/* ==========================================================
   Secondary soft halo
   ========================================================== */

function createHaloMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      haloColor: {
        value:
          new THREE.Color(
            0x1d8fb9
          ),
      },


      haloStrength: {
        value:
          0.25,
      },


      haloPower: {
        value:
          1.85,
      },
    },


    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;


      void main() {
        vec4 worldPosition =
          modelMatrix *
          vec4(
            position,
            1.0
          );


        vWorldPosition =
          worldPosition.xyz;


        vNormal =
          normalize(
            mat3(
              modelMatrix
            ) *
            normal
          );


        gl_Position =
          projectionMatrix *
          viewMatrix *
          worldPosition;
      }
    `,


    fragmentShader: `
      uniform vec3 haloColor;
      uniform float haloStrength;
      uniform float haloPower;

      varying vec3 vNormal;
      varying vec3 vWorldPosition;


      void main() {
        vec3 viewDirection =
          normalize(
            cameraPosition -
            vWorldPosition
          );


        float halo =
          1.0 -
          max(
            dot(
              normalize(
                vNormal
              ),
              viewDirection
            ),
            0.0
          );


        halo =
          pow(
            halo,
            haloPower
          );


        gl_FragColor =
          vec4(
            haloColor *
            haloStrength,

            halo *
            0.035
          );
      }
    `,


    transparent:
      true,


    blending:
      THREE.AdditiveBlending,


    depthWrite:
      false,


    depthTest:
      true,


    side:
      THREE.FrontSide,
  });
}


/* ==========================================================
   Membrane protein

   Small ring + cap suggesting an embedded membrane channel.
   ========================================================== */

function createMembraneProtein(
  material
) {
  const group =
    new THREE.Group();


  const channel =
    new THREE.Mesh(
      new THREE.TorusGeometry(
        0.026,
        0.008,
        8,
        14
      ),

      material
    );


  const cap =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.014,
        8,
        8
      ),

      material
    );


  cap.position.z =
    0.012;


  group.add(
    channel,
    cap
  );


  return group;
}


/* ==========================================================
   Membrane protein field
   ========================================================== */

function createMembraneProteins({
  geometryRadius,
  count = 90,
}) {
  const group =
    new THREE.Group();


  group.name =
    "membraneProteins";


  const material =
    new THREE.MeshStandardMaterial({
      color:
        0x4fd6e8,


      emissive:
        0x0f4a56,


      emissiveIntensity:
        0.30,


      roughness:
        0.36,


      metalness:
        0,


      transparent:
        true,


      opacity:
        0.48,
    });


  const proteins = [];


  const goldenAngle =
    Math.PI *
    (
      3 -
      Math.sqrt(
        5
      )
    );


  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const vertical =
      1 -
      (
        index /
        (
          count - 1
        )
      ) *
      2;


    const horizontalRadius =
      Math.sqrt(
        Math.max(
          0,

          1 -
          vertical *
          vertical
        )
      );


    const theta =
      goldenAngle *
      index;


    const normal =
      new THREE.Vector3(
        Math.cos(
          theta
        ) *
        horizontalRadius,

        vertical,

        Math.sin(
          theta
        ) *
        horizontalRadius
      )
        .normalize();


    /*
     * Local membrane coordinates.
     *
     * The parent membrane applies the ellipsoid scale later,
     * so we do NOT apply membrane.scale here again.
     */

    const proteinPosition =
      normal
        .clone()
        .multiplyScalar(
          geometryRadius *
          1.003
        );


    const protein =
      createMembraneProtein(
        material
      );


    protein.position.copy(
      proteinPosition
    );


    protein.quaternion
      .setFromUnitVectors(
        new THREE.Vector3(
          0,
          0,
          1
        ),

        normal
      );


    protein.userData.phase =
      (
        index *
        0.71
      ) %
      (
        Math.PI *
        2
      );


    group.add(
      protein
    );


    proteins.push(
      protein
    );
  }


  return {
    group,
    proteins,
  };
}


/* ==========================================================
   Cell membrane
   ========================================================== */

export function createMembrane(
  environmentMap = null
) {

  /* ========================================================
     Base geometry
     ======================================================== */

  const geometry =
    new THREE.SphereGeometry(
      3,
      112,
      96
    );


  const {
    position,
    originalPositions,
  } =
    deformGeometry(
      geometry
    );


  /* ========================================================
     Wet biological membrane

     IMPORTANT:

     This intentionally uses only a SMALL amount of optical
     transmission.

     The wet appearance comes mainly from:
     - clearcoat
     - specular reflection
     - low/moderate roughness
     - restrained environment reflection

     rather than making the cell behave like glass.
     ======================================================== */

  const material =
    new THREE.MeshPhysicalMaterial({

      /* ----------------------------------------------------
         Deep cyan-blue membrane base
         ---------------------------------------------------- */

      color:
        0x073348,


      /* ----------------------------------------------------
         Reflection environment

         Strong enough to catch soft reflections,
         weak enough to avoid the snow-globe effect.
         ---------------------------------------------------- */

      envMap:
        environmentMap,


      envMapIntensity:
        0.24,


      /* ----------------------------------------------------
         Transparency

         The membrane remains visually thin and transparent.
         ---------------------------------------------------- */

      transparent:
        true,


      opacity:
        0.11,


      /* ----------------------------------------------------
         Very small physical transmission

         This is deliberately MUCH lower than the previous
         glass-like version.
         ---------------------------------------------------- */

      transmission:
        0.04,


      thickness:
        0.08,


      ior:
        1.33,


      /* ----------------------------------------------------
         Surface wetness

         Clearcoat produces the glossy wet skin while
         roughness keeps reflections soft.
         ---------------------------------------------------- */

      roughness:
        0.22,


      metalness:
        0,


      clearcoat:
        0.90,


      clearcoatRoughness:
        0.12,


      /* ----------------------------------------------------
         Controlled cool specular highlights
         ---------------------------------------------------- */

      specularIntensity:
        0.45,


      specularColor:
        new THREE.Color(
          0x9cecff
        ),


      /* ----------------------------------------------------
         Very subtle internal tint
         ---------------------------------------------------- */

      emissive:
        new THREE.Color(
          0x001018
        ),


      emissiveIntensity:
        0.025,


      /* ----------------------------------------------------
         Rendering
         ---------------------------------------------------- */

      side:
        THREE.FrontSide,


      depthWrite:
        false,


      depthTest:
        true,
    });


  const membrane =
    new THREE.Mesh(
      geometry,
      material
    );


  /* ========================================================
     Animal-cell silhouette

     Wide, somewhat flattened animal-cell shape.
     ======================================================== */

  membrane.scale.set(
    1.22,
    0.82,
    0.94
  );


  membrane.rotation.z =
    -0.018;


  /* ========================================================
     Membrane proteins
     ======================================================== */

  const membraneProteins =
    createMembraneProteins({
      geometryRadius:
        3,

      count:
        90,
    });


  membraneProteins
    .group
    .renderOrder =
    8;


  membrane.add(
    membraneProteins.group
  );


  /* ========================================================
     Broad outer halo
     ======================================================== */

  const haloGlow =
    new THREE.Mesh(
      geometry.clone(),
      createHaloMaterial()
    );


  haloGlow.scale.setScalar(
    1.022
  );


  haloGlow.renderOrder =
    9;


  membrane.add(
    haloGlow
  );


  /* ========================================================
     Fine cyan silhouette rim
     ======================================================== */

  const rimGlow =
    new THREE.Mesh(
      geometry.clone(),
      createRimMaterial()
    );


  rimGlow.scale.setScalar(
    1.008
  );


  rimGlow.renderOrder =
    11;


  membrane.add(
    rimGlow
  );


  /* ========================================================
     Metadata
     ======================================================== */

  membrane.userData.type =
    "cellMembrane";


  membrane.userData.organelleId =
    "cellMembrane";


  membrane.userData.organelleName =
    "Cell Membrane";


  membrane.userData.description =
    "The cell membrane controls which substances enter and leave the cell.";


  /* --------------------------------------------------------
     Geometry data
     -------------------------------------------------------- */

  membrane.userData.originalPositions =
    originalPositions;


  membrane.userData.geometryPosition =
    position;


  /* --------------------------------------------------------
     Animation baseline
     -------------------------------------------------------- */

  membrane.userData.baseScale =
    membrane.scale.clone();


  /* --------------------------------------------------------
     Material baseline

     Used by Cutaway mode in main.js.
     -------------------------------------------------------- */

  membrane.userData.baseTransmission =
    material.transmission;


  membrane.userData.baseEnvMapIntensity =
    material.envMapIntensity;


  membrane.userData.baseOpacity =
    material.opacity;


  /* --------------------------------------------------------
     References
     -------------------------------------------------------- */

  membrane.userData.rimGlow =
    rimGlow;


  membrane.userData.haloGlow =
    haloGlow;


  membrane.userData.membraneProteins =
    membraneProteins.proteins;


  membrane.renderOrder =
    10;


  return membrane;
}