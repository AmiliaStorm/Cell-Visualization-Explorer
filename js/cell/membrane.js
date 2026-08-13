import * as THREE from "three";

/* ==========================================================
   Organic membrane deformation

   Creates a broad, slightly irregular animal-cell shape
   rather than a perfect sphere.
   ========================================================== */

function deformGeometry(geometry) {
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
      .copy(vertex)
      .normalize();

    /* ------------------------------------------------------
       Large-scale organic variation

       These waves are deliberately subtle.
       The main oval shape comes from membrane.scale below.
       ------------------------------------------------------ */

    const waveOne =
      Math.sin(
        direction.x * 3.1 +
        direction.y * 2.0 -
        direction.z * 1.5
      ) * 0.075;

    const waveTwo =
      Math.sin(
        direction.z * 4.2 -
        direction.x * 2.6 +
        direction.y * 0.8
      ) * 0.045;

    const waveThree =
      Math.cos(
        direction.y * 5.4 +
        direction.z * 2.8
      ) * 0.028;

    /* ------------------------------------------------------
       Gentle asymmetric bulges

       Prevents the cell from looking like a mathematical
       ellipsoid.
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

  position.needsUpdate = true;

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return {
    position,
    originalPositions,
  };
}


/* ==========================================================
   Primary rim glow

   Bright cyan edge visible mostly around the silhouette.
   ========================================================== */

function createRimMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      rimColor: {
        value:
          new THREE.Color(
            0x32cfff
          ),
      },

      rimStrength: {
        value: 0.9,
      },

      rimPower: {
        value: 3.5,
      },
    },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition =
          modelMatrix *
          vec4(position, 1.0);

        vWorldPosition =
          worldPosition.xyz;

        vNormal =
          normalize(
            mat3(modelMatrix) *
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
              normalize(vNormal),
              viewDirection
            ),
            0.0
          );

        rim =
          pow(
            rim,
            rimPower
          );

        gl_FragColor =
          vec4(
            rimColor *
            rimStrength,
            rim * 0.19
          );
      }
    `,

    transparent: true,

    blending:
      THREE.AdditiveBlending,

    depthWrite: false,
    depthTest: true,

    side:
      THREE.FrontSide,
  });
}


/* ==========================================================
   Secondary soft halo

   Wider and softer than the main rim.
   ========================================================== */

function createHaloMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      haloColor: {
        value:
          new THREE.Color(
            0x168fbd
          ),
      },

      haloStrength: {
        value: 0.48,
      },

      haloPower: {
        value: 2.0,
      },
    },

    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition =
          modelMatrix *
          vec4(position, 1.0);

        vWorldPosition =
          worldPosition.xyz;

        vNormal =
          normalize(
            mat3(modelMatrix) *
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
              normalize(vNormal),
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
            halo * 0.065
          );
      }
    `,

    transparent: true,

    blending:
      THREE.AdditiveBlending,

    depthWrite: false,
    depthTest: true,

    side:
      THREE.FrontSide,
  });
}


/* ==========================================================
   Membrane protein stud

   A small ring-and-cap shape suggesting an embedded channel
   or transport protein, scattered across the membrane
   surface so it reads as a biological bilayer rather than a
   plain glass shell.
   ========================================================== */

function createMembraneProtein(material) {
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
   Scattered membrane protein field

   Fibonacci-sphere placement across the membrane's actual
   (deformed + scaled) surface, oriented to face outward.
   Same distribution technique as the nuclear pores in
   nucleus.js.
   ========================================================== */

function createMembraneProteins({
  geometryRadius,
  scale,
  count = 90,
}) {
  const group =
    new THREE.Group();

  group.name =
    "membraneProteins";

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x4fd6e8,

      emissive: 0x0f4a56,
      emissiveIntensity: 0.4,

      roughness: 0.32,
      metalness: 0,

      transparent: true,
      opacity: 0.55,
    });

  const proteins = [];

  const goldenAngle =
    Math.PI *
    (
      3 -
      Math.sqrt(5)
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
        (count - 1)
      ) * 2;

    const horizontalRadius =
      Math.sqrt(
        Math.max(
          0,
          1 -
          vertical * vertical
        )
      );

    const theta =
      goldenAngle * index;

    const normal =
      new THREE.Vector3(
        Math.cos(theta) *
          horizontalRadius,

        vertical,

        Math.sin(theta) *
          horizontalRadius
      ).normalize();

    const position =
      new THREE.Vector3(
        normal.x *
          geometryRadius *
          scale.x *
          1.001,

        normal.y *
          geometryRadius *
          scale.y *
          1.001,

        normal.z *
          geometryRadius *
          scale.z *
          1.001
      );

    const protein =
      createMembraneProtein(
        material
      );

    protein.position.copy(
      position
    );

    protein.quaternion.setFromUnitVectors(
      new THREE.Vector3(
        0,
        0,
        1
      ),
      normal
    );

    protein.userData.phase =
      (
        index * 0.71
      ) %
      (
        Math.PI * 2
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

export function createMembrane() {
  const geometry =
    new THREE.SphereGeometry(
      3,
      112,
      96
    );

  const {
    position,
    originalPositions,
  } = deformGeometry(
    geometry
  );


  /* ========================================================
     Membrane body

     Very transparent, but slightly more visible than before
     so the cell has a glass-like enclosed volume.
     ======================================================== */

  const material =
    new THREE.MeshPhysicalMaterial({
      color: 0x0b4058,

      transparent: true,
      opacity: 0.04,

      roughness: 0.28,
      metalness: 0,

      transmission: 0.06,

      clearcoat: 0.55,
      clearcoatRoughness: 0.28,

      emissive:
        new THREE.Color(
          0x041b28
        ),

      emissiveIntensity: 0.16,

      side:
        THREE.FrontSide,

      depthWrite: false,
      depthTest: true,
    });


  const membrane =
    new THREE.Mesh(
      geometry,
      material
    );


  /* ========================================================
     Animal-cell silhouette

     THIS is the major visual change.

     Wide x-axis
     Lower y-axis
     Slightly compressed depth

     The organelles are NOT affected because they are not
     children of this mesh.
     ======================================================== */

  membrane.scale.set(
    1.22,
    0.82,
    0.94
  );


  /* --------------------------------------------------------
     Tiny tilt prevents the silhouette from looking perfectly
     horizontal / artificial.
     -------------------------------------------------------- */

  membrane.rotation.z =
    -0.018;


  /* ========================================================
     Scattered membrane proteins

     Added before the rim/halo glow layers so those glow
     shells still render on top, on the outside.
     ======================================================== */

  const membraneProteins =
    createMembraneProteins({
      geometryRadius: 3,
      scale: membrane.scale,
      count: 90,
    });

  membraneProteins.group.renderOrder = 8;

  membrane.add(
    membraneProteins.group
  );


  /* ========================================================
     Crisp primary rim
     ======================================================== */

  const rimGlow =
    new THREE.Mesh(
      geometry.clone(),
      createRimMaterial()
    );

  rimGlow.scale.setScalar(
    1.008
  );

  rimGlow.renderOrder = 11;


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

  haloGlow.renderOrder = 9;


  membrane.add(
    haloGlow
  );

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

  membrane.userData.originalPositions =
    originalPositions;

  membrane.userData.geometryPosition =
    position;

  membrane.userData.baseScale =
    membrane.scale.clone();

  membrane.userData.rimGlow =
    rimGlow;

  membrane.userData.haloGlow =
    haloGlow;

  membrane.userData.membraneProteins =
    membraneProteins.proteins;

  membrane.renderOrder = 10;

  return membrane;
}
