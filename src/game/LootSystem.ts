import * as THREE from 'three';

interface LootItem {
  id: string;
  mesh: THREE.Mesh;
  type: 'ammo' | 'health' | 'shield' | 'wood' | 'stone' | 'metal';
  amount: number;
}

export class LootSystem {
  private scene: THREE.Scene;
  private lootItems: LootItem[] = [];
  private idCounter: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnLoot();
  }

  private spawnLoot() {
    // Spawn loot around the map
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      const height = this.getTerrainHeight(x, z);
      
      const types: Array<'ammo' | 'health' | 'shield' | 'wood' | 'stone' | 'metal'> = 
        ['ammo', 'health', 'shield', 'wood', 'stone', 'metal'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.createLootItem(x, height + 0.5, z, type);
    }
  }

  private createLootItem(x: number, y: number, z: number, type: string) {
    let geometry: THREE.BufferGeometry;
    let color: number;
    let amount: number;

    switch (type) {
      case 'ammo':
        geometry = new THREE.BoxGeometry(0.4, 0.4, 0.6);
        color = 0xffaa00;
        amount = 15;
        break;
      case 'health':
        geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        color = 0x00ff00;
        amount = 25;
        break;
      case 'shield':
        geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        color = 0x0088ff;
        amount = 25;
        break;
      case 'wood':
        geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        color = 0x8B4513;
        amount = 30;
        break;
      case 'stone':
        geometry = new THREE.DodecahedronGeometry(0.3);
        color = 0x808080;
        amount = 20;
        break;
      case 'metal':
        geometry = new THREE.BoxGeometry(0.4, 0.3, 0.5);
        color = 0x4488ff;
        amount = 15;
        break;
      default:
        geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        color = 0xffffff;
        amount = 10;
    }

    const material = new THREE.MeshLambertMaterial({ 
      color,
      emissive: new THREE.Color(color).multiplyScalar(0.3),
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    this.lootItems.push({
      id: `loot_${this.idCounter++}`,
      mesh,
      type: type as LootItem['type'],
      amount,
    });
  }

  private getTerrainHeight(x: number, z: number): number {
    const height = Math.sin(x * 0.02) * 2 + Math.cos(z * 0.02) * 2 + Math.sin(x * 0.05 + z * 0.03) * 1;
    return Math.max(0, height);
  }

  update(delta: number, playerPos: THREE.Vector3) {
    // Animate loot items (floating and rotating)
    for (const item of this.lootItems) {
      item.mesh.rotation.y += delta * 2;
      item.mesh.position.y += Math.sin(Date.now() * 0.003 + item.mesh.id) * 0.002;
    }
  }

  getNearbyLoot(playerPos: THREE.Vector3): LootItem | null {
    for (const item of this.lootItems) {
      if (item.mesh.position.distanceTo(playerPos) < 3) {
        return item;
      }
    }
    return null;
  }

  removeLoot(id: string) {
    const index = this.lootItems.findIndex(item => item.id === id);
    if (index > -1) {
      this.scene.remove(this.lootItems[index].mesh);
      this.lootItems.splice(index, 1);
    }
  }
}
