import * as THREE from "three";

export function createDNA() {
  const group = new THREE.Group();

  group.userData.type = "dna";

  const pinkMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4fa3,
    emissive: 0xff146f,
    emissiveIntensity: 1.1,
    roughness: 0.3,
  });

  const blueMaterial = new THREE.MeshStandardMaterial({
    color: 0x4fc3ff,
    emissive: 0x168cff,
    emissiveIntensity: 1.1,
    roughness: 0.3,
  });

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8ddff,
    emissive: 0x795cff,
    emissiveIntensity: 0.65,
    roughness: 0.35,
  });

  const turns = 3.2;
  const pointCount = 100;
  const radius = 0.22;
  const height = 1.25;

  const pointsA = [];
  const pointsB = [];

  for (let index = 0; index < pointCount; index += 1) {
    const progress = index / (pointCount - 1);

    const angle =
      progress *
      Math.PI *
      2 *
      turns;

    const y = THREE.MathUtils.lerp(
      -height / 2,
      height / 2,
      progress
    );

    pointsA.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      )
    );

    pointsB.push(
      new THREE.Vector3(
        Math.cos(angle + Math.PI) * radius,
        y,
        Math.sin(angle + Math.PI) * radius
      )
    );
  }

  const curveA = new THREE.CatmullRomCurve3(pointsA);
  const curveB = new THREE.CatmullRomCurve3(pointsB);

  const strandA = new THREE.Mesh(
    new THREE.TubeGeometry(
      curveA,
      180,
      0.018,
      10,
      false
    ),
    pinkMaterial
  );

  const strandB = new THREE.Mesh(
    new THREE.TubeGeometry(
      curveB,
      180,
      0.018,
      10,
      false
    ),
    blueMaterial
  );

  const basePairs = new THREE.Group();

  const basePairCount = 30;

  for (
    let index = 0;
    index < basePairCount;
    index += 1
  ) {
    const progress =
      index / (basePairCount - 1);

    const angle =
      progress *
      Math.PI *
      2 *
      turns;

    const y = THREE.MathUtils.lerp(
      -height / 2,
      height / 2,
      progress
    );

    const pointA = new THREE.Vector3(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );

    const pointB = new THREE.Vector3(
      Math.cos(angle + Math.PI) * radius,
      y,
      Math.sin(angle + Math.PI) * radius
    );

    const direction = pointB
      .clone()
      .sub(pointA);

    const midpoint = pointA
      .clone()
      .add(pointB)
      .multiplyScalar(0.5);

    const basePair = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.012,
        0.012,
        direction.length(),
        8
      ),
      baseMaterial
    );

    basePair.position.copy(midpoint);

    basePair.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    basePairs.add(basePair);
  }

  group.add(
    strandA,
    strandB,
    basePairs
  );

  group.position.set(
    -0.12,
    -0.04,
    0.08
  );

  group.rotation.set(
    0.25,
    0.2,
    -0.35
  );

  group.scale.setScalar(0.7);

  function animate(elapsedTime) {
    group.rotation.y =
      0.2 +
      elapsedTime * 0.17;

    group.rotation.z =
      -0.35 +
      Math.sin(
        elapsedTime * 0.45
      ) *
        0.05;

    const pulse =
      0.7 +
      Math.sin(
        elapsedTime * 1.1
      ) *
        0.015;

    group.scale.setScalar(pulse);

    pinkMaterial.emissiveIntensity =
      1.05 +
      Math.sin(
        elapsedTime * 1.3
      ) *
        0.2;

    blueMaterial.emissiveIntensity =
      1.05 +
      Math.cos(
        elapsedTime * 1.3
      ) *
        0.2;
  }

 return {
  group,
  strandA,
  strandB,
  basePairs,
  curveA,
  curveB,
  animate,
};

}