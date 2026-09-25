import * as THREE from 'three';

export class Player {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: THREE.Euler;
  private health: number = 100;
  private shield: number = 50;
  private materials: { wood: number; stone: number; metal: number } = { wood: 200, stone: 100, metal: 50 };
  private isGrounded: boolean = true;
  private yaw: number = 0;
  private pitch: number = 0;
  private bobTimer: number = 0;

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3();
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');

    this.setupPointerLock();
  }

  private setupPointerLock() {
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this.yaw -= e.movementX * 0.002;
        this.pitch -= e.movementY * 0.002;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
      }
    });
  }

  update(delta: number, moveDir: THREE.Vector3, isSprinting: boolean, isJumping: boolean) {
    // Apply rotation
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    // Movement direction relative to camera
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0));
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, this.yaw, 0));

    const move = new THREE.Vector3();
    move.addScaledVector(forward, -moveDir.z);
    move.addScaledVector(right, moveDir.x);
    move.normalize();

    const speed = isSprinting ? 15 : 8;
    this.velocity.x = move.x * speed;
    this.velocity.z = move.z * speed;

    // Gravity
    this.velocity.y -= 25 * delta;

    // Jump
    if (isJumping && this.isGrounded) {
      this.velocity.y = 10;
      this.isGrounded = false;
    }

    // Apply velocity
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // Ground collision
    const groundHeight = this.getGroundHeight(this.position.x, this.position.z);
    if (this.position.y < groundHeight + 1.7) {
      this.position.y = groundHeight + 1.7;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // World bounds
    const bound = 200;
    this.position.x = Math.max(-bound, Math.min(bound, this.position.x));
    this.position.z = Math.max(-bound, Math.min(bound, this.position.z));

    // Camera bob
    if (move.length() > 0 && this.isGrounded) {
      this.bobTimer += delta * (isSprinting ? 12 : 8);
      const bobAmount = isSprinting ? 0.06 : 0.03;
      this.position.y += Math.sin(this.bobTimer) * bobAmount;
    }

    // Update camera
    this.camera.position.copy(this.position);
  }

  private getGroundHeight(x: number, z: number): number {
    // Simple terrain height using noise-like function
    const height = Math.sin(x * 0.02) * 2 + Math.cos(z * 0.02) * 2 + Math.sin(x * 0.05 + z * 0.03) * 1;
    return Math.max(0, height);
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getRotation(): THREE.Euler {
    return new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
  }

  takeDamage(amount: number) {
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, amount);
      this.shield -= shieldDamage;
      amount -= shieldDamage;
    }
    this.health -= amount;
    this.health = Math.max(0, this.health);
  }

  heal(amount: number) {
    this.health = Math.min(100, this.health + amount);
  }

  addShield(amount: number) {
    this.shield = Math.min(100, this.shield + amount);
  }

  getHealth(): number {
    return Math.round(this.health);
  }

  getShield(): number {
    return Math.round(this.shield);
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  getMaterials() {
    return { ...this.materials };
  }

  addMaterials(type: 'wood' | 'stone' | 'metal', amount: number) {
    this.materials[type] += amount;
  }

  useMaterials(amount: number) {
    // Use wood first, then stone, then metal
    let remaining = amount;
    if (this.materials.wood >= remaining) {
      this.materials.wood -= remaining;
      return;
    }
    remaining -= this.materials.wood;
    this.materials.wood = 0;

    if (this.materials.stone >= remaining) {
      this.materials.stone -= remaining;
      return;
    }
    remaining -= this.materials.stone;
    this.materials.stone = 0;

    this.materials.metal -= remaining;
  }
}
