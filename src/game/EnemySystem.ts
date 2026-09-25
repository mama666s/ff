import * as THREE from 'three';
import { World } from './World';

interface Enemy {
  mesh: THREE.Group;
  health: number;
  speed: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'strafe';
  targetPos: THREE.Vector3;
  lastAttack: number;
  alive: boolean;
}

export class EnemySystem {
  private scene: THREE.Scene;
  private world: World;
  private enemies: Enemy[] = [];
  private kills: number = 0;
  private playerDamage: number = 0;
  private aliveCount: number = 50;

  constructor(scene: THREE.Scene, world: World) {
    this.scene = scene;
    this.world = world;
    this.spawnEnemies(49); // 49 enemies + player = 50
  }

  private spawnEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      const enemy = this.createEnemy();
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 150;
      enemy.mesh.position.set(
        Math.cos(angle) * dist,
        2,
        Math.sin(angle) * dist
      );
      enemy.targetPos = this.getRandomPatrolPoint();
      this.enemies.push(enemy);
      this.scene.add(enemy.mesh);
    }
  }

  private createEnemy(): Enemy {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
    const bodyColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: bodyColors[Math.floor(Math.random() * bodyColors.length)] 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.1;
    head.castShadow = true;
    group.add(head);

    // Weapon (simple gun shape)
    const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    const gunMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(0.5, 1.2, -0.3);
    group.add(gun);

    // Health bar background
    const healthBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    healthBarBg.position.y = 2.7;
    group.add(healthBarBg);

    // Health bar
    const healthBar = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    healthBar.position.y = 2.7;
    healthBar.position.z = 0.01;
    healthBar.name = 'healthBar';
    group.add(healthBar);

    group.userData = { isEnemy: true };

    return {
      mesh: group,
      health: 100,
      speed: 3 + Math.random() * 3,
      state: 'patrol',
      targetPos: new THREE.Vector3(),
      lastAttack: 0,
      alive: true,
    };
  }

  private getRandomPatrolPoint(): THREE.Vector3 {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 200,
      2,
      (Math.random() - 0.5) * 200
    );
  }

  update(delta: number, playerPos: THREE.Vector3, playerRot: THREE.Euler) {
    this.playerDamage = 0;

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const distToPlayer = enemy.mesh.position.distanceTo(playerPos);

      // State machine
      if (distToPlayer < 15) {
        enemy.state = 'attack';
      } else if (distToPlayer < 40) {
        enemy.state = 'chase';
      } else if (distToPlayer < 80) {
        enemy.state = Math.random() > 0.5 ? 'chase' : 'patrol';
      } else {
        enemy.state = 'patrol';
      }

      // Behavior
      switch (enemy.state) {
        case 'patrol':
          this.patrolBehavior(enemy, delta);
          break;
        case 'chase':
          this.chaseBehavior(enemy, delta, playerPos);
          break;
        case 'attack':
          this.attackBehavior(enemy, delta, playerPos);
          break;
      }

      // Attack if in attack state
      if (enemy.state === 'attack') {
        const now = Date.now();
        if (now - enemy.lastAttack > 1000) {
          this.playerDamage += 5 + Math.random() * 5;
          enemy.lastAttack = now;
        }
      }

      // Make health bar face camera
      const healthBar = enemy.mesh.getObjectByName('healthBar') as THREE.Mesh;
      if (healthBar) {
        healthBar.lookAt(playerPos);
        const healthPercent = enemy.health / 100;
        healthBar.scale.x = healthPercent;
        (healthBar.material as THREE.MeshBasicMaterial).color.setHex(
          healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000
        );
      }

      // Bob animation
      enemy.mesh.position.y = 2 + Math.sin(Date.now() * 0.005 + enemy.mesh.id) * 0.1;
    }
  }

  private patrolBehavior(enemy: Enemy, delta: number) {
    const dir = enemy.targetPos.clone().sub(enemy.mesh.position);
    dir.y = 0;
    
    if (dir.length() < 2) {
      enemy.targetPos = this.getRandomPatrolPoint();
    }

    dir.normalize();
    enemy.mesh.position.addScaledVector(dir, enemy.speed * 0.5 * delta);
    enemy.mesh.lookAt(enemy.mesh.position.clone().add(dir));
  }

  private chaseBehavior(enemy: Enemy, delta: number, playerPos: THREE.Vector3) {
    const dir = playerPos.clone().sub(enemy.mesh.position);
    dir.y = 0;
    dir.normalize();

    enemy.mesh.position.addScaledVector(dir, enemy.speed * delta);
    enemy.mesh.lookAt(playerPos.x, enemy.mesh.position.y, playerPos.z);
  }

  private attackBehavior(enemy: Enemy, delta: number, playerPos: THREE.Vector3) {
    const dir = playerPos.clone().sub(enemy.mesh.position);
    dir.y = 0;
    
    if (dir.length() > 10) {
      dir.normalize();
      enemy.mesh.position.addScaledVector(dir, enemy.speed * delta);
    }
    
    enemy.mesh.lookAt(playerPos.x, enemy.mesh.position.y, playerPos.z);
  }

  damageEnemy(mesh: THREE.Object3D, damage: number) {
    // Find the enemy group
    let enemyGroup = mesh;
    while (enemyGroup.parent && !enemyGroup.userData?.isEnemy) {
      enemyGroup = enemyGroup.parent;
    }

    const enemy = this.enemies.find(e => e.mesh === enemyGroup);
    if (enemy && enemy.alive) {
      enemy.health -= damage;
      
      if (enemy.health <= 0) {
        enemy.alive = false;
        this.scene.remove(enemy.mesh);
        this.kills++;
        this.aliveCount--;
      }
    }
  }

  getEnemyMeshes(): THREE.Object3D[] {
    return this.enemies.filter(e => e.alive).map(e => e.mesh);
  }

  getAndResetKills(): number {
    const k = this.kills;
    this.kills = 0;
    return k;
  }

  getPlayerDamage(): number {
    return this.playerDamage;
  }

  getAliveCount(): number {
    return this.aliveCount;
  }
}
