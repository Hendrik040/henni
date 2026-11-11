// Yash · Martian · "The Hidden Open Source AI Models You're Sleeping On" (XmV6lGQfFa4)
// Short near-black hair swept to his right, thin black rectangular glasses, a light moustache,
// a taupe V-neck sweater over a brown-and-blue check shirt; he explains with one open hand.
ktGuest('yash-martian', function (K) {
  var HH = K.HH;
  // his face: straight dark brows, a light moustache and a trace of stubble on the chin
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSmttttttmSS', 'SSSmwwwwmSSS', 'sSSSmmmmSSSs', 'sSSttttttSSs'];
  // combed to the side: darker strands run across the top toward his right
  var SWEEP = { all: 'H', t: ['HHHhHHHHhHHH', 'HHhHHHHhHHHH', 'HhHHHHhHHHHh', 'hHHHHhHHHHhH'],
    f: ['GHGGHGGHGGHG', 'HHhHHhHHhHHh'], l: ['GHHh', 'HhHH'], r: ['HHhH', 'hHHH'] };
  var FRINGE = { all: 'H', f: ['GGHGGHGG', 'HHhHHhHH', 'hHHhHHhH'], t: 'G' };
  var LENS = { all: '5', f: ['55555', '5...5', '5...5', '5...5', '5...5'] };   // the thin lower rim drops out at this size
  // V-neck: a darker rib edges the V, the check shirt shows inside it (the chin hides the top row)
  var torso = ['OOo133113oOO', 'OOo311331oOO', 'OOOo3113oOOO', 'OOOo1331oOOO', 'OOOOo13oOOOO',
               'OOOOOooOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO'];
  return {
    ramps: {
      ghair: ['#26201e', '#48403c', '#5b524e', '#615753', '#675d58'],     // near-black brown (#2f211a), lifted; lit steps held low
      gskin: ['#6e3b2b', '#b07259', '#cf8e73', '#dda489', '#e8b9a0'],     // from #c47b62, lifted
      gbrd:  ['#5a3428', '#93604c', '#ad755e', '#b9826b', '#c48f78'],     // light moustache, a shade over skin
      gtop:  ['#4a423c', '#675e57', '#7d736a', '#8c8279', '#9a9087'],     // grey-taupe sweater
      gpant: ['#2c2a30', '#47444d', '#58545f', '#6a6672', '#7e7a87'],
      gxa:   ['#4a3428', '#755443', '#8a6551', '#98735f', '#a7826d'],     // check shirt: brown
      gxb:   ['#7d8494', '#a3aabb', '#bcc2d0', '#cbd0dc', '#d9dde7'],     // check shirt: pale blue-white
      gxc:   ['#24212a', '#4a4550', '#5b5662', '#65606c', '#706b77']      // thin black frames, lifted
    },
    def: { t: 'gbrd', b: 'ghair' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(K.swap(smile, 8, 'SSStmmmmtSSS'), 9, 'SSSmwwwwmSSS'), 10, 'sSSSmmmmSSSs') },
    head: {   // short sides: dark above and behind the ear
      r: ['HHHHHHHHHH', 'SHHHHHHHHH', 'SSHHHHHHHH', 'SSShHHHHHH', 'SSSShHHHHH', 'SSSSShHHHH', 'SSSSSShHHH',
          'SSSSSSShhh', 'SSSSSSSShh', 'SSSSSSSSSh', 'sSSSSSSSss', 'ssSSSSssss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'hHHHHHHHHHHh', 'hhhhhhhhhhhh', 'shhhhhhhhhhs', 'ssssssssssss', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 1.7,
    hair: [
      [-6.4, HH - 1.2, -4.9, 6.4, HH + 0.9, 6.3, SWEEP, 'hair'],
      [-6.0, HH + 0.7, -3.8, 4.6, HH + 1.7, 6.1, SWEEP, 'top'],        // a little height, more on his right
      [-6.4, HH - 2.2, 5.8, -2.4, HH - 0.4, 6.8, FRINGE, 'fr1'],       // the fringe swept across to his right
      [-2.6, HH - 1.7, 5.8, 1.8, HH - 0.4, 6.7, FRINGE, 'fr2'],
      [-6.5, 7.8, -4.6, -5.9, HH - 0.6, 2.0, SWEEP, 'hair'],           // short over the ears
      [5.9, 7.8, -4.6, 6.5, HH - 0.6, 2.0, SWEEP, 'hair'],
      [-6.3, 4.0, -5.2, 6.3, HH - 1.0, -4.2, { all: 'H', b: ['HhHHhHHhHHhH', 'hHHhHHhHHhHH', 'HHhHHHHhHHHh'] }, 'hair']
    ],
    glasses: [                                                        // thin black rectangular frames
      [-4.2, 4.8, 6.0, -0.05, 8.2, 6.5, LENS, 'glasses'],
      [0.05, 4.8, 6.0, 4.2, 8.2, 6.5, LENS, 'glasses'],
      [-6.7, 7.4, 0.4, -6.0, 8.0, 6.4, '5', 'glasses'],
      [6.0, 7.4, 0.4, 6.7, 8.0, 6.4, '5', 'glasses']
    ],
    torsoW: 5.8,
    torso: { all: 'O', t: 'o', f: torso },
    hem: 'o',
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', '1313', 'SSSS', 'SSSS'], t: 'O', d: 'S' },   // check cuffs
    body: [                                                           // the shirt collar points inside the V
      [-3.4, 20.4, 2.2, -0.6, 22.2, 3.5, { all: '3', f: ['31', '13'] }, 'collarL'],
      [0.6, 20.4, 2.2, 3.4, 22.2, 3.5, { all: '3', f: ['13', '31'] }, 'collarR']
    ],
    gesture: function (p, tp) {                                       // one open hand turning as he explains
      p.aB = [-1.35 + 0.18 * Math.sin(tp * 2.2), 0.3 * Math.sin(tp * 1.6), 0.25 + 0.08 * Math.sin(tp * 2.2)];
      p.aA = [-0.92, 0, -0.14];
    }
  };
});
