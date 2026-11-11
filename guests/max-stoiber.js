// Max Stoiber · OpenAI Codex · "DX is Dead" (mE1FQxGrXbk)
// A thin strawberry-blond buzz cut receding at the temples, round tortoiseshell glasses, short ginger
// stubble along the jaw, a black hoodie (hood behind the neck) with a black conference lanyard and badge,
// light-blue jeans. He talks with both hands open in front of him.
ktGuest('max-stoiber', function (K) {
  var HH = K.HH;
  // his face: light ginger brows, short ginger stubble on the jaw, chin and upper lip, a closed smile
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSSSttttSSSS', 'tSStmmmmtSSt', 'tSSttttttSSt', 'tttttttttttt'];
  // a buzz cut: the scalp shows through, more toward the front
  var BUZZ = { all: 'H', t: ['HhHHHhHHhHHH', 'HHhHHHHhHHHH', 'hHHHHhHHHHHh', 'HHsHHHHHsHHH', 'HsHHsHHsHHsH'],
    f: ['HsHHsHHHsHHs'], l: ['HHHHsH', 'HhHHHs'], r: ['HsHHHH', 'sHHHhH'] };
  // round frames, mottled like tortoiseshell
  var ROUND = { all: '2', f: ['.121.', '2...1', '1...2', '.212.'] };
  // hoodie front: the lanyard straps run down from the neck to a badge with a pale header
  var torso = ['OOOqOOOOqOOO', 'OOOqOOOOqOOO', 'OOOOqOOqOOOO', 'OOOOqOOqOOOO', 'OOOOOqqOOOOO',
               'OOOOqKKqOOOO', 'OOOOqqqqOOOO', 'OOOOqqqqOOOO', 'OOOOOOOOOOOO'];
  return {
    ramps: {
      ghair: ['#7e4a34', '#b0704e', '#c47f55', '#d49262', '#e2a674'],     // strawberry blond
      gskin: ['#9e4542', '#cc948d', '#e7b6ae', '#f3cfc9', '#fbe9e5'],     // sampled #daa39b, lifted like Jesse's
      gtop:  ['#2d2a33', '#4a4553', '#5c5666', '#716b7c', '#898394'],     // black hoodie, lifted
      gpant: ['#4c6587', '#7591b5', '#89a5c8', '#9fb9d8', '#b7cde6'],     // light-blue jeans
      gbrd:  ['#7a4a36', '#b07a5a', '#c48d6c', '#d4a080', '#e0b294'],     // ginger stubble
      gxa:   ['#4f2a22', '#7a4632', '#8f553c', '#a86c4c', '#c08862']      // tortoiseshell
    },
    def: { t: 'gbrd', b: 'ghair' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(smile, 9, 'tSStmwwmtSSt'), 10, 'ttStmmmmtStt') },
    head: {
      // close-cropped sides, bare temples, stubble along the jaw
      r: ['SSHHHHHHHH', 'SSSHHHHHHH', 'SSSHHHHHHH', 'SSSSHHHHHH', 'SSSSHHHHHH', 'SSSSSHHHHH',
          'SSSSSShHHH', 'SSSSSSShHH', 'tSSSSSSShH', 'ttSSSSSSSh', 'tttSSSSSss', 'ttttSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'hHHHHHHHHHHh', 'shHHHHHHHHhs', 'sshhhhhhhhss', 'sssshhhhssss', 'ssssssssssss'],
      t: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'sHsHHsHHsHsH', 'SsSsSsSsSsSS']
    },
    phonesY: HH + 0.45,
    hair: [
      [-6.15, HH - 0.5, -4.75, 6.15, HH + 0.35, 4.2, BUZZ, 'hair'],     // barely there on top
      [-6.3, 6.6, -4.75, -5.95, HH - 0.2, 2.0, { all: 'H', l: ['HHHHhH', 'HhHHHH', 'hHHhHh'] }, 'hair'],
      [5.95, 6.6, -4.75, 6.3, HH - 0.2, 2.0, { all: 'H', r: ['HhHHHH', 'HHHHhH', 'hHhHHh'] }, 'hair'],
      [-6.15, 3.4, -4.85, 6.15, HH - 0.2, -4.5, { all: 'H', b: ['HHhHHHHhHHHH', 'HhHHHhHHHHhH', 'hHHhHHhHHhHh'] }, 'hair']
    ],
    glasses: [                                                        // round tortoiseshell acetate
      [-5.0, 4.4, 6.0, -0.5, 8.6, 6.6, ROUND, 'glasses'],
      [0.5, 4.4, 6.0, 5.0, 8.6, 6.6, ROUND, 'glasses'],
      [-0.5, 7.0, 6.0, 0.5, 7.7, 6.6, '2', 'glasses'],
      [-6.6, 7.3, 0.6, -6.0, 8.0, 6.3, '2', 'glasses'],
      [6.0, 7.3, 0.6, 6.6, 8.0, 6.3, '2', 'glasses']
    ],
    torsoW: 6,
    torso: { all: 'O', t: 'o', f: torso },
    hem: 'o',
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'oooo', 'SSSS', 'SSSS'], t: 'o', d: 'S' },
    body: [
      [-5.2, 20.2, -5.8, 5.2, 23.6, -1.6, { all: 'O', f: 'q', d: 'o' }, 'hood'],   // the hood, bunched behind the neck
      [-3.4, 20.6, 1.6, -2.4, 21.8, 3.3, 'q', 'strapL'],                          // lanyard over the shoulders
      [2.4, 20.6, 1.6, 3.4, 21.8, 3.3, 'q', 'strapR']
    ],
    gesture: function (p, tp) {                                       // both hands up and open, bouncing as he talks
      p.aA = [-1.2 + 0.16 * Math.sin(tp * 3.2), 0, -0.5];
      p.aB = [-1.15 + 0.16 * Math.sin(tp * 3.2 + 1.4), 0, 0.5];
    }
  };
});
