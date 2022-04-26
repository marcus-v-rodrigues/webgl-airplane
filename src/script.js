import * as THREE from 'three'
import { Plane } from 'three';
import './style.css'

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
let windowHalfX,
    windowHalfY,
    xLimit,
    yLimit;

let sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

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
let planeFastColor = {
        r: 200,
        g: 100,
        b: 100
    }, // Prata avermelhado
    planeSlowColor = {
        r: 196,
        g: 206,
        b: 206
    }, // Prata metálico
    angleWings = 0; // Ângulo das asas do avião

// PARTICULAS
// Como as partículas são recicláveis, é usado duas matrizes para armazená-las
let flyingParticles = [], // flyingParticles é usada para armazenar as particulas que estão em movimento na tela
    waitingParticles = [], // waitingParticles é usada para armazenar as particulas que não estão sendo usadas, até quando forem necessárias
    maxParticlesZ = 600, // Posição z máxima para uma particula
    particleColor = 0xF4FAFC; //Branco nuvem

// VELOCIDADE
let speed = {
    x: 0,
    y: 0
};
let smoothing = 10;

// MISC
let mousePos = {
    x: 0,
    y: 0
};
let halfPI = Math.PI / 2;

// HANDLERS E AUXILIARES
const onWindowResize = () => {
    sizes.height = window.innerHeight;
    sizes.width = window.innerWidth;
    windowHalfX = sizes.height / 2;
    windowHalfY = sizes.height / 2;
    renderer.setSize(sizes.width, sizes.height);
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix(); // Força a câmera à alterar o seu aspect ratio
    // Recalculando os limites
    let ang = (fieldOfView / 2) * Math.PI / 180;
    yLimit = (camera.position.z + maxPartcilesZ) * Math.tan(ang);
    xLimit = yLimit * camera.aspect * 2;
}

const handleMouseMove = (event) => {
    mousePos = {
        x: event.clientX,
        y: event.clientY
    };
    updateSpeed();
}

const handleTouchStart = (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
        mousePos = {
            x: event.touches[0].pageX,
            y: event.touches[0].pageY
        };
        updateSpeed();
    }
}

const handleTouchEnd = (event) => {
    mousePos = {
        x: windowHalfX,
        y: windowHalfY
    };
    updateSpeed();
}

const handleTouchMove = (event) => {
    if (event.touches.length == 1) {
        event.preventDefault();
        mousePos = {
            x: event.touches[0].pageX,
            y: event.touches[0].pageY
        };
        updateSpeed();
    }
}

const updateSpeed = () => {
    speed.x = (mousePos.x / sizes.width) * 100;
    speed.y = (mousePos.y - windowHalfY) / 10;
}

// LUZES
// Uma Luz hemisphere para dar visão ambiental global
// E uma segunda para dar algumas sombras
const createLight = () => {
    light = new THREE.HemisphereLight(0xffffff, 0xffffff, .3)
    scene.add(light);
    shadowLight = new THREE.DirectionalLight(0xffffff, .8);
    shadowLight.position.set(1, 1, 1);
    scene.add(shadowLight);
}

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

    for (const vertex of vertices) { // Atribuição dos valores o array de objeto para os arrays separados
        positions.push(...vertex.pos);
        normals.push(...vertex.norm);
        uvs.push(...vertex.uv);
    }

    const positionNumComponents = 3; // Quantidade de valores que formam um vértíce
    const normalNumComponents = 3; // Quantidade de valores que formam um vetor normal
    const uvNumComponents = 2; // Quantidade de valores que o mapeamento UV do vértice

    // Atribuindo os valores dos atributos para a formação da estrutura do cubo
    cube.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
    cube.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
    cube.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));

    return cube;
}

const createPyramid = (width, height, depth) => {
    const pyramid = new THREE.BufferGeometry();

    // Divisão das medidas pela metade para que seja inserido nos vértices
    const widthVertex = width / 2,
        heightVertex = height / 2,
        depthVertex = depth / 2;

    // Array de vértices
    let positions = [
        0, heightVertex, 0, //0
        -widthVertex, -heightVertex, -depthVertex, //1
        -widthVertex, -heightVertex, depthVertex, //2
        widthVertex, -heightVertex, depthVertex, //3
        widthVertex, -heightVertex, -depthVertex //4
    ];

    const positionNumComponents = 3; // Quantidade de valores que formam um vértíce
    // Atribuindo os valores dos atributos para a formação da estrutura do cubo
    pyramid.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));

    // Determinando qual vértice se conecta entre si, para não haver a necessidade de vértices repetidos
    pyramid.setIndex([
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        0, 4, 1,
        1, 3, 2,
        1, 4, 3
    ]);
    pyramid.computeVertexNormals(); // Determina os vetores normais, calculando a média das normais das faces

    return pyramid;
}

// TRANSFORMAÇÕES MATRICIAIS
// Translação
const doTranslation = (x, y, z) => {
    let translationMatrix = new THREE.Matrix4().set(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
    );
    return translationMatrix;
}

// Escala
const doScale = (x, y, z) => {
    let scaleMatrix = new THREE.Matrix4().set(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    );
    return scaleMatrix;
}

// ROTAÇÃO
// Rotação eixo X
const doRotationX = (theta) => {
    let c = Math.cos(theta);
    let s = Math.sin(theta);

    let rotationMatrix = new THREE.Matrix4().set(
        1, 0, 0, 0,
        0, c,-s, 0,
        0, s, c, 0,
        0, 0, 0, 1);

    return rotationMatrix;
};

// Rotação eixo Y
const doRotationY = (theta) => {
    let c = Math.cos(theta);
    let s = Math.sin(theta);

    let rotationMatrix = new THREE.Matrix4().set(
        c, 0, s, 0,
        0, 1, 0, 0,
       -s, 0, c, 0,
        0, 0, 0, 1
    );
    return rotationMatrix;
};

// Rotação eixo Z
const doRotationZ = (theta) => {
    let c = Math.cos(theta);
    let s = Math.sin(theta);

    let rotationMatrix = new THREE.Matrix4().set(
        c,-s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1);
    return rotationMatrix;
};

const createPlane = () => {
    // Um grupo que vai conter cada parte do avião
    plane = new THREE.Group();
  
    // CORPO
    let bodyGeom = createCube(240, 60, 60);
    let bodyMat = new THREE.MeshLambertMaterial({
      color: 0xc4cece, // Azul escuro
    });
    bodyPlane = new THREE.Mesh(bodyGeom, bodyMat);
  
    // ASA
    let wingGeom = createPyramid(60, 60, 60);
    let wingMat = new THREE.MeshLambertMaterial({
      color: 0xdc143c, // Verde
    });
  
    wingsPlane = new THREE.Mesh(wingGeom, wingMat);
    wingsPlane.applyMatrix4(doScale(8, 1, 0.1));
    wingsPlane.applyMatrix4(doRotationX(halfPI));
    wingsPlane.applyMatrix4(doRotationY(halfPI));
    wingsPlane.applyMatrix4(doTranslation(0, 0, 0));
  
    // LEME
    rudderPlane = new THREE.Mesh(wingGeom, wingMat);
  
    rudderPlane.applyMatrix4(doScale(1.5, 1, 0.1));
    rudderPlane.applyMatrix4(doRotationZ(-halfPI));
    rudderPlane.applyMatrix4(doTranslation(-90, 30, 0));
  
    // ESTABILIZADOR
    stabilizerPlane = new THREE.Mesh(wingGeom, wingMat);
  
    stabilizerPlane.applyMatrix4(doScale(4, 1, 0.1));
    stabilizerPlane.applyMatrix4(doRotationX(halfPI));
    stabilizerPlane.applyMatrix4(doRotationY(halfPI));
    stabilizerPlane.applyMatrix4(doTranslation(-90, 0, 0));
  
    // JANELA
    let windowGeom = createCube(30, 30, 30);
    let windowMat = new THREE.MeshLambertMaterial({
      color: 0x00abff,
    });
  
    windowPlane = new THREE.Mesh(windowGeom, windowMat);
    windowPlane.applyMatrix4(doTranslation(30, 40, 0));
  
    //HÉLICE
    let propellerGeom = createCube(5, 120, 15);
    let propeller = new THREE.MeshLambertMaterial({
      color: 0xdc143c,
    });
    let prop1 = new THREE.Mesh(propellerGeom, propeller);
    prop1.applyMatrix4(doTranslation(122, 0, 0));
  
    let prop2 = prop1.clone();
    prop2.applyMatrix4(doRotationX(halfPI));
  
    propellerPlane = new THREE.Group();
  
    propellerPlane.add(prop1);
    propellerPlane.add(prop2);
  
    plane.add(bodyPlane);
    plane.add(rudderPlane);
    plane.add(stabilizerPlane);
    plane.add(wingsPlane);
    plane.add(windowPlane);
    plane.add(propellerPlane);
  
    plane.applyMatrix4(doRotationY(-Math.PI / 4));
    scene.add(plane);
  };

// PARTICULAS
const createParticle = () => {
    let particle, geometryCore, width, height, depth
    // 3 formas são usadas e escolhidas de forma randômica
    let random = Math.random();
    width = 30 + Math.random() * 40;
    height = 30 + Math.random() * 40;
    depth = 30 + Math.random() * 40;

    // CUBO
    if (random < .33) {
        geometryCore = createCube(width, height, depth);
    }
    // PIRÂMIDE
    else if (random < .66) {
        geometryCore = createPyramid(width, height, depth);
    }
    // ESFERA, mas com a quantidade de segmentos randomizado
    else {
        let radius = 5 + Math.random() * 40;
        let horizontalSegments = 2 + Math.floor(Math.random() * 2);
        let verticalSegments = 2 + Math.floor(Math.random() * 2);
        geometryCore = new THREE.SphereGeometry(radius, horizontalSegments, verticalSegments);
    }

    let materialCore = new THREE.MeshLambertMaterial({
        color: particleColor
    });

    particle = new THREE.Mesh(geometryCore, materialCore);
    return particle;
}

const getParticle = () => {
    if (waitingParticles.length) {
        return waitingParticles.pop();
    } else {
        return createParticle();
    }
}

const flyParticle = () => {
    let particle = getParticle();
    // Seleciona a posição da particula de forma randômica, mas a inicia fora do campo de visão e a dá uma escala também randômica 
    let x = xLimit,
        y = Math.random() * yLimit * 2 - yLimit,
        z = Math.random() * maxParticlesZ * 2 + 1,
        scale = .2 + Math.random();
    particle.applyMatrix4(doTranslation(x, y, z));
    particle.applyMatrix4(doScale(scale, scale, scale));
    flyingParticles.push(particle);
    scene.add(particle);
}

const init = () => {
    // Cria a cena;
    scene = new THREE.Scene();

    // Cria a câmera
    aspectRatio = sizes.width / sizes.height;
    fieldOfView = 60;
    nearPlane = 1; // A câmera não vera nenhum objeto colocado à frente desse plano
    farPlane = 3000; // A câmera não vera nenhum objeto além desse plano
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane);
    camera.position.z = 1000;

    // Cria o canvas que renderiza o WebGL dentro da div background 
    canvas = document.querySelector('canvas.webgl');
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(sizes.width, sizes.height);

    /*
        Como vou reciclar as partículas, preciso saber os limites esquerdo e direito que elas podem voar sem desaparecer dentro do campo de visão da câmera.
        Assim que uma partícula está fora da visão da câmera, posso reciclá-la, ou seja, removê-la da matriz flyingParticles e colocá-la na matriz waitParticles.
        Em vez disso, prefiro pré-calcular a coordenada x a partir da qual uma partícula não é mais visível. Mas isso depende da posição z da partícula.
        Aqui eu decidi usar a posição z mais distante possível para uma partícula, para ter certeza de que todas as partículas não serão recicladas antes de saírem da visão da câmera.
    */

    // Converte o campo de visão em radianos
    let ang = (fieldOfView / 2) * Math.PI / 180;
    // Calcula a posição y máxima vista pela câmera, relacionada a posição maxParticlesZ. Eu começo calculando o limite y, pois fieldOfView é um campo de visão vertical. Só então que eu calculo o limite x.
    yLimit = (camera.position.z + maxParticlesZ) * Math.tan(ang);
    // Calcula a posição y máxima vista pela câmera, relacionada ao limite de y
    xLimit = yLimit * camera.aspect * 2;

    // Pré-calcula o centro da tela. Usado para atualizar a velocidade dependendo da posição do mouse
    windowHalfX = sizes.width / 2;
    windowHalfY = sizes.height / 2;

    // Cuida dos eventos de redimensionamento e de movimento do mouse
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', handleMouseMove, false);

    // Adaptação para funcionar em mobile também
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchend', handleTouchEnd, false);
    document.addEventListener('touchmove', handleTouchMove, false);
}

const loop = () => {
    // Atualizar a posição, rotação e escala do avião dependendo da posição do mouse
    // Para fazer atualizações mais suaves de cada valor, usei a seguinte fórmula :
    // currentValue += (targetValue - currentValue) / smoothing

    let translationPlane = new THREE.Vector3(),
        rotationQuaternionPlane = new THREE.Quaternion(),
        scalePlane = new THREE.Vector3(),
        rotationPlane = new THREE.Euler();

    plane.matrix.decompose(translationPlane, rotationQuaternionPlane, scalePlane);
    rotationPlane.setFromQuaternion(rotationQuaternionPlane);

    // Faz o avião se inclinar em relação à direção do mouse; 
    let sumRotationXPlane = ((-speed.y / 50) - rotationPlane.x) / smoothing,
        sumRotationYPlane = ((-speed.y / 50) - rotationPlane.y) / smoothing,
        sumRotationZPlane = ((-speed.y / 50) - rotationPlane.z) / smoothing;

    plane.applyMatrix4(doRotationZ(sumRotationZPlane));
    plane.applyMatrix4(doRotationX(sumRotationXPlane));
    plane.applyMatrix4(doRotationY(sumRotationYPlane));

    // Faz o avião se mover em relação à direção do mouse
    let sumPositionXPlane = (((mousePos.x - windowHalfX)) - translationPlane.x) / smoothing,
        sumPositionYPlane = ((-speed.y * 10) - translationPlane.y) / smoothing;

    plane.applyMatrix4(doTranslation(sumPositionXPlane, sumPositionYPlane, -translationPlane.z));

    // Em vista a otimização, pré-calculei valores de velocidade inferiores que derivam de speed.x 
    let v1 = speed.x / 70; // Usado para balanço e mudança de cor 
    let v2 = speed.x / 300; // Usado para escala

    // Váriavel que sempre está recebendo o valor de v1 para ser usado no cálculo do seno e cosseno para gerar um movimento cíclico
    angleWings += v1;
    // Variáveis que armazenam os valores ciclicos para gerar o balanço do avião e o movimento do leme
    let backRudderCycle = Math.cos(angleWings / 3);
    let bodyCycle = Math.sin(angleWings / 5);

    // Implementação dos movimento ciclicos
    rudderPlane.matrix.set(doRotationY(backRudderCycle * .5));
    rudderPlane.updateMatrix();

    bodyPlane.matrix.set(doRotationX(bodyCycle * .2));
    bodyPlane.updateMatrix();

    windowPlane.matrix.set(doRotationX(bodyCycle * .2));
    windowPlane.updateMatrix();

    stabilizerPlane.matrix.set(doRotationX(halfPI + bodyCycle * .2));
    stabilizerPlane.updateMatrix();

    wingsPlane.matrix.set(doRotationX(halfPI + bodyCycle * .2));
    wingsPlane.updateMatrix();

    // O avião estica quando está mais rápido, para dar uma impressão de velocidade e dilatação térmica;
    plane.matrix.set(doScale(v2, 1 - v2, 1 - v2));
    plane.updateMatrix();

    // Movimento das hélices, que possui uma rotação mínima e máxima que varia conforme a speed.x
    let propellerSpeed = Math.min(70, Math.max(50, (speed.x)));
    propellerPlane.applyMatrix4(doRotationX(propellerSpeed));

    // A cor muda conforme a velocidade. Quanto mais rápido, mais vermelho, para dar uma impressão da fuselagem se aquecendo
    let rvalue = (planeSlowColor.r + (planeFastColor.r - planeSlowColor.r) * v1) / 255;
    let gvalue = (planeSlowColor.g + (planeFastColor.g - planeSlowColor.g) * v1) / 255;
    let bvalue = (planeSlowColor.b + (planeFastColor.b - planeSlowColor.b) * v1) / 255;
    bodyPlane.material.color.setRGB(rvalue, gvalue, bvalue);

    rudderPlane.rotation.y = backRudderCycle * .5;
    bodyPlane.rotation.x = bodyCycle * .2;
    windowPlane.rotation.x = bodyCycle * .2;
    stabilizerPlane.rotation.x = halfPI + bodyCycle * .2;
    wingsPlane.rotation.x = halfPI + bodyCycle * .2;
    plane.scale.set(1 + v2, 1 - v2, 1 - v2);

    // Atualização das particulas
    for (let i = 0; i < flyingParticles.length; i++) {
        let particle = flyingParticles[i];

        let translationParticle = new THREE.Vector3(),
        rotationQuaternionParticle = new THREE.Quaternion(),
        scaleParticle = new THREE.Vector3();

        plane.matrix.decompose(translationParticle, rotationQuaternionParticle, scaleParticle);
        
        let x = -10 - (1 / scaleParticle.x) * speed.x * .4;
        let y = (1 / scaleParticle.x) * speed.y;
        let rotation = (1 / scaleParticle.x) / 200;

        particle.applyMatrix4(doRotationX(rotation*2));
        particle.applyMatrix4(doRotationY(rotation));
        particle.applyMatrix4(doTranslation(x, y, 0));

        if (translationParticle.x < -xLimit / 2) { // Verifica se a partícula está fora do campo de visão
            scene.remove(particle);
            waitingParticles.push(flyingParticles.splice(i, 1)[0]); // Recicla a particula
            i--;
        }
    }

    // Velocímetro
    let speedometer = document.querySelector('span.speedometer');
    let kmhSpeed = Math.floor(speed.x * 8);
    speedometer.innerHTML = Math.max(200, kmhSpeed);
    if(kmhSpeed >= 700) {
        speedometer.classList.add("max_speed");
    }
    else {
        speedometer.classList.remove("max_speed"); 
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

init();
createLight();
createPlane();
createParticle();
loop();
setInterval(flyParticle, 40); // Lança uma nova partícula à cada 40ms