// Francesco Bonacci · Cua · "Your Tests Pass. Can Your AI Agent Finish the Job?" (cIwv_ET0g9M)
// A mop of tight dark-brown curls, short at the sides, a few falling onto the forehead; thick black
// round acetate glasses under heavy brows; a short stubble beard and moustache; a sage-grey crew tee
// with a small dark wordmark. He explains with one open hand.
ktGuest('francesco-bonacci', function (K) {
  var HH = K.HH;
  // his face: heavy straight brows, stubble over the jaw, chin and upper lip, a small easy smile
  var smile = ['HHHHHHHHHHHH', 'SSSSSSSSSSSS', 'SbbbbSSbbbbS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'tSSSSssSSSSt', 'ttSttssttStt', 'tttmttttmttt', 'ttttmmmmtttt', 'stttttttttts'];
  // curls: light and dark texels side by side, and every clump its own group so they crease apart
  var CURL = { all: 'H', t: ['GHhGHhGHhGHh', 'hGHhGHHGhHGH', 'HhGHhGHhGHhG'], f: ['GHhGHhGHhGHh', 'HhHGhHHhGHhH'],
    l: ['GhHG', 'HGhH', 'hHGh'], r: ['GhHG', 'HGhH', 'hHGh'], b: ['HhGHhGHhGH', 'hHHhHHhHHh'], d: 'h' };
  var CURLF = { all: 'H', f: ['GHG', 'HhH', 'hHh'], t: 'G', d: 'h' };
  var SIDE = { all: 'H', l: ['GhHGhHGh', 'HhFHhFHh'], r: ['GhHGhHGh', 'HhFHhFHh'], t: 'G', d: 'F' };
  var LENS = { all: '1', f: ['11111', '1...1', '1...1', '1...1', '.111.'], t: '2' };   // flat top, rounded bottom: panto
  // crew-neck tee: the collar's shadow under the chin, a small dark wordmark on his left chest
  var torso = ['OOOOOOOOOOOO', 'OOOokkkkoOOO', 'OOOOOOOOOOOO', 'OOOOOOOOqqOO', 'OOOOOOOOOOOO',
               'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'oOOOOOOOOOOo'];
  return {
    ramps: {
      ghair: ['#2c211c', '#4f4039', '#634f45', '#6b564a', '#735d50'],   // dark brown: lifted, the lit steps kept low
      gskin: ['#73493c', '#b38a7a', '#cca595', '#dcb8a8', '#e8cbbd'],   // sampled #b49589, lifted
      gtop:  ['#4b4c43', '#6c6d61', '#838477', '#999a8c', '#afb0a2'],   // sage grey
      gpant: ['#2c2a2e', '#48454b', '#5a565e', '#6e6a73', '#86818b'],   // dark trousers, lifted
      gbrd:  ['#56412f', '#7a5c4a', '#8f6f5e', '#a0806e', '#b0907e']    // stubble: dark brown over skin
    },
    def: { t: 'gbrd', b: 'ghair-1', F: 'ghair-1', '1': '#2e2a2d', '2': '#4a4548' },   // black acetate, a shade above the eyes
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(smile, 9, 'tttmwwwwmttt'), 10, 'ttttmmmmtttt') },
    head: {
      // short tapered sides; the sideburn runs down into the beard along the jaw
      r: ['HHHHHHHHHH', 'HHHHHHHHHH', 'HHHHHHHHHH', 'SHHHHHHHHH', 'SHHHHHHHHH', 'StFFFFFFFF', 'SttFFFFFFF',
          'SttFFFFFFF', 'tttSFFFFFF', 'ttttSFFFFs', 'ttttSSSsss', 'tttSSSssss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'sFFFFFFFFFFs', 'ssFFFFFFFFss', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 3.5,
    hair: [
      [-6.4, HH - 1.6, -5.0, 6.4, HH + 0.8, 5.8, CURL, 'hair'],              // the base of the mop
      [-6.6, HH + 0.3, -3.8, -1.6, HH + 2.0, 4.8, CURL, 'c1'],               // curls piled on top, in rounded
      [-2.4, HH + 0.5, -3.4, 2.4, HH + 2.6, 5.6, CURL, 'c2'],                // tiers that bump the silhouette
      [1.8, HH + 0.3, -4.0, 6.6, HH + 1.9, 4.4, CURL, 'c3'],
      [-4.6, HH + 0.4, -4.8, 3.6, HH + 1.7, -1.2, CURL, 'c4'],
      [-5.0, HH + 1.8, -2.0, -1.8, HH + 2.9, 3.4, CURL, 'c5'],
      [-1.0, HH + 2.4, -1.4, 2.0, HH + 3.4, 4.4, CURL, 'c6'],
      [2.4, HH + 1.7, -2.6, 5.0, HH + 2.6, 2.8, CURL, 'c7'],
      [-3.6, HH - 2.0, 5.3, -0.8, HH + 0.7, 6.8, CURLF, 'f1'],               // a few falling onto his forehead
      [0.6, HH - 1.4, 5.3, 3.4, HH + 0.8, 6.7, CURLF, 'f2'],
      [-5.9, HH - 1.0, 5.0, -3.4, HH + 0.9, 6.5, CURLF, 'f3'],
      [-6.8, 7.4, -4.8, -5.8, HH, 4.2, SIDE, 'hair'],                         // short over the ears
      [5.8, 7.4, -4.8, 6.8, HH, 4.2, SIDE, 'hair'],
      [-6.6, 3.8, -5.3, 6.6, HH - 0.6, -4.3, { all: 'H', b: ['GhHGhHGhHGhH', 'HhFHhFHhFHhF', 'FFFFFFFFFFFF'] }, 'back']
    ],
    glasses: [                                                                 // thick black round-ish acetate
      [-5.0, 4.31, 6.0, 0.0, 9.69, 6.8, LENS, 'glasses'],                // face rows 3-7: the heavy top rim sits
      [0.0, 4.31, 6.0, 5.0, 9.69, 6.8, LENS, 'glasses'],                 // right under his brows
      [-6.7, 8.4, 0.4, -6.0, 9.4, 6.4, '1', 'glasses'],
      [6.0, 8.4, 0.4, 6.7, 9.4, 6.4, '1', 'glasses']
    ],
    torsoW: 5.6,
    torso: { all: 'O', t: 'o', f: torso },
    hem: 'o',
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS'], t: 'o', d: 'S' },
    body: [
      [-2.6, 19.6, 2.6, 2.6, 20.5, 3.3, { all: 'o', f: ['kkkkk'] }, 'collar']   // the crew collar, just under the chin
    ],
    gesture: function (p, tp) {                                               // one open hand, sweeping side to side
      p.aA = [-1.2 + 0.1 * Math.sin(tp * 5.2), 0, -0.3 - 0.28 * Math.sin(tp * 2.6)];
      p.aB = [-0.85, 0, 0.12];
    }
  };
});
