import * as THREE from 'three';

export class World {
  private scene: THREE.Scene;
  private trees: THREE.Group[] = [];
  private rocks: THREE.Mesh[] = [];
  private buildings: THREE.Mesh[] = [];
  private breakableObjects: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createTerrain();
    this.createTrees();
    this.createRocks();
    this.createBuildings();
    this.createDecorations();
  }

  private createTerrain() {
    // Main ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 100, 100);
    const positions = groundGeometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const height = Math.sin(x * 0.02) * 2 + Math.cos(y * 0.02) * 2 + Math.sin(x * 0.05 + y * 0.03) * 1;
      positions.setZ(i, Math.max(0, height));
    }
    
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4a8c3f,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Water areas
    const waterGeometry = new THREE.PlaneGeometry(80, 80);
    const waterMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x3399ff, 
      transparent: true, 
      opacity: 0.7 
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(60, -0.5, 60);
    this.scene.add(water);
  }

  private createTrees() {
    for (let i = 0; i < 150; i++) {
      const tree = this.createTree();
      const x = (Math.random() - 0.5) * 350;
      const z = (Math.random() - 0.5) * 350;
      const height = this.getTerrainHeight(x, z);
      tree.position.set(x, height, z);
      tree.scale.setScalar(0.8 + Math.random() * 0.6);
      this.scene.add(tree);
      this.trees.push(tree);
      this.breakableObjects.push(tree);
    }
  }

  private createTree(): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    tree.add(trunk);

    // Foliage layers
    const foliageColors = [0x228B22, 0x2E8B2E, 0x32CD32];
    for (let i = 0; i < 3; i++) {
      const foliageGeometry = new THREE.ConeGeometry(2.5 - i * 0.5, 3 - i * 0.5, 8);
      const foliageMaterial = new THREE.MeshLambertMaterial({ 
        color: foliageColors[i % foliageColors.length] 
      });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 4 + i * 1.8;
      foliage.castShadow = true;
      tree.add(foliage);
    }

    tree.userData = { type: 'tree', health: 100, materialType: 'wood' };
    return tree;
  }

  private createRocks() {
    for (let i = 0; i < 80; i++) {
      const rock = this.createRock();
      const x = (Math.random() - 0.5) * 350;
      const z = (Math.random() - 0.5) * 350;
      const height = this.getTerrainHeight(x, z);
      rock.position.set(x, height, z);
      rock.scale.setScalar(0.5 + Math.random() * 1.5);
      this.scene.add(rock);
      this.rocks.push(rock);
      this.breakableObjects.push(rock);
    }
  }

  private createRock(): THREE.Mesh {
    const geometry = new THREE.DodecahedronGeometry(1.5, 1);
    // Deform vertices for natural look
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const noise = 0.8 + Math.random() * 0.4;
      positions.setXYZ(i, x * noise, y * noise * 0.7, z * noise);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(geometry, material);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.userData = { type: 'rock', health: 150, materialType: 'stone' };
    return rock;
  }

  private createBuildings() {
    // Create some houses/structures
    const positions = [
      { x: 20, z: -20 },
      { x: -30, z: 30 },
      { x: 50, z: 50 },
      { x: -60, z: -40 },
      { x: 80, z: -30 },
      { x: -20, z: -70 },
      { x: 40, z: 80 },
      { x: -80, z: 20 },
    ];

    positions.forEach(pos => {
      const building = this.createBuilding();
      const height = this.getTerrainHeight(pos.x, pos.z);
      building.position.set(pos.x, height, pos.z);
      this.scene.add(building);
      this.buildings.push(building);
    });
  }

  private createBuilding(): THREE.Mesh {
    const width = 6 + Math.random() * 4;
    const height = 4 + Math.random() * 4;
    const depth = 6 + Math.random() * 4;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const colors = [0xd4a574, 0xc0c0c0, 0xa0a0a0, 0xe8d4b8];
    const material = new THREE.MeshLambertMaterial({ 
      color: colors[Math.floor(Math.random() * colors.length)] 
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.y = height / 2;
    building.castShadow = true;
    building.receiveShadow = true;
    building.userData = { type: 'building', health: 200, materialType: 'metal' };

    // Add roof
    const roofGeometry = new THREE.ConeGeometry(width * 0.8, 3, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height / 2 + 1.5;
    roof.rotation.y = Math.PI / 4;
    building.add(roof);

    // Add windows
    const windowGeometry = new THREE.PlaneGeometry(1, 1.5);
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB, emissive: 0x222244 });
    
    for (let i = 0; i < 2; i++) {
      const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(-1.5 + i * 3, 0, depth / 2 + 0.01);
      building.add(window1);

      const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
      window2.position.set(-1.5 + i * 3, 0, -depth / 2 - 0.01);
      window2.rotation.y = Math.PI;
      building.add(window2);
    }

    return building;
  }

  private createDecorations() {
    // Grass patches
    for (let i = 0; i < 200; i++) {
      const grassGeometry = new THREE.PlaneGeometry(0.3, 0.8);
      const grassMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x3d8c3d, 
        side: THREE.DoubleSide 
      });
      const grass = new THREE.Mesh(grassGeometry, grassMaterial);
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      grass.position.set(x, this.getTerrainHeight(x, z) + 0.4, z);
      grass.rotation.y = Math.random() * Math.PI;
      this.scene.add(grass);
    }

    // Flowers
    for (let i = 0; i < 50; i++) {
      const flowerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const colors = [0xff69b4, 0xffff00, 0xff4500, 0x9370db];
      const flowerMaterial = new THREE.MeshLambertMaterial({ 
        color: colors[Math.floor(Math.random() * colors.length)] 
      });
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      const x = (Math.random() - 0.5) * 250;
      const z = (Math.random() - 0.5) * 250;
      flower.position.set(x, this.getTerrainHeight(x, z) + 0.3, z);
      this.scene.add(flower);
    }

    // Crates
    for (let i = 0; i < 30; i++) {
      const crateGeometry = new THREE.BoxGeometry(1, 1, 1);
      const crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
      const crate = new THREE.Mesh(crateGeometry, crateMaterial);
      const x = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      crate.position.set(x, this.getTerrainHeight(x, z) + 0.5, z);
      crate.castShadow = true;
      crate.userData = { type: 'crate', health: 50, materialType: 'wood' };
      this.scene.add(crate);
      this.breakableObjects.push(crate);
    }
  }

  private getTerrainHeight(x: number, z: number): number {
    const height = Math.sin(x * 0.02) * 2 + Math.cos(z * 0.02) * 2 + Math.sin(x * 0.05 + z * 0.03) * 1;
    return Math.max(0, height);
  }

  getBreakableObjects(): THREE.Object3D[] {
    return this.breakableObjects;
  }

  breakObject(obj: THREE.Object3D): { type: 'wood' | 'stone' | 'metal'; amount: number } | null {
    const userData = obj.userData;
    if (!userData || !userData.type) return null;

    userData.health -= 50;
    
    if (userData.health <= 0) {
      const type = userData.materialType as 'wood' | 'stone' | 'metal';
      const amount = type === 'wood' ? 30 : type === 'stone' ? 20 : 15;
      
      // Remove from scene
      this.scene.remove(obj);
      const index = this.breakableObjects.indexOf(obj);
      if (index > -1) this.breakableObjects.splice(index, 1);
      
      return { type, amount };
    }
    
    return null;
  }
}
