import * as THREE from "three";

/* ==========================================================
   Deform the membrane into a slightly organic shape
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
      .copy(vertex)
      .normalize();

    const waveOne =
      Math.sin(
        direction.x * 3.2 +
          direction.y * 2.1 -
          direction.z * 1.7
      ) * 0.08;

    const waveTwo =
      Math.sin(
        direction.z * 4.6 -
          direction.x * 2.8
      ) * 0.05;

    const waveThree =
      Math.cos(
        direction.y * 6.4 +
          direction.z * 3.3
      ) * 0.03;

    const deformation =
      waveOne +
      waveTwo +
      waveThree;

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
   Primary rim glow shader

   This gives the membrane its elegant bright edge.
   ========================================================== */

function createRimMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      rimColor: {
        value:
          new THREE.Color(
            0x2cc9ee
          ),
      },

      rimStrength: {
        value: 0.82,
      },

      rimPower: {
        value: 4.2,
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
            rim * 0.16
          );
      }
    `,

    transparent: true,

    blending:
      THREE.AdditiveBlending,

    depthWrite: false,
    depthTest: true,

    side: THREE.FrontSide,
  });
}

/* ==========================================================
   Secondary soft halo

   Adds a broader, dimmer glow around the membrane
   so the outline feels smoother and less harsh.
   ========================================================== */

function createHaloMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      haloColor: {
        value:
          new THREE.Color(
            0x1aa6d1
          ),
      },

      haloStrength: {
        value: 0.42,
      },

      haloPower: {
        value: 2.2,
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
            halo * 0.05
          );
      }
    `,

    transparent: true,

    blending:
      THREE.AdditiveBlending,

    depthWrite: false,
    depthTest: true,

    side: THREE.FrontSide,
  });
}

/* ==========================================================
   Cell membrane
   ========================================================== */

export function createMembrane() {
  const geometry =
    new THREE.SphereGeometry(
      3,
      96,
      96
    );

  const {
    position,
    originalPositions,
  } = deformGeometry(
    geometry
  );

  /*
   * Very subtle membrane body.
   * It should define enclosure,
   * not flood the scene with blue.
   */
  const material =
    new THREE.MeshPhysicalMaterial({
      color: 0x103b52,

      transparent: true,
      opacity: 0.022,

      roughness: 0.34,
      metalness: 0,

      transmission: 0,

      clearcoat: 0.35,
      clearcoatRoughness: 0.35,

      emissive:
        new THREE.Color(
          0x03131d
        ),

      emissiveIntensity: 0.08,

      side: THREE.FrontSide,

      depthWrite: false,
      depthTest: true,
    });

  const membrane =
    new THREE.Mesh(
      geometry,
      material
    );

  /*
   * Slightly elongated animal-cell shape.
   */
  membrane.scale.set(
    1.1,
    0.94,
    1
  );

  /*
   * Crisp main rim.
   */
  const rimGlow =
    new THREE.Mesh(
      geometry.clone(),
      createRimMaterial()
    );

  rimGlow.scale.setScalar(
    1.01
  );

  rimGlow.renderOrder = 11;

  /*
   * Softer outer halo for a smoother edge.
   */
  const haloGlow =
    new THREE.Mesh(
      geometry.clone(),
      createHaloMaterial()
    );

  haloGlow.scale.setScalar(
    1.03
  );

  haloGlow.renderOrder = 9;

  membrane.add(
    haloGlow
  );

  membrane.add(
    rimGlow
  );

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

  membrane.renderOrder = 10;

  return membrane;
}