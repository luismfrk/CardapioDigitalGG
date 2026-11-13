import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "/assets/models/encantos-burger.glb";

export default function BurgerScene() {
  const mountRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff3e4, 0x241005, 2.2));
    const key = new THREE.DirectionalLight(0xffc38a, 5.2);
    key.position.set(4, 5, 6);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.SpotLight(0xff6a00, 18, 20, Math.PI / 5, 0.75, 1.3);
    rim.position.set(-5, 2, 4);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffffff, 4.5, 15);
    fill.position.set(1, -2, 4);
    scene.add(fill);

    const modelPivot = new THREE.Group();
    scene.add(modelPivot);
    let model = null;
    let frame = 0;
    let disposed = false;
    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const onPointerMove = (event) => {
      const bounds = mount.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.5;
      pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.22;
    };
    const render = (time = 0) => {
      if (model) {
        const floating = reducedMotion ? 0 : Math.sin(time * 0.0014) * 0.08;
        modelPivot.position.y = floating + 0.05;
        modelPivot.rotation.x += (pointerY - modelPivot.rotation.x) * 0.035;
        const targetY = pointerX + (reducedMotion ? 0 : time * 0.00018);
        modelPivot.rotation.y += (targetY - modelPivot.rotation.y) * 0.025;
      }
      renderer.render(scene, camera);
      if (!reducedMotion) frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    mount.addEventListener("pointermove", onPointerMove);
    new GLTFLoader().load(
      MODEL_URL,
      ({ scene: loadedModel }) => {
        if (disposed) {
          loadedModel.traverse((child) => {
            child.geometry?.dispose();
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.filter(Boolean).forEach((material) => material.dispose());
          });
          return;
        }
        model = loadedModel;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 3.9 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale,
        );
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) child.material.needsUpdate = true;
        });
        modelPivot.add(model);
        setReady(true);
        render();
      },
      undefined,
      () => setFailed(true),
    );

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      mount.removeEventListener("pointermove", onPointerMove);
      model?.traverse((child) => {
        child.geometry?.dispose();
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.filter(Boolean).forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`burger-scene ${ready ? "is-ready" : ""}`}
      role="img"
      aria-label="Hambúrguer artesanal em destaque, visualização tridimensional"
    >
      {!ready && !failed && <span className="burger-scene-loader" />}
      {failed && (
        <img
          className="burger-scene-fallback"
          src="/assets/hero-burger.png"
          alt="Hambúrguer artesanal em destaque"
        />
      )}
      {ready && <span className="burger-scene-hint">Mova para explorar</span>}
    </div>
  );
}
