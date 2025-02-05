class Hemisphere {
    constructor() {
      this.type = 'hemisphere';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.segments = 20; // Controls the level of detail
    }
  
    render() {
      gl.uniform4f(u_FragColor, ...this.color);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      const slices = this.segments;
      const stacks = Math.floor(this.segments / 2);
  
      // Generate curved surface
      for (let i = 0; i < stacks; i++) {
        const phi1 = (i / stacks) * (Math.PI / 2);
        const phi2 = ((i + 1) / stacks) * (Math.PI / 2);
  
        for (let j = 0; j < slices; j++) {
          const theta1 = (j / slices) * 2 * Math.PI;
          const theta2 = ((j + 1) / slices) * 2 * Math.PI;
  
          if (i === 0) { // Handle top cap
            const x3 = Math.sin(phi2) * Math.cos(theta1);
            const y3 = Math.sin(phi2) * Math.sin(theta1);
            const z3 = Math.cos(phi2);
            const x4 = Math.sin(phi2) * Math.cos(theta2);
            const y4 = Math.sin(phi2) * Math.sin(theta2);
            const z4 = Math.cos(phi2);
  
            drawTriangle3D([0, 0, 1, x3, y3, z3, x4, y4, z4]);
          } else { // Middle and bottom quads
            const x1 = Math.sin(phi1) * Math.cos(theta1);
            const y1 = Math.sin(phi1) * Math.sin(theta1);
            const z1 = Math.cos(phi1);
  
            const x2 = Math.sin(phi1) * Math.cos(theta2);
            const y2 = Math.sin(phi1) * Math.sin(theta2);
            const z2 = Math.cos(phi1);
  
            const x3 = Math.sin(phi2) * Math.cos(theta1);
            const y3 = Math.sin(phi2) * Math.sin(theta1);
            const z3 = Math.cos(phi2);
  
            const x4 = Math.sin(phi2) * Math.cos(theta2);
            const y4 = Math.sin(phi2) * Math.sin(theta2);
            const z4 = Math.cos(phi2);
  
            drawTriangle3D([x1, y1, z1, x2, y2, z2, x3, y3, z3]);
            drawTriangle3D([x3, y3, z3, x2, y2, z2, x4, y4, z4]);
          }
        }
      }
  
      // Generate flat base
      for (let j = 0; j < slices; j++) {
        const theta1 = (j / slices) * 2 * Math.PI;
        const theta2 = ((j + 1) / slices) * 2 * Math.PI;
  
        const x1 = Math.cos(theta1);
        const y1 = Math.sin(theta1);
        const x2 = Math.cos(theta2);
        const y2 = Math.sin(theta2);
  
        drawTriangle3D([0, 0, 0, x1, y1, 0, x2, y2, 0]);
      }
    }
  }