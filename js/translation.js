import * as THREE from "three";

export function addLighting(scene) {
  const ambient = new THREE.AmbientLight(0xb7d9ff, 1.4);

  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(4, 5, 7);

  const blue = new THREE.PointLight(0x3e8cff, 18, 15);
  blue.position.set(-4, 1, 4);

  const cyan = new THREE.PointLight(0x62f3ed, 12, 12);
  cyan.position.set(4, -3, 2);

  scene.add(ambient, key, blue, cyan);
}
