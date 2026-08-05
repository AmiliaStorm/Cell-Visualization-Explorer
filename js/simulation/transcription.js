import * as THREE from "three";

export function createTranscription({
  dna,
}) {
  const group = new THREE.Group();

  group.userData.type =
    "transcription";

  /*
   * RNA polymerase
   */
  const polymeraseMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffc857,
      emissive: 0xff8a00,
      emissiveIntensity: 1.2,
      roughness: 0.28,
      metalness: 0.05,
    });

  const polymerase =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.095,
        24,
        24
      ),
      polymeraseMaterial
    );

  polymerase.scale.set(
    1.2,
    0.8,
    1
  );

  /*
   * Second lobe
   */
  const polymeraseLobe =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.065,
        20,
        20
      ),
      polymeraseMaterial
    );

  polymeraseLobe.position.set(
    0.07,
    0.035,
    0.025
  );

  polymerase.add(
    polymeraseLobe
  );

  /*
   * mRNA strand
   */
  const mrnaMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x7dff9b,
      emissive: 0x24d95b,
      emissiveIntensity: 1.15,
      roughness: 0.3,
    });

  const mrnaPoints = [];

  const mrnaCurve =
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(),
      new THREE.Vector3(
        0,
        -0.01,
        0.01
      ),
    ]);

  const mrna =
    new THREE.Mesh(
      new THREE.TubeGeometry(
        mrnaCurve,
        8,
        0.012,
        8,
        false
      ),
      mrnaMaterial
    );

  group.add(
    polymerase,
    mrna
  );

  /*
   * Attach to DNA
   */
  dna.group.add(group);

  let progress = 0;

  function rebuildMrna() {
    if (mrnaPoints.length < 2) {
      mrna.visible = false;
      return;
    }

    mrna.visible = true;

    const curve =
      new THREE.CatmullRomCurve3(
        mrnaPoints
      );

    const geometry =
      new THREE.TubeGeometry(
        curve,
        Math.max(
          8,
          mrnaPoints.length * 3
        ),
        0.012,
        8,
        false
      );

    mrna.geometry.dispose();
    mrna.geometry = geometry;
  }

  function setProgress(
    nextProgress
  ) {
    progress =
      THREE.MathUtils.clamp(
        nextProgress,
        0,
        1
      );

    /*
     * Polymerase follows DNA
     */
    const position =
      dna.curveA.getPointAt(
        progress
      );

    polymerase.position.copy(
      position
    );

    const tangent =
      dna.curveA
        .getTangentAt(progress)
        .normalize();

    polymerase.quaternion
      .setFromUnitVectors(
        new THREE.Vector3(
          0,
          1,
          0
        ),
        tangent
      );

    /*
     * Grow mRNA behind polymerase
     */
    mrnaPoints.length = 0;

    const pointCount =
      Math.max(
        2,
        Math.floor(
          progress * 50
        )
      );

    for (
      let index = 0;
      index < pointCount;
      index += 1
    ) {
      const pointProgress =
        progress *
        (
          index /
          Math.max(
            1,
            pointCount - 1
          )
        );

      const point =
        dna.curveA.getPointAt(
          pointProgress
        );

      const wave =
        index * 0.45;

      point.x +=
        Math.sin(wave) *
        0.045;

      point.z +=
        Math.cos(wave) *
        0.045;

      mrnaPoints.push(
        point
      );
    }

    rebuildMrna();
  }

  function update(
    deltaTime,
    stageProgress = progress
  ) {
    setProgress(
      stageProgress
    );

    polymerase.rotation.z +=
      deltaTime * 0.7;

    polymeraseMaterial.emissiveIntensity =
      1.1 +
      Math.sin(
        performance.now() *
        0.003
      ) *
      0.2;
  }

  function reset() {
    setProgress(0);
  }

  function setVisible(
    visible
  ) {
    group.visible =
      visible;
  }

  setProgress(0);

  return {
    group,
    polymerase,
    mrna,
    update,
    reset,
    setProgress,
    setVisible,
  };
}