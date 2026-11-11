// Allie Laabs · TypeSafe · "Jev vs LLMs" (j8RO-IOKtvM)
// A hot-magenta undercut: clipped at the sides, the longer top parted on her left and swept over to
// her right, where it falls past the temple to the jaw. A raspberry leather blazer over a black top,
// a chunky chain choker with a big O-ring, a small gold stud. She talks with one hand up.
ktGuest('allie-laabs', function (K) {
  var HH = K.HH;
  // her face: fine reddish-pink brows, a straight nose, a narrow chin, an easy closed smile
  var smile = ['HHHHHHHHHSSS', 'HHHHHHSSSSSS', 'HHHSSSSSSSSS', 'HHbbbSSbbbSS', 'HSSSSSSSSSSS', 'SSSxESSxESSS',
               'HSSEESSEESSS', 'HSSSSssSSSSS', 'HSSSSssSSSSS', 'HSSmSSSSmSSS', 'sSSSmmmmSSSs', 'ssSSSSSSSSss'];
  // sleek, not curly: long strands and one lit band that follows the sweep
  var STRAND = { all: 'H', t: ['HHHHHHHHHhFh', 'HHHHHHHHHhFh', 'HHHHHHHHHhFh', 'HHHHHHHHHhFh'], d: 'h' };
  var SWEEP = { all: 'H', t: ['HHHHHHHHHh', 'HHHHHHHHHH', 'hhhHHHHHHH', 'HHHHHHHHHH'], f: ['GGGGGGGGGG', 'HHHHHHHHHH'],
    l: ['GH', 'Hh'], r: ['HF', 'FF'], d: 'h' };
  var LOCK = { all: 'H', f: ['GGG', 'HHH', 'HHH', 'hhh'], l: ['GH', 'HH', 'hh'], r: 'h', t: 'H', d: 'h' };
  var FALL = { all: 'H', l: ['GHHH', 'GHHH', 'HGHH', 'HHGH', 'hHHh'], f: ['G', 'H', 'H', 'h'], t: 'H', d: 'h' };
  var CLIP = { all: 'F', t: 'h', f: 'F' };
  // the blazer: wide lapels open on bare skin at the neckline and a black top (3) below it,
  // closing low; rows 0-1 sit under her chin, so the neckline starts at row 1
  var torso = ['OOOnSSSSnOOO', 'OOOnSSSSnOOO', 'OOOn3333nOOO', 'OOOOn33nOOOO', 'OOOOn33nOOOO',
               'OOOOOnnOOOOO', 'OOOOOkOOOOOO', 'oOOOOkOOOOOo', 'oOOOOkOOOOOo'];
  var CHAIN = { all: '1', f: ['21212121', '12121212'], t: '1', d: '2' };
  var RING = { all: '1', f: ['.11.', '1..1', '1..2', '.22.'], t: '1', d: '2' };
  var LAPEL_R = { all: 'O', f: ['On', 'On', 'On', 'On'], t: 'n', l: 'o' };
  var LAPEL_L = { all: 'O', f: ['nO', 'nO', 'nO', 'nO'], t: 'n', r: 'o' };
  return {
    ramps: {
      ghair: ['#5e1745', '#8c2068', '#b02a85', '#cc3f9c', '#e066b6'],   // hot magenta, lit toward pink
      gskin: ['#7e4c4f', '#bd8d8a', '#d6aaa5', '#e5beb7', '#f0d2cb'],   // sampled #c19498, lifted
      gtop:  ['#4c1430', '#7c2a50', '#9a3864', '#b24c7a', '#c76690'],   // raspberry leather
      gpant: ['#2c2a2e', '#48454b', '#5a565e', '#6e6a73', '#86818b'],   // black trousers, lifted
      gbrd:  ['#7e4c4f', '#bd8d8a', '#d6aaa5', '#e5beb7', '#f0d2cb'],
      gxa:   ['#5c4a2c', '#94793e', '#b8994e', '#d6bb72', '#ecd9a0'],   // the gold chain and stud
      gxb:   ['#2c2a2e', '#48454b', '#5a565e', '#6e6a73', '#86818b']    // the black top under the blazer
    },
    def: { b: 'ghair-1', F: 'ghair-1', t: 'gskin' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(K.swap(smile, 8, 'SSSSSssSSSSS'), 9, 'SSSmwwwwmSSS'), 10, 'sSSSmmmmSSSs') },
    head: {
      // her left (+x): swept back above the ear, clipped close behind it
      r: ['HHHHHHHHHH', 'HHHHHHHHHH', 'SHHHHHHHHH', 'SSHHHHHHHH', 'SSSHHHHHFF', 'SSSSSFFFFF', 'SSSSSFFFFF',
          'SSSSSSFFFF', 'SSSSSSFFFF', 'SSSSSSSFFF', 'sSSSSSSSss', 'ssSSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHhHHHHHHhHH', 'FFFFFFFFFFFF',
          'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'sFFFFFFFFFFs', 'ssFFFFFFFFss', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 2.5,
    hair: [
      [-6.4, HH - 1.2, -4.9, 6.4, HH + 0.7, 5.6, STRAND, 'hair'],          // the crown
      [3.4, HH - 0.2, -4.6, 6.5, HH + 0.9, 5.4, CLIP, 'hair'],              // her left: the part and the short side
      [-4.6, HH + 0.5, -4.0, 3.3, HH + 2.3, 6.0, SWEEP, 'top'],              // the longer top rises off the part...
      [-7.0, HH - 0.6, -3.6, -4.2, HH + 1.5, 6.0, SWEEP, 'top'],            // ...and rolls over to her right
      [-0.6, HH - 0.4, 4.8, 3.6, HH + 1.5, 6.8, LOCK, 'swoop'],              // the swoop: a staircase of locks (one
      [-4.0, HH - 1.6, 4.8, -0.2, HH + 1.2, 6.9, LOCK, 'swoop'],             // group, so no creases: it stays sleek)
      [-6.7, HH - 3.3, 4.4, -3.6, HH + 0.4, 6.9, LOCK, 'swoop'],             // running down from the part, across
      [-7.2, HH - 5.8, 3.4, -5.0, HH - 2.6, 6.7, LOCK, 'swoop'],             // her forehead, past the temple...
      [-7.4, 2.2, -2.2, -5.7, HH, 4.6, FALL, 'swoop'],                        // ...and over her right ear to the jaw,
      [-6.6, 2.0, 3.6, -5.1, HH - 4.0, 6.6, FALL, 'swoop'],                  // the ends hanging beside her cheek
      [5.7, 7.4, -4.8, 6.6, HH - 0.6, 3.0, { all: 'H', r: ['GHHH', 'HhHh'], t: 'G', d: 'h' }, 'hair'],   // swept back over the ear
      [-6.5, 3.2, -5.2, 6.5, HH - 0.8, -4.3, { all: 'F', b: ['HHHHHHHHHHHH', 'HhHHHhHHHhHH', 'FFFFFFFFFFFF'] }, 'back'],
      [6.9, 4.7, 0.0, 7.4, 5.4, 0.6, '1', 'stud']                             // small gold stud
    ],
    torsoW: 5.8,                                                             // a structured blazer
    torso: { all: 'O', t: 'o', f: torso },
    hem: 'o',
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'oooo', 'SSSS', 'SSSS'], t: 'o', d: 'S' },
    body: [
      [-3.9, 17.6, 2.9, -2.0, 21.6, 4.0, LAPEL_R, 'lapel-r'],                  // the lapels, stepping in toward
      [-2.6, 15.2, 2.9, -0.9, 17.7, 4.0, LAPEL_R, 'lapel-r2'],                 // the low closure
      [2.0, 17.6, 2.9, 3.9, 21.6, 4.0, LAPEL_L, 'lapel-l'],
      [0.9, 15.2, 2.9, 2.6, 17.7, 4.0, LAPEL_L, 'lapel-l2'],
      [-2.0, 19.3, 3.0, 2.0, 20.4, 4.1, CHAIN, 'choker'],                     // the chunky chain, below her chin
      [-2.6, 19.8, -2.4, -2.0, 21.4, 3.6, '1', 'choker'],
      [2.0, 19.8, -2.4, 2.6, 21.4, 3.6, '1', 'choker'],
      [-1.6, 16.4, 3.5, 1.6, 19.4, 4.2, RING, 'ring']                         // the big O-ring
    ],
    gesture: function (p, tp) {                                              // one hand up, making a point
      p.aA = [-1.8 + 0.16 * Math.sin(tp * 3.4), 0.2, -0.18 - 0.08 * Math.sin(tp * 1.7)];
      p.aB = [-0.85, 0, 0.12];
    }
  };
});
