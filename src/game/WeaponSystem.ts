import * as THREE from 'three';

export class WeaponSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private ammo: number = 30;
  private maxAmmo: number = 30;
  private weaponModel: THREE.Group;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.weaponModel = this.createWeaponModel();
    this.camera.add(this.weaponModel);
    this.scene.add(this.camera);
  }

  private createWeaponModel(): THREE.Group {
    const group = new THREE.Group();

    // Gun body
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.6);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0.3, -0.25, -0.5);
    group.add(body);

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.3, -0.22, -0.9);
    group.add(barrel);

    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.06, 0.15, 0.08);
    const magMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const mag = new THREE.Mesh(magGeometry, magMaterial);
    mag.position.set(0.3, -0.35, -0.45);
    group.add(mag);

    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.06, 0.08, 0.2);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0.3, -0.25, -0.15);
    group.add(stock);

    // Sight
    const sightGeometry = new THREE.BoxGeometry(0.03, 0.04, 0.08);
    const sightMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.set(0.3, -0.17, -0.5);
    group.add(sight);

    return group;
  }

  shoot(): boolean {
    if (this.ammo <= 0) return false;
    this.ammo--;
    
    // Recoil animation
    this.weaponModel.position.z = 0.05;
    this.weaponModel.rotation.x = -0.05;
    setTimeout(() => {
      this.weaponModel.position.z = 0;
      this.weaponModel.rotation.x = 0;
    }, 50);
    
    return true;
  }

  reload() {
    this.ammo = this.maxAmmo;
  }

  addAmmo(amount: number) {
    this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
  }

  getAmmo(): number {
    return this.ammo;
  }
}
