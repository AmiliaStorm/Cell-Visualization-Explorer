import * as THREE from "three";

import {
  EffectComposer,
} from "three/addons/postprocessing/EffectComposer.js";

import {
  RenderPass,
} from "three/addons/postprocessing/RenderPass.js";

import {
  UnrealBloomPass,
} from "three/addons/postprocessing/UnrealBloomPass.js";

import {
  OutputPass,
} from "three/addons/postprocessing/OutputPass.js";

export function createPostProcessing({
  renderer,
  scene,
  camera,
  container,
}) {
  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure =
    0.82;

  const composer =
    new EffectComposer(
      renderer
    );

  composer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      1.5
    )
  );

  const renderPass =
    new RenderPass(
      scene,
      camera
    );

  composer.addPass(
    renderPass
  );

  const bloomPass =
    new UnrealBloomPass(
      new THREE.Vector2(
        container.clientWidth,
        container.clientHeight
      ),

      0.26,
      0.25,
      0.93
    );

  composer.addPass(
    bloomPass
  );

  const outputPass =
    new OutputPass();

  composer.addPass(
    outputPass
  );

  function resize(
    width,
    height
  ) {
    const pixelRatio =
      Math.min(
        window.devicePixelRatio,
        1.5
      );

    composer.setPixelRatio(
      pixelRatio
    );

    composer.setSize(
      width,
      height
    );

    bloomPass.resolution.set(
      width * pixelRatio,
      height * pixelRatio
    );
  }

  return {
    composer,
    bloomPass,
    resize,
  };
}