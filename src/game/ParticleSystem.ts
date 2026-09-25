import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= delta;

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      
      // Gravity
      particle.velocity.y -= 10 * delta;

      // Fade out
      const opacity = particle.life / particle.maxLife;
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      
      // Scale down
      const scale = opacity;
      particle.mesh.scale.setScalar(scale);
    }
  }

  createHitEffect(position: THREE.Vector3) {
    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0.5,
        maxLife: 0.5,
      });
    }
  }

  createMuzzleFlash(position: THREE.Vector3) {
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.SphereGeometry(0.03, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        -5 + Math.random() * 2
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0.15,
        maxLife: 0.15,
      });
    }
  }

  createBreakEffect(position: THREE.Vector3, type: string) {
    const color = type === 'wood' ? 0x8B4513 : type === 'stone' ? 0x808080 : 0x4488ff;
    
    for (let i = 0; i < 12; i++) {
      const size = 0.05 + Math.random() * 0.1;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 6,
        (Math.random() - 0.5) * 8
      );

      this.particles.push({
        mesh,
        velocity,
        life: 1.0,
        maxLife: 1.0,
      });
    }
  }
}
