// Abhi Aiyer · Mastra · "TypeScript BEATS Python when building AI Agents" (6AbmRwKoF1U)
// Short black tousled hair going grey at the temples, a navy ribbed zip jacket (white stripe in the collar)
// open over a light-blue button-down and a black tee; he talks with his right hand up, turning it over.
ktGuest('abhi-aiyer', function (K) {
  var HH = K.HH;
  // his face: straight dark brows, a broad nose, an easy half-smile
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSSSSSSSSSSS', 'SSSmSSSSmSSS', 'SSSSmmmmSSSS', 'sSSSSSSSSSSs'];
  var TOUSLE = { all: 'H', t: ['HGhHGHhGHHhG', 'hHGHhHHGhHGH', 'GHhHHGhHGhHH'], f: ['GhHGhHGhHGhG', 'HhHHhHHhHHhH'] };
  var TUFT = { all: 'H', f: ['GhG', 'HhH'], t: 'G' };
  // the jacket hangs open: navy, a white stripe down each side of the collar, the light-blue shirt, the black tee
  // (the tee sits a step down its ramp so it reads darker than the navy)
  var JACKET = ['OOw336633wOO', 'OOw366663wOO', 'OOw366663wOO', 'OOO366663OOO', 'kkk366663kkk',
                'OOO366663OOO', 'kkk366663kkk', 'OOO366663OOO', 'OOO366663OOO'];
  return {
    ramps: {
      ghair: ['#211c1b', '#47403d', '#59524e', '#625a56', '#6b625d'],     // near-black, lifted
      gskin: ['#74423a', '#be8577', '#daa293', '#e6b3a5', '#eec5b8'],
      gtop:  ['#24273f', '#3c4268', '#4b5282', '#5b6396', '#6d75aa'],     // navy, lifted
      gpant: ['#2a2830', '#4a4752', '#5a5763', '#6c6975', '#807d89'],
      gxb:   ['#7d859e', '#a3adc6', '#bcc6dc', '#ccd5e8', '#dbe2f1'],     // the light-blue shirt
      gxc:   ['#1d1b1f', '#454146', '#565257', '#666267', '#77737a'],     // the black tee, lifted
      gxd:   ['#3e3a3a', '#6a6564', '#7d7877', '#8c8786', '#9b9695']      // grey at the temples
    },
    def: { b: 'ghair' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(smile, 9, 'SSSmmwwmmSSS'), 10, 'SSSSmmmmSSSS') },
    head: {
      r: ['HHHHHHHHHH', 'HHHHHHHHHH', 'S7HHHHHHHH', 'SS7HHHHHHH', 'SSS7HHHHHH', 'SSS77HHHHH',
          'SSSS7SSHHH', 'SSSSSSSHHH', 'SSSSSSShhh', 'SSSSSSSShh', 'sSSSSSSSSs', 'ssSSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'hHHHHHHHHHHh', 'shhhhhhhhhhs', 'sshhhhhhhhss', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 2.4,
    hair: [
      [-6.3, HH - 1.0, -4.8, 6.3, HH + 1.0, 5.4, TOUSLE, 'hair'],
      [-5.4, HH - 0.7, 4.2, 5.4, HH + 1.0, 6.3, TOUSLE, 'c1'],          // a short fringe pushed up
      [-5.0, HH + 0.8, -2.0, -1.2, HH + 2.0, 4.6, TOUSLE, 'c2'],         // tousled clumps on top
      [-1.6, HH + 0.8, -3.0, 2.4, HH + 2.4, 5.4, TOUSLE, 'c3'],
      [2.0, HH + 0.8, -2.4, 5.6, HH + 1.9, 4.2, TOUSLE, 'c4'],
      [-3.0, HH + 1.8, -3.6, 1.0, HH + 2.6, 1.6, TUFT, 'c5'],
      [-0.6, HH + 1.4, 3.6, 1.6, HH + 2.8, 5.6, TUFT, 'c6'],             // one lock sticking up at the front
      [-6.5, HH - 2.2, -4.4, -5.8, HH + 0.4, 2.6, TOUSLE, 'hair'],
      [5.8, HH - 2.2, -4.4, 6.5, HH + 0.4, 2.6, TOUSLE, 'hair'],
      [-6.4, 3.8, -5.0, 6.4, HH + 0.4, -4.3, TOUSLE, 'hair']
    ],
    torsoW: 6,
    torso: { all: 'O', t: 'k', f: JACKET },
    hem: 'k',
    arm: { all: ['OOOO', 'OOOO', 'kkkk', 'OOOO', 'OOOO', 'kkkk', 'OOOO', 'kkkk', 'SSSS', 'SSSS'], t: 'k', d: 'S' },
    body: [
      [-4.0, 20.4, -3.4, 4.0, 22.4, -1.6, { all: 'O', t: 'w' }, 'collar'],                  // ribbed collar behind the neck
      [-3.2, 20.2, 2.4, -0.9, 21.9, 3.5, { all: '3', t: '3' }, 'shirtL'],                   // the shirt's collar points
      [0.9, 20.2, 2.4, 3.2, 21.9, 3.5, { all: '3', t: '3' }, 'shirtR']
    ],
    gesture: function (p, tp) {                                       // right hand up at his chest, turning over as he explains
      p.aA = [-1.2 + 0.18 * Math.sin(tp * 3.0), 0.3 * Math.sin(tp * 3.0), 0.25 + 0.12 * Math.cos(tp * 3.0)];
      p.aB = [-0.85, 0, 0.12];
    }
  };
});
