// Herrington Darkholme · ast-grep · "STOP USING REGEX FOR CODE!" (GX0iUT9_GNk)
// Thick black hair with a spiky fringe down to his brows, thin silver semi-rimless glasses,
// a black zip bomber jacket (ribbed collar, cuffs and hem, a small white round logo on his left chest);
// he talks with both hands low in front of him, palms up.
ktGuest('herrington-darkholme', function (K) {
  var HH = K.HH;
  // his face: brows half under the fringe, a small smile showing a little teeth, no facial hair
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSSSSSSSSSSS', 'SSSmwwwwmSSS', 'SSSSmmmmSSSS', 'sSSSSSSSSSSs'];
  var THICK = { all: 'H', t: ['HhHHHhHHHhHH', 'hHHhHHHhHHHh', 'HHhHHhGHhHHh'], f: ['HHhGHHHhHGHh', 'HhHHhHHhHHhH'] };
  var SPIKE = { all: 'H', f: ['HGH', 'HhH', 'HhH', 'hHh'], t: 'H' };
  var TIP = { all: 'H', f: ['HH', 'Hh'], t: 'H' };
  // black bomber: a dull zip down the middle, the white round logo on his left chest
  var BOMBER = ['OOOOOOMOOOOO', 'OOOOOOMOOOOO', 'OOOOOOMOwwOO', 'OOOOOOMOwwOO', 'OOOOOOMOOOOO',
                'OOOOOOMOOOOO', 'OOOOOOMOOOOO', 'OOOOOOMOOOOO', 'OOOOOOMOOOOO'];
  var LENS = { all: 'M', f: ['11111', 'M...M', 'M...M', '.....'], t: '1', d: '.' };   // semi-rimless: a silver top rim, no bottom rim
  return {
    ramps: {
      ghair: ['#1d1c23', '#42404c', '#53515f', '#585664', '#5e5c6a'],     // black, lifted
      gskin: ['#76473c', '#c08e7c', '#daab99', '#e6bcab', '#eecdbf'],
      gtop:  ['#1c1a20', '#45414c', '#55515d', '#5d5966', '#67636f'],     // black bomber, lifted
      gpant: ['#252a3a', '#434b63', '#535d7a', '#66708d', '#7b85a2'],     // dark jeans (not in frame)
      gxa:   ['#585664', '#8d8a99', '#a8a5b3', '#b9b6c3', '#c9c6d2']      // the silver of his frames
    },
    def: { b: 'ghair' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(smile, 9, 'SSSmmmmmmSSS'), 10, 'SSSSmwwmSSSS') },
    head: {
      r: ['HHHHHHHHHH', 'HHHHHHHHHH', 'HHHHHHHHHH', 'SHHHHHHHHH', 'SHHHHHHHHH', 'SSHHHHHHHH',
          'SSShSSSHHH', 'SSSSSSShHH', 'SSSSSSShhh', 'SSSSSSSShh', 'sSSSSSSSSs', 'ssSSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'hHHHHHHHHHHh', 'shhhhhhhhhhs', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 2.6,
    hair: [
      [-6.4, HH - 1.6, -4.9, 6.4, HH + 0.9, 5.4, THICK, 'hair'],
      [-6.3, HH - 1.3, 4.6, 6.3, HH + 0.8, 6.6, THICK, 'fr'],            // the fringe...
      [-6.3, HH - 3.0, 5.0, -4.6, HH - 1.0, 6.5, SPIKE, 'l1'],           // ...ending in uneven spikes above his brows
      [-4.4, HH - 3.4, 5.2, -2.6, HH - 1.0, 6.8, SPIKE, 'l2'],
      [-2.2, HH - 2.2, 5.1, -1.2, HH - 1.0, 6.6, TIP, 'l3'],
      [-0.9, HH - 3.3, 5.2, 0.9, HH - 1.0, 6.8, SPIKE, 'l4'],
      [1.3, HH - 2.3, 5.1, 2.3, HH - 1.0, 6.6, TIP, 'l5'],
      [2.6, HH - 3.4, 5.2, 4.4, HH - 1.0, 6.8, SPIKE, 'l6'],
      [4.7, HH - 2.6, 4.8, 6.4, HH - 1.0, 6.4, SPIKE, 'l7'],
      [-5.6, HH + 0.6, -3.4, -1.6, HH + 2.0, 4.8, THICK, 'c1'],          // a full, messy top
      [-2.2, HH + 0.8, -3.8, 2.2, HH + 2.4, 5.4, THICK, 'c2'],
      [1.6, HH + 0.6, -3.2, 5.6, HH + 2.0, 4.6, THICK, 'c3'],
      [-3.8, HH + 1.8, 0.2, -2.0, HH + 2.8, 3.4, TIP, 't1'],             // short spikes on top
      [0.6, HH + 2.2, 0.4, 2.4, HH + 3.2, 3.4, TIP, 't2'],
      [3.2, HH + 1.8, 1.0, 4.8, HH + 2.6, 4.0, TIP, 't3'],
      [-6.8, HH - 4.6, -4.6, -5.8, HH + 0.4, 3.8, THICK, 'hair'],        // thick sides down to the tops of his ears
      [5.8, HH - 4.6, -4.6, 6.8, HH + 0.4, 3.8, THICK, 'hair'],
      [-6.5, 2.8, -5.1, 6.5, HH + 0.5, -4.2, THICK, 'hair']
    ],
    glasses: [
      [-5.1, 5.0, 6.0, -0.5, 8.6, 6.5, LENS, 'glasses'],
      [0.5, 5.0, 6.0, 5.1, 8.6, 6.5, LENS, 'glasses'],
      [-0.6, 7.7, 6.0, 0.6, 8.3, 6.5, '1', 'glasses'],
      [-6.6, 7.8, 0.4, -6.0, 8.4, 6.3, 'M', 'glasses'],
      [6.0, 7.8, 0.4, 6.6, 8.4, 6.3, 'M', 'glasses']
    ],
    torsoW: 6,
    torso: { all: 'O', t: 'k', f: BOMBER },
    hem: 'k',                                                         // ribbed hem
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS'], t: 'k', d: 'S' },
    body: [
      [-3.4, 20.2, -3.4, 3.4, 22.6, 3.4, { all: 'k', f: ['kkkk..kkkk', 'kkkk..kkkk'], t: 'O' }, 'collar']   // ribbed stand collar, open at the zip
    ],
    gesture: function (p, tp) {                                       // both hands low in front of him, palms up
      var w = Math.sin(tp * 3.4);
      p.aA = [-1.05 + 0.18 * w, 0, -0.18 - 0.1 * w];
      p.aB = [-1.0 - 0.18 * Math.sin(tp * 3.4 + 1.2), 0, 0.18 + 0.1 * w];
    }
  };
});
