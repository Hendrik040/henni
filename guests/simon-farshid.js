// Simon Farshid · assistant-ui · "AI Chat Looks Easy. Building It for AI Agents Is Hard" (o41cg-3cM2Q)
// Very dark brown hair: short at the sides, a tousled wavy top pushed up and over to his right with
// a wave falling onto the forehead; strong arched brows; clean-shaven; a black pullover hoodie with
// the hood bunched around his neck and a small white wordmark. He shapes ideas with both hands.
ktGuest('simon-farshid', function (K) {
  var HH = K.HH;
  // his face: strong arched brows, a straight nose, an easy half-smile
  var smile = ['HHHHHSSSSSHH', 'SHHHSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SbSSSSSSSSbS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSSSSssSSSSS', 'SSSmSSSSmSSS', 'sSSSmmmmSSSs', 'ssSSSSSSSSss'];
  // tousled waves: lit crests and dark troughs, each clump its own group
  var WAVE = { all: 'H', t: ['HHGGHHhHHGGH', 'HGHHGhHGHHGh', 'hHHhHHGHhHHG'], f: ['GGHHGGHhGGHH', 'HHhHHhHHHhHH'],
    l: ['GHhG', 'HhHH'], r: ['GHhG', 'HhHH'], b: ['HhHGHhHG', 'hHHhHHhH'], d: 'h' };
  var WAVEF = { all: 'H', f: ['GGH', 'HHG', 'hHH'], l: ['GH', 'Hh'], r: ['HG', 'hH'], t: 'G', d: 'h' };
  var SIDE = { all: 'F', l: ['HhHHhH', 'FFFFFF'], r: ['HhHHhH', 'FFFFFF'], t: 'H', d: 'F' };
  // the pullover: no strings; the hood's opening is a dark V under the chin, a small white wordmark
  // (w) on his left chest, the kangaroo pocket's top edge
  var torso = ['OOOOqqqqOOOO', 'OOOOqqqqOOOO', 'OOOOOqqOOOOO', 'OOOOOOOOwwwO', 'OOOOOOOOOOOO',
               'OOooooooooOO', 'OoOOOOOOOOoO', 'OoOOOOOOOOoO', 'OOOOOOOOOOOO'];
  var HOOD = { all: 'O', f: 'q', d: 'o', t: 'o' };
  return {
    ramps: {
      ghair: ['#2b1f18', '#523f33', '#665040', '#6e5746', '#775e4c'],   // very dark warm brown, lifted; lit steps kept low
      gskin: ['#7a4a3c', '#c1907e', '#dcb09d', '#e8c2b0', '#f1d4c4'],   // sampled #cda693, lifted
      gtop:  ['#2a282c', '#47444a', '#59565d', '#6d6a72', '#85818a'],   // black hoodie, lifted like Midnight
      gpant: ['#2a282c', '#47444a', '#59565d', '#6d6a72', '#85818a']
    },
    def: { b: 'ghair=0', F: 'ghair-1', t: 'gskin' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(smile, 9, 'SSSmwwwwmSSS'), 10, 'sSSSmmmmSSSs') },
    head: {
      r: ['HHHHHHHHHH', 'HHHHHHHHHH', 'HHHHHHHHHH', 'SHHHHHHHHH', 'SSHHHHHHHH', 'SSSFFFFFFF', 'SSSSFFFFFF',
          'SSSSSFFFFF', 'SSSSSFFFFF', 'SSSSSSFFFF', 'sSSSSSSSss', 'ssSSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'FFFFFFFFFFFF',
          'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'sFFFFFFFFFFs', 'ssFFFFFFFFss', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 3.3,
    hair: [
      [-6.4, HH - 0.8, -5.0, 6.4, HH + 0.8, 4.8, WAVE, 'hair'],              // the base, behind a normal hairline
      [-5.4, HH + 0.5, -3.6, 3.6, HH + 2.4, 5.8, WAVE, 'v1'],                // the top, pushed up...
      [-6.6, HH + 0.1, -2.4, -2.6, HH + 1.9, 5.0, WAVE, 'v2'],               // ...and over to his right
      [-3.6, HH + 2.0, -1.2, 1.6, HH + 3.1, 4.6, WAVE, 'v3'],                // the crest
      [1.6, HH + 0.4, -3.8, 6.4, HH + 1.7, 4.0, WAVE, 'v4'],                 // lower on his left
      [-5.2, HH - 2.1, 5.0, -1.8, HH + 1.2, 6.8, WAVEF, 'f1'],              // a wave falling onto his forehead
      [-1.6, HH - 0.8, 5.2, 1.4, HH + 0.9, 6.6, WAVEF, 'f2'],
      [-6.7, 7.6, -4.6, -5.8, HH, 3.8, SIDE, 'hair'],                         // short sides
      [5.8, 7.6, -4.6, 6.7, HH, 3.8, SIDE, 'hair'],
      [-6.6, 4.4, -5.3, 6.6, HH - 0.4, -4.3, { all: 'H', b: ['HhHGHhHGHhHG', 'HHhHHHhHHHhH', 'FFFFFFFFFFFF'] }, 'back']
    ],
    torsoW: 6,                                                                // a roomy hoodie
    torso: { all: 'O', t: 'o', f: torso },
    hem: 'o',
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'oooo', 'SSSS', 'SSSS'], t: 'o', d: 'S' },
    body: [
      [-5.2, 20.2, -5.8, 5.2, 23.6, -1.6, HOOD, 'hood'],                     // the hood bunched behind his neck...
      [-5.0, 19.2, -2.0, -2.0, 21.6, 3.6, { all: 'O', f: ['nO', 'Oo'], t: 'n' }, 'hood-l'],   // ...and rolled round to the front
      [2.0, 19.2, -2.0, 5.0, 21.6, 3.6, { all: 'O', f: ['On', 'oO'], t: 'n' }, 'hood-r']
    ],
    gesture: function (p, tp) {                                               // both hands together, shaping it
      var k = Math.sin(tp * 3.2);
      p.aA = [-1.45 - 0.2 * k, 0, 0.1 - 0.08 * k];
      p.aB = [-1.45 - 0.2 * k, 0, -0.1 + 0.08 * k];
    }
  };
});
