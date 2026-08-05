import * as THREE from "three";

export const OVERVIEW_CAMERA_POSITION =
  new THREE.Vector3(
    0.15,
    0.1,
    11.5
  );

export function createScene(container) {
  const scene = new THREE.Scene();

  scene.background =
    new THREE.Color(0x020b16);

  const width =
    container.clientWidth;

  const height =
    container.clientHeight;

  const camera =
    new THREE.PerspectiveCamera(
      46,
      width / height,
      0.1,
      100
    );

  camera.position.copy(
    OVERVIEW_CAMERA_POSITION
  );
  camera.lookAt(
  0,
  0,
  0
);

  const renderer =
    new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference:
        "high-performance",
    });

  renderer.setSize(
    width,
    height
  );

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure =
    1.15;

  renderer.shadowMap.enabled =
    true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  renderer.transmissionResolutionScale =
    0.75;

  container.appendChild(
    renderer.domElement
  );

  return {
    scene,
    camera,
    renderer,
  };
}