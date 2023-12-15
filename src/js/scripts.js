import * as THREE from 'three';
import { PointerLockControls } from 'https://threejs.org/examples/jsm/controls/PointerLockControls.js';

const renderer = new THREE.WebGLRenderer({antialias: true});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    500
);

let szin = 0x00ff00;

camera.position.set(0, 2, 5);



let lines = [];

const vertexShader = `
varying vec3 vColor;
uniform vec3 uColor;
varying float vThickness;
uniform float uThickness;
void main() {
    vColor = vec3(uColor);
    vThickness = uThickness;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uThickness;
}
`;


const fragmentShader = `
varying vec3 vColor;
varying float vThickness;
void main() {
    gl_FragColor = vec4(vColor, vThickness);
}
`;



const lineMaterial = new THREE.ShaderMaterial({
  uniforms: {
      uColor: { value: new THREE.Color(szin) },
      uThickness: {value: 20}
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: THREE.DoubleSide
});

  let lineGeometry = new THREE.BufferGeometry();
  //let lineMaterial = new THREE.LineBasicMaterial({ color: szin});
  let line = new THREE.Line(lineGeometry, lineMaterial);
  lines.push(line);
  scene.add(line);







let smallCircles = [];
let points = [];
let circles = [];
let idleTimeout;
let lastSmallCircleTime = 0
let prevTime = performance.now();
let currentLine = null;
let speed = 1;

function createCircle(x, y, radius) {
    
      const geometry = new THREE.CircleGeometry(radius, 40);
    const material = new THREE.MeshBasicMaterial({ color: szin, side: THREE.DoubleSide});
    
    const circle = new THREE.Mesh(geometry, material);
    circle.position.set(x,y,0);
    const scaleFactor = Math.random(); // A szélesség-hosszúság arány beállítása
    circle.scale.set(scaleFactor / 2, Math.random() / 2, Math.random() / 2); // A skálázás alkalmazása      
      scene.add(circle);
      circles.push(circle);
  }

  function createSmallCircle(x, y, radius) {
    const geometry = new THREE.CircleGeometry(radius, 40);
  const material = new THREE.MeshBasicMaterial({ color: szin, side: THREE.DoubleSide });
  const circle = new THREE.Mesh(geometry, material);
  circle.position.set(x, y, 0);
  scene.add(circle);
  smallCircles.push(circle);
  }

function createLine(color, thickness) {
  const lineGeometry = new THREE.BufferGeometry();
  const lineMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uThickness: { value: thickness }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide
  });
  line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);
  lines.push(line);
}

function onMouseMove(event) {
  lines[lines.length - 1].geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));//
  const time = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;
    clearTimeout(idleTimeout);
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  const vector = new THREE.Vector3(mouseX, mouseY, 0.5); //R2-ből R3-ba való képzés
  vector.unproject(camera); //figyelembe vesszük a kamera látószögét

  const dir = vector.sub(camera.position).normalize(); //irányvektor az egér poziciójából a kamera poziciójába
  const distance = -camera.position.z / dir.z; //távolság egér és kamera között
  const pos = camera.position.clone().add(dir.multiplyScalar(distance)); //a kamera új pozíciója, ezzel a skaláris szórzással megkapjuk azt a pozíciót ami az egér pozíciójához van igazítva a kamera nézőpontjából

  const speed = Math.sqrt((pos.x - points[points.length - 6]) ** 2 + (pos.y - points[points.length - 5]) ** 2) / delta *200;
  
  
  const index = points.length / 3;
  lines[lines.length - 1].geometry.setDrawRange(0, index);

  lines[lines.length - 1].material.uniforms.uThickness.value = speed;
  
  if (time - lastSmallCircleTime > 500) { 
    lastSmallCircleTime = time;
    createSmallCircle(pos.x + Math.random() / 10 , pos.y + Math.random() / 10 + Math.random(), 0.025);
    createSmallCircle(pos.x + Math.random() / 10, pos.y + Math.random() / 10 - Math.random(), 0.025);
  }
  
  idleTimeout = setTimeout(() => {
    
    const radius = Math.random();
    createCircle(pos.x, pos.y, radius);
  }, 50);

  points.push(pos.x, pos.y, pos.z);
  
}





function resetToInitialState() {
  points.forEach(point => scene.remove(point));
  circles.forEach(circle => scene.remove(circle));
  lines.forEach(line => scene.remove(line));
  smallCircles.forEach(smallcirce => scene.remove(smallcirce));
  lines.length = 0;
  circles.length = 0;
  createLine(szin);
}

document.addEventListener('dblclick', resetToInitialState);

function onMouseClick() {
  //lines.pop();
  //lines.push(currentLine);
  /*const szin = Math.random() * 0x00ff00;
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  
  
  colors.push(szin)*/
  
  lines.push({ points: points.slice(), color: szin });

  // Új pontokat inicializálunk és új színt állítunk be
  szin = Math.random() * szin;
  currentLine = createLine(szin, 20);
  points = [];
  
  
  
}


document.addEventListener('mousemove', onMouseMove);
document.addEventListener('click', onMouseClick);
//scene.add(axesHelper);



function animate() {
    
  if (lines.length > 0) {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
  }
  
  renderer.setAnimationLoop(animate);