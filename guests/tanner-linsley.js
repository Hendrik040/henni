// Tanner Linsley · TanStack · "Why Tanner Linsley Won't Take VC Money for TanStack" (wh954IZ1IAE)
// Short dark curls piled on top over short sides, clean-shaven, a black TanStack tee;
// he talks with one open hand raised, fingers spread.
ktGuest('tanner-linsley', function (K) {
  var HH = K.HH;
  // his face: straight dark brows, a relaxed smile, clean-shaven, a rounded jaw
  var smile = ['hSSSSSSSSSSh', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSmSSSSSSmSS', 'sSSmwwwwmSSs', 'ssSSmmmmSSss', 'sSSSSSSSSSSs'];
  // tight curls: light and dark texels scattered so the top reads bumpy, not combed
  var CURL = { all: 'H', t: ['HhHhHHhHhHHh', 'hHHhHhHHhHhH', 'HhHHhHhHHhHH', 'hHhHHhHhHHhH'],
    f: ['GhHhGHhHhGhH', 'hHhHHhHhHHhH', 'HhHHhHHhHHhH'], l: ['HhHh', 'hHhH', 'HhHh'], r: ['hHhH', 'HhHh', 'hHhH'] };
  var LOCK = { all: 'H', f: ['GhG', 'hHh', 'HhH'], t: 'G' };
  return {
    ramps: {
      ghair: ['#2a211f', '#4f403c', '#62514c', '#6b5a54', '#76645e'],     // near-black brown (#342927), lifted; top steps held low
      gskin: ['#6e3a36', '#a96b66', '#c68a82', '#d8a197', '#e6b7ad'],     // from #b37975, lifted
      gtop:  ['#28252b', '#45414a', '#56515a', '#625d67', '#706b75'],     // black tee, lifted like Midnight
      gpant: ['#2e3445', '#47506a', '#58627e', '#6d7893', '#8792ac'],
      gxa:   ['#9f9ca6', '#c3c0ca', '#d8d5de', '#e6e4ea', '#f2f0f5']      // the small white wordmark
    },
    def: { b: 'ghair' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(K.swap(smile, 8, 'SSSmmmmmmSSS'), 9, 'sSSmwwwwmSSs'), 10, 'ssSSmmmmSSss') },
    head: {   // short sides: dark above and behind the ear, skin at the temple and jaw
      r: ['HHHHHHHHHH', 'SHHHHHHHHH', 'SSHHHHHHHH', 'SSShHHHHHH', 'SSSShhHHHH', 'SSSSShhHHH', 'SSSSSShhHH',
          'SSSSSSShhh', 'SSSSSSSShh', 'SSSSSSSSSh', 'sSSSSSSSss', 'ssSSSSssss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'hHHHHHHHHHHh', 'hHHHHHHHHHHh', 'hhHHHHHHHHhh', 'hhhhhhhhhhhh', 'shhhhhhhhhhs', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 2.4,
    hair: [
      [-6.4, HH - 1.3, -4.9, 6.4, HH + 1.0, 6.3, CURL, 'hair'],
      [-5.8, HH + 0.8, -2.6, -1.4, HH + 2.0, 5.6, CURL, 'c1'],        // curls piled on top, highest front-centre
      [-2.0, HH + 0.8, -3.6, 2.6, HH + 2.4, 6.2, CURL, 'c2'],
      [2.2, HH + 0.8, -3.0, 6.0, HH + 1.8, 5.2, CURL, 'c3'],
      [-4.2, HH + 0.8, -4.7, 4.0, HH + 1.6, -2.2, CURL, 'c5'],
      [-3.8, HH + 2.0, 0.2, -0.2, HH + 2.8, 4.6, CURL, 'c4'],
      [-6.5, 7.6, -4.8, -5.9, HH - 0.6, 2.4, CURL, 'hair'],           // short over the ears
      [-6.3, 3.8, -5.2, 6.3, HH - 1.0, -4.2, { all: 'H', b: ['HhHHhHHhHHhH', 'hHHhHHhHHhHH', 'HHhHHHHhHHHh'] }, 'hair'],   // short at the back
      [5.9, 7.6, -4.8, 6.5, HH - 0.6, 2.4, CURL, 'hair'],
      [-4.8, HH - 2.0, 5.9, -2.2, HH - 0.8, 6.8, LOCK, 'l1'],         // a couple of curls dip onto the forehead
      [0.4, HH - 1.7, 5.9, 2.8, HH - 0.6, 6.7, LOCK, 'l2']
    ],
    torsoW: 5.8,
    // crew-neck tee with the TANSTACK wordmark small on his left chest
    torso: { all: 'O', t: 'k', f: ['OOOOkSSkOOOO', 'OOOOOkkOOOOO', 'OOOOOOO1111O', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO',
      'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO'] },
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS'], t: 'O', d: 'S' },
    gesture: function (p, tp) {                                       // one open hand up, fingers spread
      p.aB = [-1.4 + 0.25 * Math.sin(tp * 2.4), 0, 0.5 + 0.15 * Math.sin(tp * 1.3)];
      p.aA = [-0.9 + 0.08 * Math.sin(tp * 2.4 + 1), 0, -0.15];
    }
  };
});
