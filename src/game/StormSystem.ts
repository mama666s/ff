import * as THREE from 'three';

export class StormSystem {
  private scene: THREE.Scene;
  private stormMesh: THREE.Mesh;
  private safeZoneMesh: THREE.Mesh;
  private phase: number = 1;
  private timer: number = 120;
  private stormRadius: number = 200;
  private safeRadius: number = 150;
  private stormCenter: THREE.Vector2 = new THREE.Vector2(0, 0);
  private safeCenter: THREE.Vector2 = new THREE.Vector2(0, 0);
  private shrinking: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Storm circle (outer)
    const stormGeometry = new THREE.RingGeometry(this.stormRadius, 300, 64);
    const stormMaterial = new THREE.MeshBasicMaterial({
      color: 0x8800ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.stormMesh = new THREE.Mesh(stormGeometry, stormMaterial);
    this.stormMesh.rotation.x = -Math.PI / 2;
    this.stormMesh.position.y = 50;
    this.scene.add(this.stormMesh);

    // Safe zone circle
    const safeGeometry = new THREE.RingGeometry(this.safeRadius - 0.5, this.safeRadius + 0.5, 64);
    const safeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.safeZoneMesh = new THREE.Mesh(safeGeometry, safeMaterial);
    this.safeZoneMesh.rotation.x = -Math.PI / 2;
    this.safeZoneMesh.position.y = 1;
    this.scene.add(this.safeZoneMesh);

    // Storm wall effect
    const wallGeometry = new THREE.CylinderGeometry(this.stormRadius, this.stormRadius, 100, 64, 1, true);
    const wallMaterial = new THREE.MeshBasicMaterial({
      color: 0x6600cc,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 50;
    this.scene.add(wall);
  }

  update(delta: number) {
    this.timer -= delta;

    if (this.timer <= 0) {
      this.nextPhase();
    }

    // Shrink storm
    if (this.shrinking) {
      this.stormRadius = Math.max(this.safeRadius, this.stormRadius - delta * 5);
      this.updateStormMesh();
      if (this.stormRadius <= this.safeRadius) {
        this.shrinking = false;
      }
    }
  }

  private nextPhase() {
    this.phase++;
    this.timer = Math.max(30, 120 - this.phase * 20);
    this.safeRadius = Math.max(20, this.safeRadius - 20);
    this.shrinking = true;
    this.updateSafeZoneMesh();
  }

  private updateStormMesh() {
    this.scene.remove(this.stormMesh);
    const geometry = new THREE.RingGeometry(this.stormRadius, 300, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x8800ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.stormMesh = new THREE.Mesh(geometry, material);
    this.stormMesh.rotation.x = -Math.PI / 2;
    this.stormMesh.position.set(this.stormCenter.x, 50, this.stormCenter.y);
    this.scene.add(this.stormMesh);
  }

  private updateSafeZoneMesh() {
    this.scene.remove(this.safeZoneMesh);
    const geometry = new THREE.RingGeometry(this.safeRadius - 0.5, this.safeRadius + 0.5, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.safeZoneMesh = new THREE.Mesh(geometry, material);
    this.safeZoneMesh.rotation.x = -Math.PI / 2;
    this.safeZoneMesh.position.set(this.safeCenter.x, 1, this.safeCenter.y);
    this.scene.add(this.safeZoneMesh);
  }

  isPlayerInStorm(playerPos: THREE.Vector3): boolean {
    const dist = Math.sqrt(
      Math.pow(playerPos.x - this.stormCenter.x, 2) + 
      Math.pow(playerPos.z - this.stormCenter.y, 2)
    );
    return dist > this.stormRadius;
  }

  getPhase(): number {
    return this.phase;
  }

  getTimer(): number {
    return Math.max(0, Math.round(this.timer));
  }
}
