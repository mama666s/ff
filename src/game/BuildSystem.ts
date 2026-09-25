import * as THREE from 'three';

export class BuildSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private buildMode: boolean = false;
  private buildType: string = 'wall';
  private previewMesh: THREE.Mesh | null = null;
  private placedBuilds: THREE.Mesh[] = [];
  private raycaster: THREE.Raycaster;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();

    // Listen for build mode toggle
    window.addEventListener('keydown', (e) => {
      if (e.key === 'b' || e.key === 'B') {
        this.buildMode = !this.buildMode;
        if (this.buildMode) {
          this.createPreview();
        } else {
          this.removePreview();
        }
      }
      if (e.key === '1') this.buildType = 'wall';
      if (e.key === '2') this.buildType = 'floor';
      if (e.key === '3') this.buildType = 'ramp';
      if (this.buildMode) this.updatePreview();
    });

    window.addEventListener('mousemove', () => {
      if (this.buildMode) this.updatePreview();
    });
  }

  isBuildMode(): boolean {
    return this.buildMode;
  }

  private createPreview() {
    this.removePreview();
    
    let geometry: THREE.BufferGeometry;
    switch (this.buildType) {
      case 'wall':
        geometry = new THREE.BoxGeometry(4, 3, 0.2);
        break;
      case 'floor':
        geometry = new THREE.BoxGeometry(4, 0.2, 4);
        break;
      case 'ramp':
        geometry = new THREE.BoxGeometry(4, 0.2, 4);
        break;
      default:
        geometry = new THREE.BoxGeometry(4, 3, 0.2);
    }

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      wireframe: false,
    });

    this.previewMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.previewMesh);
  }

  private removePreview() {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh.geometry.dispose();
      (this.previewMesh.material as THREE.Material).dispose();
      this.previewMesh = null;
    }
  }

  private updatePreview() {
    if (!this.previewMesh) return;

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    const direction = this.raycaster.ray.direction.clone().multiplyScalar(6);
    const pos = this.camera.position.clone().add(direction);

    // Snap to grid
    pos.x = Math.round(pos.x / 4) * 4;
    pos.z = Math.round(pos.z / 4) * 4;

    switch (this.buildType) {
      case 'wall':
        pos.y = Math.round(pos.y / 3) * 3 + 1.5;
        // Rotate to face camera direction
        const angle = Math.atan2(
          this.raycaster.ray.direction.x,
          this.raycaster.ray.direction.z
        );
        this.previewMesh.rotation.y = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
        break;
      case 'floor':
        pos.y = Math.round(pos.y / 3) * 3;
        break;
      case 'ramp':
        pos.y = Math.round(pos.y / 3) * 3 + 1.5;
        this.previewMesh.rotation.x = -Math.PI / 6;
        const rampAngle = Math.atan2(
          this.raycaster.ray.direction.x,
          this.raycaster.ray.direction.z
        );
        this.previewMesh.rotation.y = Math.round(rampAngle / (Math.PI / 2)) * (Math.PI / 2);
        break;
    }

    this.previewMesh.position.copy(pos);
  }

  placeBuild(): boolean {
    if (!this.previewMesh) return false;

    const material = new THREE.MeshLambertMaterial({
      color: 0xdeb887,
      transparent: true,
      opacity: 0.9,
    });

    const build = this.previewMesh.clone();
    build.material = material;
    build.castShadow = true;
    build.receiveShadow = true;
    this.scene.add(build);
    this.placedBuilds.push(build);

    // Re-create preview
    this.createPreview();
    this.updatePreview();

    return true;
  }

  update(playerPos: THREE.Vector3) {
    // Update preview position continuously
    if (this.buildMode && this.previewMesh) {
      this.updatePreview();
    }
  }
}
