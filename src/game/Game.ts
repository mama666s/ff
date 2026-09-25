import * as THREE from 'three';
import { Player } from './Player';
import { World } from './World';
import { EnemySystem } from './EnemySystem';
import { BuildSystem } from './BuildSystem';
import { LootSystem } from './LootSystem';
import { StormSystem } from './StormSystem';
import { WeaponSystem } from './WeaponSystem';
import { ParticleSystem } from './ParticleSystem';

interface GameCallbacks {
  onHealthChange: (health: number) => void;
  onShieldChange: (shield: number) => void;
  onMaterialsChange: (materials: { wood: number; stone: number; metal: number }) => void;
  onAmmoChange: (ammo: number) => void;
  onKill: () => void;
  onPlayerDeath: () => void;
  onPlayersAliveChange: (count: number) => void;
  onStormPhaseChange: (phase: number) => void;
  onStormTimerChange: (time: number) => void;
}

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLDivElement;
  private callbacks: GameCallbacks;
  private player: Player;
  private world: World;
  private enemySystem: EnemySystem;
  private buildSystem: BuildSystem;
  private lootSystem: LootSystem;
  private stormSystem: StormSystem;
  private weaponSystem: WeaponSystem;
  private particleSystem: ParticleSystem;
  private clock: THREE.Clock;
  private animationId: number = 0;
  private isRunning: boolean = false;
  private keys: Set<string> = new Set();
  private mouseDown: boolean = false;
  private rightMouseDown: boolean = false;
  private shootCooldown: number = 0;
  private buildCooldown: number = 0;
  private reloadCooldown: number = 0;

  constructor(container: HTMLDivElement, callbacks: GameCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();

    // Systems
    this.world = new World(this.scene);
    this.player = new Player(this.camera, this.scene);
    this.enemySystem = new EnemySystem(this.scene, this.world);
    this.buildSystem = new BuildSystem(this.scene, this.camera);
    this.lootSystem = new LootSystem(this.scene);
    this.stormSystem = new StormSystem(this.scene);
    this.weaponSystem = new WeaponSystem(this.scene, this.camera);
    this.particleSystem = new ParticleSystem(this.scene);

    // Event listeners
    this.setupEventListeners();
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3d6b3d, 0.3);
    this.scene.add(hemisphereLight);
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    this.renderer.domElement.addEventListener('click', () => {
      this.renderer.domElement.requestPointerLock();
    });
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === 'r' && this.reloadCooldown <= 0) {
      this.reloadCooldown = 2;
      this.weaponSystem.reload();
      this.callbacks.onAmmoChange(this.weaponSystem.getAmmo());
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) this.mouseDown = true;
    if (e.button === 2) this.rightMouseDown = true;
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.mouseDown = false;
    if (e.button === 2) this.rightMouseDown = false;
  };

  start() {
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  private animate = () => {
    if (!this.isRunning) return;
    this.animationId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.update(delta);
    this.render();
  };

  private update(delta: number) {
    // Player movement
    const moveDir = new THREE.Vector3();
    if (this.keys.has('w')) moveDir.z -= 1;
    if (this.keys.has('s')) moveDir.z += 1;
    if (this.keys.has('a')) moveDir.x -= 1;
    if (this.keys.has('d')) moveDir.x += 1;

    const isSprinting = this.keys.has('shift');
    const isJumping = this.keys.has(' ');

    this.player.update(delta, moveDir, isSprinting, isJumping);

    // Shooting
    this.shootCooldown -= delta;
    if (this.mouseDown && this.shootCooldown <= 0 && !this.buildSystem.isBuildMode()) {
      this.shoot();
      this.shootCooldown = 0.15;
    }

    // Building
    this.buildCooldown -= delta;
    if (this.mouseDown && this.buildCooldown <= 0 && this.buildSystem.isBuildMode()) {
      this.build();
      this.buildCooldown = 0.3;
    }

    // Breaking (right click)
    if (this.rightMouseDown) {
      this.breakObject();
    }

    // Reload cooldown
    this.reloadCooldown -= delta;

    // Update systems
    this.buildSystem.update(this.player.getPosition());
    this.enemySystem.update(delta, this.player.getPosition(), this.player.getRotation());
    this.lootSystem.update(delta, this.player.getPosition());
    this.stormSystem.update(delta);
    this.particleSystem.update(delta);

    // Check enemy kills
    const kills = this.enemySystem.getAndResetKills();
    for (let i = 0; i < kills; i++) {
      this.callbacks.onKill();
    }

    // Check damage to player
    const damage = this.enemySystem.getPlayerDamage();
    if (damage > 0) {
      this.player.takeDamage(damage);
      this.callbacks.onHealthChange(this.player.getHealth());
      this.callbacks.onShieldChange(this.player.getShield());
      if (this.player.isDead()) {
        this.callbacks.onPlayerDeath();
        this.isRunning = false;
      }
    }

    // Check loot pickup
    if (this.keys.has('f')) {
      const loot = this.lootSystem.getNearbyLoot(this.player.getPosition());
      if (loot) {
        if (loot.type === 'ammo') {
          this.weaponSystem.addAmmo(loot.amount);
          this.callbacks.onAmmoChange(this.weaponSystem.getAmmo());
        } else if (loot.type === 'health') {
          this.player.heal(loot.amount);
          this.callbacks.onHealthChange(this.player.getHealth());
        } else if (loot.type === 'shield') {
          this.player.addShield(loot.amount);
          this.callbacks.onShieldChange(this.player.getShield());
        } else if (loot.type === 'wood') {
          this.player.addMaterials('wood', loot.amount);
          this.callbacks.onMaterialsChange(this.player.getMaterials());
        } else if (loot.type === 'stone') {
          this.player.addMaterials('stone', loot.amount);
          this.callbacks.onMaterialsChange(this.player.getMaterials());
        } else if (loot.type === 'metal') {
          this.player.addMaterials('metal', loot.amount);
          this.callbacks.onMaterialsChange(this.player.getMaterials());
        }
        this.lootSystem.removeLoot(loot.id);
      }
    }

    // Storm damage
    if (this.stormSystem.isPlayerInStorm(this.player.getPosition())) {
      this.player.takeDamage(1 * delta);
      this.callbacks.onHealthChange(this.player.getHealth());
      if (this.player.isDead()) {
        this.callbacks.onPlayerDeath();
        this.isRunning = false;
      }
    }

    // Update storm info
    this.callbacks.onStormPhaseChange(this.stormSystem.getPhase());
    this.callbacks.onStormTimerChange(this.stormSystem.getTimer());
    this.callbacks.onPlayersAliveChange(this.enemySystem.getAliveCount() + 1);
  }

  private shoot() {
    if (this.weaponSystem.getAmmo() <= 0) return;
    
    this.weaponSystem.shoot();
    this.callbacks.onAmmoChange(this.weaponSystem.getAmmo());

    // Raycast for hit detection
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const enemies = this.enemySystem.getEnemyMeshes();
    const intersects = raycaster.intersectObjects(enemies, true);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      this.enemySystem.damageEnemy(hitObject, 25);
      this.particleSystem.createHitEffect(intersects[0].point);
    }

    // Muzzle flash
    this.particleSystem.createMuzzleFlash(this.camera.position.clone());
  }

  private build() {
    const materials = this.player.getMaterials();
    const totalMaterials = materials.wood + materials.stone + materials.metal;
    if (totalMaterials < 10) return;

    const success = this.buildSystem.placeBuild();
    if (success) {
      this.player.useMaterials(10);
      this.callbacks.onMaterialsChange(this.player.getMaterials());
    }
  }

  private breakObject() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const breakables = this.world.getBreakableObjects();
    const intersects = raycaster.intersectObjects(breakables, true);

    if (intersects.length > 0 && intersects[0].distance < 5) {
      const hitObject = intersects[0].object;
      const result = this.world.breakObject(hitObject);
      if (result) {
        this.player.addMaterials(result.type, result.amount);
        this.callbacks.onMaterialsChange(this.player.getMaterials());
        this.particleSystem.createBreakEffect(intersects[0].point, result.type);
      }
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
