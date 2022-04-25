import * as THREE from "three";
import "./style.css";

// Variáveis de ambiente
let scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  shadowLight,
  light,
  renderer,
  canvas;

// Variáveis de tela
let windowHalfX, windowHalfY, xLimit, yLimit;

let sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// PARTES DO AVIÃO
let plane,
  bodyPlane,
  rudderPlane,
  stabilizerPlane,
  windowPlane,
  wingsPlane,
  propellerPlane;

// CARACTERÍSTICAS DO AVIÃO
// As cores são divididas em valores rgb para facilitar a transição da cor
let planeFastColor = { r: 200, g: 100, b: 100 }, // Prata avermelhado
  planeSlowColor = { r: 196, g: 206, b: 206 }, // Prata metálico
  angleWings = 0; // Ângulo das asas do avião

// PARTICULAS
// Como as partículas são recicláveis, é usado duas matrizes para armazená-las
let flyingParticles = [], // flyingParticles é usada para armazenar as particulas que estão em movimento na tela
  waitingParticles = [], // waitingParticles é usada para armazenar as particulas que não estão sendo usadas, até quando forem necessárias
  maxParticlesZ = 600, // Posição z máxima para uma particula
  particleColor = 0xf4fafc; //Branco nuvem

// VELOCIDADE
let speed = { x: 0, y: 0 };
let smoothing = 10;

// MISC
let mousePos = { x: 0, y: 0 };
let halfPI = Math.PI / 2;

const onWindowResize = () => {
  sizes.height = window.innerHeight;
  sizes.width = window.innerWidth;
  windowHalfX = sizes.height / 2;
  windowHalfY = sizes.height / 2;
  renderer.setSize(sizes.width, sizes.height);
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix(); // Força a câmera à alterar o seu aspect ratio
  // Recalculando os limites
  let ang = ((fieldOfView / 2) * Math.PI) / 180;
  yLimit = (camera.position.z + maxPartcilesZ) * Math.tan(ang);
  xLimit = yLimit * camera.aspect;
};

const handleMouseMove = (event) => {
  mousePos = { x: event.clientX, y: event.clientY };
  updateSpeed();
};

const handleTouchStart = (event) => {
  if (event.touches.length > 1) {
    event.preventDefault();
    mousePos = { x: event.touches[0].pageX, y: event.touches[0].pageY };
    updateSpeed();
  }
};

const handleTouchEnd = (event) => {
  mousePos = { x: windowHalfX, y: windowHalfY };
  updateSpeed();
};

const handleTouchMove = (event) => {
  if (event.touches.length == 1) {
    event.preventDefault();
    mousePos = { x: event.touches[0].pageX, y: event.touches[0].pageY };
    updateSpeed();
  }
};

const updateSpeed = () => {
  speed.x = (mousePos.x / sizes.width) * 100;
  speed.y = (mousePos.y - windowHalfY) / 10;
};


// ROTAÇÃO

// Rotação eixo X
const doRotationX = (theta) => {
  var c = Math.cos(theta);
  var s = Math.sin(theta);

  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.set(
    1,  0,  0,  0, 
    0,  c,  s,  0, 
    0, -s,  c,  0, 
    0,  0,  0,  1);
  return rotationMatrix;
};

// Rotação eixo Y
const doRotationY = (theta) => {
  var c = Math.cos(theta);
  var s = Math.sin(theta);

  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.set(
    c,  0,  s,  0,
    0,  1,  0,  0, 
    -s, 0,  c,  0,
    0,  0,  0,  1
  );
  return rotationMatrix;
};

// Rotação eixo Z
const doRotationZ = (theta) => {
  var c = Math.cos(theta);
  var s = Math.sin(theta);

  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.set(
    c, -s,  0,  0, 
    s,  c,  0,  0, 
    0,  0,  1,  0, 
    0,  0,  0,  1);
  return rotationMatrix;
};

// LUZES
// Uma Luz hemisphere para dar visão ambiental global
// E uma segunda para dar algumas sombras
const createLight = () => {
  light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
  scene.add(light);
  shadowLight = new THREE.DirectionalLight(0xffffff, 0.8);
  shadowLight.position.set(1, 1, 1);
  scene.add(shadowLight);
};

const createCube = (width, height, depth) => {
  const cube = new THREE.BufferGeometry();

  // Divisão das medidas pela metade para que seja inserido nos vértices
  const widthVertex = width / 2,
    heightVertex = height / 2,
    depthVertex = depth / 2;

  // Array de vértices
  const vertices = [
    // Frente
    {
      pos: [-widthVertex, -heightVertex, depthVertex],
      norm: [0, 0, 1],
      uv: [0, 1],
    },
    {
      pos: [widthVertex, -heightVertex, depthVertex],
      norm: [0, 0, 1],
      uv: [1, 1],
    },
    {
      pos: [-widthVertex, heightVertex, depthVertex],
      norm: [0, 0, 1],
      uv: [0, 0],
    },

    {
      pos: [-widthVertex, heightVertex, depthVertex],
      norm: [0, 0, 1],
      uv: [0, 0],
    },
    {
      pos: [widthVertex, -heightVertex, depthVertex],
      norm: [0, 0, 1],
      uv: [1, 1],
    },
    {
      pos: [widthVertex, heightVertex, depthVertex],
      norm: [0, 0, 1],
      uv: [1, 0],
    },
    // Direita
    {
      pos: [widthVertex, -heightVertex, depthVertex],
      norm: [1, 0, 0],
      uv: [0, 1],
    },
    {
      pos: [widthVertex, -heightVertex, -depthVertex],
      norm: [1, 0, 0],
      uv: [1, 1],
    },
    {
      pos: [widthVertex, heightVertex, depthVertex],
      norm: [1, 0, 0],
      uv: [0, 0],
    },

    {
      pos: [widthVertex, heightVertex, depthVertex],
      norm: [1, 0, 0],
      uv: [0, 0],
    },
    {
      pos: [widthVertex, -heightVertex, -depthVertex],
      norm: [1, 0, 0],
      uv: [1, 1],
    },
    {
      pos: [widthVertex, heightVertex, -depthVertex],
      norm: [1, 0, 0],
      uv: [1, 0],
    },
    // Atrás
    {
      pos: [widthVertex, -heightVertex, -depthVertex],
      norm: [0, 0, -1],
      uv: [0, 1],
    },
    {
      pos: [-widthVertex, -heightVertex, -depthVertex],
      norm: [0, 0, -1],
      uv: [1, 1],
    },
    {
      pos: [widthVertex, heightVertex, -depthVertex],
      norm: [0, 0, -1],
      uv: [0, 0],
    },

    {
      pos: [widthVertex, heightVertex, -depthVertex],
      norm: [0, 0, -1],
      uv: [0, 0],
    },
    {
      pos: [-widthVertex, -heightVertex, -depthVertex],
      norm: [0, 0, -1],
      uv: [1, 1],
    },
    {
      pos: [-widthVertex, heightVertex, -depthVertex],
      norm: [0, 0, -1],
      uv: [1, 0],
    },
    // Esquerda
    {
      pos: [-widthVertex, -heightVertex, -depthVertex],
      norm: [-1, 0, 0],
      uv: [0, 1],
    },
    {
      pos: [-widthVertex, -heightVertex, depthVertex],
      norm: [-1, 0, 0],
      uv: [1, 1],
    },
    {
      pos: [-widthVertex, heightVertex, -depthVertex],
      norm: [-1, 0, 0],
      uv: [0, 0],
    },

    {
      pos: [-widthVertex, heightVertex, -depthVertex],
      norm: [-1, 0, 0],
      uv: [0, 0],
    },
    {
      pos: [-widthVertex, -heightVertex, depthVertex],
      norm: [-1, 0, 0],
      uv: [1, 1],
    },
    {
      pos: [-widthVertex, heightVertex, depthVertex],
      norm: [-1, 0, 0],
      uv: [1, 0],
    },
    // Topo
    {
      pos: [widthVertex, heightVertex, -depthVertex],
      norm: [0, 1, 0],
      uv: [0, 1],
    },
    {
      pos: [-widthVertex, heightVertex, -depthVertex],
      norm: [0, 1, 0],
      uv: [1, 1],
    },
    {
      pos: [widthVertex, heightVertex, depthVertex],
      norm: [0, 1, 0],
      uv: [0, 0],
    },

    {
      pos: [widthVertex, heightVertex, depthVertex],
      norm: [0, 1, 0],
      uv: [0, 0],
    },
    {
      pos: [-widthVertex, heightVertex, -depthVertex],
      norm: [0, 1, 0],
      uv: [1, 1],
    },
    {
      pos: [-widthVertex, heightVertex, depthVertex],
      norm: [0, 1, 0],
      uv: [1, 0],
    },
    // Embaixo
    {
      pos: [widthVertex, -heightVertex, depthVertex],
      norm: [0, -1, 0],
      uv: [0, 1],
    },
    {
      pos: [-widthVertex, -heightVertex, depthVertex],
      norm: [0, -1, 0],
      uv: [1, 1],
    },
    {
      pos: [widthVertex, -heightVertex, -depthVertex],
      norm: [0, -1, 0],
      uv: [0, 0],
    },

    {
      pos: [widthVertex, -heightVertex, -depthVertex],
      norm: [0, -1, 0],
      uv: [0, 0],
    },
    {
      pos: [-widthVertex, -heightVertex, depthVertex],
      norm: [0, -1, 0],
      uv: [1, 1],
    },
    {
      pos: [-widthVertex, -heightVertex, -depthVertex],
      norm: [0, -1, 0],
      uv: [1, 0],
    },
  ];

  const positions = []; // Matriz de pontos do cubo
  const normals = []; // Matriz de vetores normais do cubo
  const uvs = []; // Matriz do mapeamento UV do cubo

  for (const vertex of vertices) {
    // Atribuição dos valores o array de objeto para os arrays separados
    positions.push(...vertex.pos);
    normals.push(...vertex.norm);
    uvs.push(...vertex.uv);
  }

  const positionNumComponents = 3; // Quantidade de valores que formam um vértíce
  const normalNumComponents = 3; // Quantidade de valores que formam um vetor normal
  const uvNumComponents = 2; // Quantidade de valores que o mapeamento UV do vértice

  // Atribuindo os valores dos atributos para a formação da estrutura do cubo
  cube.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array(positions),
      positionNumComponents
    )
  );
  cube.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents)
  );
  cube.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents)
  );

  return cube;
};

const createPyramid = (width, height, depth) => {
  const pyramid = new THREE.BufferGeometry();

  // Divisão das medidas pela metade para que seja inserido nos vértices
  const widthVertex = width / 2,
    heightVertex = height / 2,
    depthVertex = depth / 2;

  // Array de vértices
  let positions = [
    0,
    heightVertex,
    0, //0
    -widthVertex,
    -heightVertex,
    -depthVertex, //1
    -widthVertex,
    -heightVertex,
    depthVertex, //2
    widthVertex,
    -heightVertex,
    depthVertex, //3
    widthVertex,
    -heightVertex,
    -depthVertex, //4
  ];

  const positionNumComponents = 3; // Quantidade de valores que formam um vértíce
  // Atribuindo os valores dos atributos para a formação da estrutura do cubo
  pyramid.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array(positions),
      positionNumComponents
    )
  );

  // Determinando qual vértice se conecta entre si, para não haver a necessidade de vértices repetidos
  pyramid.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1, 1, 3, 2, 1, 4, 3]);
  pyramid.computeVertexNormals(); // Determina os vetores normais, calculando a média das normais das faces

  return pyramid;
};

const createPlane = () => {
  // Um grupo que vai conter cada parte do avião
  plane = new THREE.Group();

  // CORPO
  let bodyGeom = createCube(240, 60, 60);
  let bodyMat = new THREE.MeshLambertMaterial({
    color: 0xc4cece,
  });
  bodyPlane = new THREE.Mesh(bodyGeom, bodyMat);

  // ASA
  let wingGeom = createPyramid(60, 60, 60);
  let wingMat = new THREE.MeshLambertMaterial({
    color: 0xdc143c,
  });

  wingsPlane = new THREE.Mesh(wingGeom, wingMat);
  wingsPlane.scale.set(8, 1, 0.1);

  //wingsPlane.rotation.x = halfPI;
  //wingsPlane.rotation.z = -halfPI;

  wingsPlane.applyMatrix4(doRotationX(halfPI));
  wingsPlane.applyMatrix4(doRotationY(halfPI));

  wingsPlane.position.x = 0;
  wingsPlane.position.y = 0;
  wingsPlane.position.z = 0;

  // LEME
  rudderPlane = new THREE.Mesh(wingGeom, wingMat);
  rudderPlane.scale.set(1.5, 1, 0.1);
  rudderPlane.position.x = -90;
  rudderPlane.position.y = 30;
  rudderPlane.rotation.z = -halfPI;

  // ESTABILIZADOR
  stabilizerPlane = new THREE.Mesh(wingGeom, wingMat);
  stabilizerPlane.scale.set(4, 1, 0.1);
  stabilizerPlane.position.x = -90;
  stabilizerPlane.position.y = -10;
  stabilizerPlane.rotation.x = halfPI;
  stabilizerPlane.rotation.z = -halfPI;

  // JANELA
  let windowGeom = createCube(30, 30, 30);
  let windowMat = new THREE.MeshLambertMaterial({
    color: 0x00abff,
  });
  windowPlane = new THREE.Mesh(windowGeom, windowMat);
  windowPlane.position.x = 30;
  windowPlane.position.y = 40;

  //HÉLICE
  let propellerGeom = createCube(5, 120, 15);
  let propeller = new THREE.MeshLambertMaterial({
    color: 0xdc143c,
  });
  let prop1 = new THREE.Mesh(propellerGeom, propeller);
  prop1.position.x = 122;

  let prop2 = prop1.clone();
  // prop2.rotation.x = Math.PI / 2;
  prop2.applyMatrix4(doRotationX(Math.PI / 2));

  propellerPlane = new THREE.Group();

  propellerPlane.add(prop1);
  propellerPlane.add(prop2);

  plane.add(bodyPlane);
  plane.add(rudderPlane);
  plane.add(stabilizerPlane);
  plane.add(wingsPlane);
  plane.add(windowPlane);
  plane.add(propellerPlane);

  plane.rotation.y = -Math.PI / 4;
  scene.add(plane);
};

// PARTICULAS
const createParticle = () => {
  let particle, geometryCore, width, height, depth;
  // 2 formas são usadas e escolhidas de forma randômica
  let random = Math.random();
  width = 10 + Math.random() * 40;
  height = 10 + Math.random() * 40;
  depth = 10 + Math.random() * 40;

  // CUBO
  if (random < 0.33) {
    geometryCore = createCube(width, height, depth);
  }
  // PIRÂMIDE
  else if (random < 0.66) {
    geometryCore = createPyramid(width, height, depth);
  }
  // ESFERA, mas com a quantidade de segmentos randomizado
  else {
    let radius = 5 + Math.random() * 40;
    let horizontalSegments = 2 + Math.floor(Math.random() * 2);
    let verticalSegments = 2 + Math.floor(Math.random() * 2);
    geometryCore = new THREE.SphereGeometry(
      radius,
      horizontalSegments,
      verticalSegments
    );
  }

  let materialCore = new THREE.MeshLambertMaterial({
    color: particleColor,
  });

  particle = new THREE.Mesh(geometryCore, materialCore);
  return particle;
};

const getParticle = () => {
  if (waitingParticles.length) {
    return waitingParticles.pop();
  } else {
    return createParticle();
  }
};

const flyParticle = () => {
  let particle = getParticle();
  // Seleciona a posição da particula de forma randômica, mas a inicia fora do campo de visão e a dá uma escala também randômica
  particle.position.x = xLimit;
  particle.position.y = Math.random() * yLimit * 2 - yLimit;
  particle.position.z = Math.random() * maxParticlesZ;
  let scale = 0.2 + Math.random();
  particle.scale.set(scale, scale, scale);
  flyingParticles.push(particle);
  scene.add(particle);
};

const init = () => {
  // Cria a cena;
  scene = new THREE.Scene();

  // Cria a câmera
  aspectRatio = sizes.width / sizes.height;
  fieldOfView = 60;
  nearPlane = 1; // A câmera não vera nenhum objeto colocado à frente desse plano
  farPlane = 2000; // A câmera não vera nenhum objeto além desse plano
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.z = 1000;

  // Cria o canvas que renderiza o WebGL dentro da div background
  canvas = document.querySelector("canvas.webgl");
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(sizes.width, sizes.height);

  /*
        Como vou reciclar as partículas, preciso saber os limites esquerdo e direito que elas podem voar sem desaparecer dentro do campo de visão da câmera.
        Assim que uma partícula está fora da visão da câmera, posso reciclá-la, ou seja, removê-la da matriz flyingParticles e colocá-la na matriz waitParticles.
        Em vez disso, prefiro pré-calcular a coordenada x a partir da qual uma partícula não é mais visível. Mas isso depende da posição z da partícula.
        Aqui eu decidi usar a posição z mais distante possível para uma partícula, para ter certeza de que todas as partículas não serão recicladas antes de saírem da visão da câmera.
    */

  // Converte o campo de visão em radianos
  let ang = ((fieldOfView / 2) * Math.PI) / 180;
  // Calcula a posição y máxima vista pela câmera, relacionada a posição maxParticlesZ. Eu começo calculando o limite y, pois fieldOfView é um campo de visão vertical. Só então que eu calculo o limite x.
  yLimit = (camera.position.z + maxParticlesZ) * Math.tan(ang);
  // Calcula a posição y máxima vista pela câmera, relacionada ao limite de y
  xLimit = yLimit * camera.aspect;

  // Pré-calcula o centro da tela. Usado para atualizar a velocidade dependendo da posição do mouse
  windowHalfX = sizes.width / 2;
  windowHalfY = sizes.height / 2;

  // Cuida dos eventos de redimensionamento e de movimento do mouse
  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("mousemove", handleMouseMove, false);

  // Adaptação para funcionar em mobile também
  document.addEventListener("touchstart", handleTouchStart, false);
  document.addEventListener("touchend", handleTouchEnd, false);
  document.addEventListener("touchmove", handleTouchMove, false);
};

const loop = () => {
  // Atualizar a posição, rotação e escala do avião dependendo da posição do mouse
  // Para fazer atualizações mais suaves de cada valor, usei a seguinte fórmula :
  // currentValue += (targetValue - currentValue) / smoothing

  // Faz o avião se inclinar em relação à direção do mouse;
  plane.rotation.z += (-speed.y / 50 - plane.rotation.z) / smoothing;
  plane.rotation.x += (-speed.y / 50 - plane.rotation.x) / smoothing;
  plane.rotation.y += (-speed.y / 50 - plane.rotation.y) / smoothing;

  // Faz o avião se mover em relação à direção do mouse;
  plane.position.x += (mousePos.x - windowHalfX - plane.position.x) / smoothing;
  plane.position.y += (-speed.y * 10 - plane.position.y) / smoothing;

  // Em vista a otimização, pré-calculei valores de velocidade inferiores que derivam de speed.x
  let v1 = speed.x / 70; // Usado para balanço e mudança de cor
  let v2 = speed.x / 300; // Usado para escala

  // Váriavel que sempre está recebendo o valor de v1 para ser usado no cálculo do seno e cosseno para gerar um movimento cíclico
  angleWings += v1;
  // Variáveis que armazenam os valores ciclicos para gerar o balanço do avião e o movimento do leme
  let backRudderCycle = Math.cos(angleWings / 3);
  let bodyCycle = Math.sin(angleWings / 5);

  // Implementação dos movimento ciclicos
  rudderPlane.rotation.y = backRudderCycle * 0.5;
  bodyPlane.rotation.x = bodyCycle * 0.2;
  windowPlane.rotation.x = bodyCycle * 0.2;
  stabilizerPlane.rotation.x = halfPI + bodyCycle * 0.2;
  wingsPlane.rotation.x = halfPI + bodyCycle * 0.2;

  // Movimento das hélices, que possui uma rotação mínima e máxima que varia conforme a speed.x
  let propellerSpeed = Math.min(70, Math.max(50, speed.x));
  propellerPlane.rotation.x += propellerSpeed;

  // A cor muda conforme a velocidade. Quanto mais rápido, mais vermelho, para dar uma impressão da fuselagem se aquecendo
  let rvalue =
    (planeSlowColor.r + (planeFastColor.r - planeSlowColor.r) * v1) / 255;
  let gvalue =
    (planeSlowColor.g + (planeFastColor.g - planeSlowColor.g) * v1) / 255;
  let bvalue =
    (planeSlowColor.b + (planeFastColor.b - planeSlowColor.b) * v1) / 255;
  bodyPlane.material.color.setRGB(rvalue, gvalue, bvalue);

  // O avião estica quando está mais rápido, para dar uma impressão de velocidade e dilatação térmica
  plane.scale.set(1 + v2, 1 - v2, 1 - v2);

  // Atualização das particulas
  for (let i = 0; i < flyingParticles.length; i++) {
    let particle = flyingParticles[i];
    particle.rotation.y += (1 / particle.scale.x) * 0.05;
    particle.rotation.x += (1 / particle.scale.x) * 0.05;
    particle.rotation.z += (1 / particle.scale.x) * 0.05;
    particle.position.x += -10 - (1 / particle.scale.x) * speed.x * 0.2;
    particle.position.y += (1 / particle.scale.x) * speed.y * 0.2;
    if (particle.position.x < -xLimit - 80) {
      // Verifica se a partícula está fora do campo de visão
      scene.remove(particle);
      waitingParticles.push(flyingParticles.splice(i, 1)[0]); // Recicla a particula
      i--;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
};

init();
createLight();
createPlane();
createParticle();
loop();
setInterval(flyParticle, 20); // Lança uma nova partícula à cada 20ms
