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
  SSAOPass,
} from "three/addons/postprocessing/SSAOPass.js";

import {
  BokehPass,
} from "three/addons/postprocessing/BokehPass.js";

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

  /*
   * Matches the value set in scene.js.
   * Previously this file silently overrode it to 0.82,
   * flattening the render.
   */
  renderer.toneMappingExposure =
    1.28;

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

  /* ========================================================
     Ambient occlusion

     Adds soft contact shadows where organelles meet or
     overlap, grounding them in space instead of looking
     "pasted on" next to each other.
     ======================================================== */

  const ssaoPass =
    new SSAOPass(
      scene,
      camera,
      container.clientWidth,
      container.clientHeight
    );

  ssaoPass.kernelRadius =
    0.35;

  ssaoPass.minDistance =
    0.0008;

  ssaoPass.maxDistance =
    0.12;

  ssaoPass.output =
    SSAOPass.OUTPUT.Default;

  composer.addPass(
    ssaoPass
  );

  /* ========================================================
     Depth of field

     Keeps the active pathway region in sharp focus while
     softly blurring organelles further from the camera,
     matching the reference image's lens-like depth.
     ======================================================== */

  const bokehPass =
    new BokehPass(
      scene,
      camera,
      {
        focus: 8.3,
        aperture: 0.00042,
        maxblur: 0.006,

        width:
          container.clientWidth,

        height:
          container.clientHeight,
      }
    );

  composer.addPass(
    bokehPass
  );

  /* ========================================================
     Bloom

     Slightly stronger and more selective than before so
     glow concentrates on genuinely bright emissive areas
     (DNA, connector line, Golgi rim) rather than washing
     everything in a uniform haze.
     ======================================================== */

  const bloomPass =
    new UnrealBloomPass(
      new THREE.Vector2(
        container.clientWidth,
        container.clientHeight
      ),

      0.34,
      0.30,
      0.86
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

    ssaoPass.setSize(
      width,
      height
    );

    bokehPass.setSize(
      width,
      height
    );
  }

  return {
    composer,
    bloomPass,
    ssaoPass,
    bokehPass,
    resize,
  };
}