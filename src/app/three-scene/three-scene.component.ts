import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Component({
  selector: 'app-three-scene',
  standalone: true,
  imports: [],
  templateUrl: './three-scene.component.html',
  styleUrl: './three-scene.component.css'
})
export class ThreeSceneComponent implements OnInit {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;
  head: THREE.Object3D = new THREE.Object3D();
  scene: THREE.Scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 5000);
  renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  mixer!: THREE.AnimationMixer;
  mouseX = 0;
  mouseY = 0;
  startPosX!: number;
  startPosY!: number;
  initialCarScale!: THREE.Vector3;

  constructor() {}

  ngOnInit(): void {
    this.setupScene();
    this.setupLights();
    this.setupRenderer();
    this.loadModel();
  }

  setupScene(): void {
    this.scene.background = null;
    this.camera.position.set(0, 0, 5);
  }

  setupLights(): void {
    const light = new THREE.AmbientLight(0x4e3602, 10);
    this.scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0x6a6a6a, 65);
    directionalLight.position.set(0, 0, 500);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  setupRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x181818, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
  }

  loadModel(): void {
    const loader = new GLTFLoader();
    loader.load('assets/notorius/scene.gltf', (gltf) => {
      this.mixer = new THREE.AnimationMixer(gltf.scene);
      this.head = gltf.scene.children[0];
      this.head.scale.set(1, 1, 1);
      this.startPosX = this.head.rotation.x;
      this.startPosY = this.head.rotation.y;
      this.initialCarScale = this.head.scale.clone();

      const animations = gltf.animations;
      if (animations && animations.length) {
        const animationClip = animations[0];
        const action = this.mixer.clipAction(animationClip);
        action.play();
      }
      this.scene.add(gltf.scene);
      this.animate();
    });
  }

  @HostListener('mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = (event.clientY / window.innerHeight) * 2 - 1;

    const targetRotationY = this.mouseX * Math.PI;
    const targetRotationX = this.mouseY * Math.PI;

    const rotationSpeed = 0.1;
    this.head.rotation.z = this.startPosY + (targetRotationY - this.head.rotation.z) * rotationSpeed;
    this.head.rotation.x = ((targetRotationX - this.head.rotation.x) * rotationSpeed) + this.startPosX;
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('touchmove', ['$event'])
  onDocumentTouch(event: TouchEvent): void {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.mouseX = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
      this.mouseY = (event.touches[0].pageY / window.innerHeight) * 2 - 1;
    }
  }

  animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    this.camera.lookAt(0, 0, 0);
    this.mixer.update(0.01);
    this.renderer.render(this.scene, this.camera);
  }
}
