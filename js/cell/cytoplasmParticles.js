import * as THREE from "three";

/* ==========================================================
   Seeded random generator

   Keeps particle placement identical after each refresh.
   ========================================================== */

function createSeededRandom(
  seed = 2026
) {
  let state =
    seed >>> 0;

  return function random() {
    state =
      (
        state * 1664525 +
        1013904223
      ) >>> 0;

    return (
      state /
      4294967296
    );
  };
}

function randomBetween(
  random,
  minimum,
  maximum
) {
  return THREE.MathUtils.lerp(
    minimum,
    maximum,
    random()
  );
}

/* ==========================================================
   Random normalized direction
   ========================================================== */

function randomDirection(
  random
) {
  const direction =
    new THREE.Vector3();

  do {
    direction.set(
      random() * 2 - 1,
      random() * 2 - 1,
      random() * 2 - 1
    );
  } while (
    direction.lengthSq() <
    0.001 ||
    direction.lengthSq() > 1
  );

  return direction.normalize();
}

/* ==========================================================
   Ellipsoid helpers
   ========================================================== */

function ellipsoidDistance({
  point,
  center,
  radii,
}) {
  const x =
    (
      point.x -
      center.x
    ) / radii.x;

  const y =
    (
      point.y -
      center.y
    ) / radii.y;

  const z =
    (
      point.z -
      center.z
    ) / radii.z;

  return Math.sqrt(
    x * x +
    y * y +
    z * z
  );
}

function getEllipsoidNormal({
  point,
  center,
  radii,
  target,
}) {
  const x =
    point.x -
    center.x;

  const y =
    point.y -
    center.y;

  const z =
    point.z -
    center.z;

  target.set(
    x /
      (
        radii.x *
        radii.x
      ),

    y /
      (
        radii.y *
        radii.y
      ),

    z /
      (
        radii.z *
        radii.z
      )
  );

  if (
    target.lengthSq() <
    0.0001
  ) {
    target.set(
      1,
      0,
      0
    );
  }

  return target.normalize();
}

/* ==========================================================
   Generate a point inside the cell but outside nucleus
   ========================================================== */

function randomPointInsideCell({
  random,
  cellCenter,
  cellRadii,
  nucleusCenter,
  nucleusRadii,
}) {
  for (
    let attempt = 0;
    attempt < 150;
    attempt += 1
  ) {
    const direction =
      randomDirection(
        random
      );

    /*
     * Cube root creates a roughly
     * volume-uniform distribution.
     */
    const radialDistance =
      Math.cbrt(
        random()
      );

    const point =
      new THREE.Vector3(
        direction.x *
          cellRadii.x *
          radialDistance,

        direction.y *
          cellRadii.y *
          radialDistance,

        direction.z *
          cellRadii.z *
          radialDistance
      );

    point.add(
      cellCenter
    );

    const nucleusDistance =
      ellipsoidDistance({
        point,
        center:
          nucleusCenter,
        radii:
          nucleusRadii,
      });

    /*
     * Keep particles outside the nucleus
     * and a small surrounding safety zone.
     */
    if (
      nucleusDistance > 1.08
    ) {
      return point;
    }
  }

  return new THREE.Vector3(
    nucleusCenter.x +
      nucleusRadii.x +
      0.2,

    nucleusCenter.y,

    nucleusCenter.z
  );
}

/* ==========================================================
   Create protein geometry
   ========================================================== */

function createProteinGeometry() {
  const geometry =
    new THREE.IcosahedronGeometry(
      0.018,
      0
    );

  const position =
    geometry.attributes.position;

  const vertex =
    new THREE.Vector3();

  /*
   * Deterministic deformation.
   */
  for (
    let index = 0;
    index < position.count;
    index += 1
  ) {
    vertex.fromBufferAttribute(
      position,
      index
    );

    const distortion =
      0.9 +
      (
        Math.sin(
          index * 8.73
        ) *
          0.5 +
        0.5
      ) *
        0.18;

    vertex.multiplyScalar(
      distortion
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

  return geometry;
}

/* ==========================================================
   Cytoplasm proteins
   ========================================================== */

export function createCytoplasmParticles({
  proteinCount = 180,

  cellCenter =
    new THREE.Vector3(
      0,
      0,
      0
    ),

  cellRadii =
    new THREE.Vector3(
      3.42,
      2.9,
      3.05
    ),

  nucleusCenter =
    new THREE.Vector3(
      -0.82,
      0.08,
      0
    ),

  nucleusRadii =
    new THREE.Vector3(
      0.82,
      0.74,
      0.76
    ),

  edgePadding = 0.22,

  seed = 2026,
} = {}) {
  const group =
    new THREE.Group();

  group.name =
    "cytoplasmParticles";

  group.userData.type =
    "cytoplasmParticles";

  const random =
    createSeededRandom(
      seed
    );

  /*
   * Subtract padding separately from each
   * axis so particles stay away from membrane.
   */
  const safeCellRadii =
    new THREE.Vector3(
      Math.max(
        0.1,
        cellRadii.x -
          edgePadding
      ),

      Math.max(
        0.1,
        cellRadii.y -
          edgePadding
      ),

      Math.max(
        0.1,
        cellRadii.z -
          edgePadding
      )
    );

  const proteinGeometry =
    createProteinGeometry();

  const proteinMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x72aebd,

      emissive: 0x102d35,
      emissiveIntensity: 0.025,

      roughness: 0.88,
      metalness: 0,

      transparent: true,
      opacity: 0.26,

      depthWrite: false,
      depthTest: true,
    });

  const proteins =
    new THREE.InstancedMesh(
      proteinGeometry,
      proteinMaterial,
      proteinCount
    );

  proteins.name =
    "cytoplasmicProteins";

  proteins.instanceMatrix.setUsage(
    THREE.DynamicDrawUsage
  );

  proteins.frustumCulled =
    false;

  proteins.renderOrder = 1;

  /* ========================================================
     Per-particle state
     ======================================================== */

  const positions = [];
  const velocities = [];
  const rotations = [];
  const rotationSpeeds = [];
  const scales = [];
  const aspectRatios = [];
  const phases = [];

  const dummy =
    new THREE.Object3D();

  const steeringDirection =
    new THREE.Vector3();

  const boundaryNormal =
    new THREE.Vector3();

  const localPosition =
    new THREE.Vector3();

  for (
    let index = 0;
    index < proteinCount;
    index += 1
  ) {
    const position =
      randomPointInsideCell({
        random,

        cellCenter,
        cellRadii:
          safeCellRadii,

        nucleusCenter,
        nucleusRadii,
      });

    const velocity =
      randomDirection(
        random
      ).multiplyScalar(
        randomBetween(
          random,
          0.018,
          0.04
        )
      );

    const rotation =
      new THREE.Euler(
        randomBetween(
          random,
          0,
          Math.PI * 2
        ),

        randomBetween(
          random,
          0,
          Math.PI * 2
        ),

        randomBetween(
          random,
          0,
          Math.PI * 2
        )
      );

    const rotationSpeed =
      new THREE.Vector3(
        randomBetween(
          random,
          -0.08,
          0.08
        ),

        randomBetween(
          random,
          -0.08,
          0.08
        ),

        randomBetween(
          random,
          -0.08,
          0.08
        )
      );

    const scale =
      randomBetween(
        random,
        0.5,
        1.05
      );

    const aspectRatio =
      new THREE.Vector3(
        randomBetween(
          random,
          0.78,
          1.12
        ),

        randomBetween(
          random,
          0.7,
          1
        ),

        randomBetween(
          random,
          0.74,
          1.06
        )
      );

    const phase =
      randomBetween(
        random,
        0,
        Math.PI * 2
      );

    positions.push(
      position
    );

    velocities.push(
      velocity
    );

    rotations.push(
      rotation
    );

    rotationSpeeds.push(
      rotationSpeed
    );

    scales.push(
      scale
    );

    aspectRatios.push(
      aspectRatio
    );

    phases.push(
      phase
    );

    dummy.position.copy(
      position
    );

    dummy.rotation.copy(
      rotation
    );

    dummy.scale.set(
      scale *
        aspectRatio.x,

      scale *
        aspectRatio.y,

      scale *
        aspectRatio.z
    );

    dummy.updateMatrix();

    proteins.setMatrixAt(
      index,
      dummy.matrix
    );
  }

  proteins.instanceMatrix.needsUpdate =
    true;

  group.add(
    proteins
  );

  /* ========================================================
     Animation
     ======================================================== */

  function animate(
    elapsedTime,
    deltaTime = 1 / 60
  ) {
    const safeDelta =
      Math.min(
        Math.max(
          deltaTime,
          0
        ),
        0.05
      );

    for (
      let index = 0;
      index < proteinCount;
      index += 1
    ) {
      const position =
        positions[index];

      const velocity =
        velocities[index];

      const rotation =
        rotations[index];

      const rotationSpeed =
        rotationSpeeds[index];

      const phase =
        phases[index];

      /*
       * Smooth Brownian-style steering.
       */
      steeringDirection.set(
        Math.sin(
          elapsedTime * 0.24 +
            phase
        ),

        Math.cos(
          elapsedTime * 0.2 +
            phase * 1.4
        ),

        Math.sin(
          elapsedTime * 0.17 +
            phase * 0.72
        )
      );

      steeringDirection.normalize();

      velocity.addScaledVector(
        steeringDirection,
        safeDelta * 0.0035
      );

      /*
       * Gentle speed limit.
       */
      const maximumSpeed =
        0.045;

      if (
        velocity.lengthSq() >
        maximumSpeed *
          maximumSpeed
      ) {
        velocity.setLength(
          maximumSpeed
        );
      }

      /*
       * Velocity is stored in units per second,
       * so movement uses delta time directly.
       */
      position.addScaledVector(
        velocity,
        safeDelta
      );

      /* ----------------------------------------------------
         Keep particles inside outer membrane
         ---------------------------------------------------- */

      const cellDistance =
        ellipsoidDistance({
          point:
            position,

          center:
            cellCenter,

          radii:
            safeCellRadii,
        });

      if (
        cellDistance > 1
      ) {
        localPosition
          .copy(position)
          .sub(cellCenter);

        localPosition.multiplyScalar(
          0.995 /
          cellDistance
        );

        position
          .copy(cellCenter)
          .add(localPosition);

        getEllipsoidNormal({
          point:
            position,

          center:
            cellCenter,

          radii:
            safeCellRadii,

          target:
            boundaryNormal,
        });

        velocity.reflect(
          boundaryNormal
        );

        velocity.multiplyScalar(
          0.72
        );
      }

      /* ----------------------------------------------------
         Keep particles outside nucleus
         ---------------------------------------------------- */

      const nucleusDistance =
        ellipsoidDistance({
          point:
            position,

          center:
            nucleusCenter,

          radii:
            nucleusRadii,
        });

      if (
        nucleusDistance < 1.06
      ) {
        localPosition
          .copy(position)
          .sub(
            nucleusCenter
          );

        if (
          localPosition.lengthSq() <
          0.0001
        ) {
          localPosition.set(
            1,
            0,
            0
          );
        }

        localPosition.multiplyScalar(
          1.065 /
          Math.max(
            nucleusDistance,
            0.001
          )
        );

        position
          .copy(
            nucleusCenter
          )
          .add(
            localPosition
          );

        getEllipsoidNormal({
          point:
            position,

          center:
            nucleusCenter,

          radii:
            nucleusRadii,

          target:
            boundaryNormal,
        });

        velocity.reflect(
          boundaryNormal
        );

        velocity.multiplyScalar(
          0.68
        );
      }

      rotation.x +=
        rotationSpeed.x *
        safeDelta;

      rotation.y +=
        rotationSpeed.y *
        safeDelta;

      rotation.z +=
        rotationSpeed.z *
        safeDelta;

      const pulse =
        1 +
        Math.sin(
          elapsedTime * 0.42 +
            phase
        ) *
          0.018;

      const scale =
        scales[index];

      const aspectRatio =
        aspectRatios[index];

      dummy.position.copy(
        position
      );

      dummy.rotation.copy(
        rotation
      );

      dummy.scale.set(
        scale *
          aspectRatio.x *
          pulse,

        scale *
          aspectRatio.y *
          pulse,

        scale *
          aspectRatio.z *
          pulse
      );

      dummy.updateMatrix();

      proteins.setMatrixAt(
        index,
        dummy.matrix
      );
    }

    proteins.instanceMatrix.needsUpdate =
      true;
  }

  function dispose() {
    proteinGeometry.dispose();
    proteinMaterial.dispose();
  }

  return {
    group,
    proteins,
    animate,
    dispose,
  };
}