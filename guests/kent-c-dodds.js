// Kent C. Dodds · Epic Web · "The Last Software Engineer" (9hoqdnYBKUQ)
// Short light-brown hair, a little longer and pushed up at the front, receding at the temples and
// greyer at the clipped sides; clean-shaven with a big friendly smile; a black heathered crew tee
// with a faint large circle print; a green rubber wristband on his right wrist. He talks with his
// right hand up.
ktGuest('kent-c-dodds', function (K) {
  var HH = K.HH;
  // his face: a high forehead, straight brows, a wide friendly grin, a clean defined jaw
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSmSSssSSmSS', 'SSSmwwwwmSSS', 'sSSSmmmmSSSs', 'ssSSSSSSSSss'];
  // short on top: brushed forward, the front pushed up in small points
  var TOP = { all: 'H', t: ['HhHHhHHhHHhH', 'HHhHHHhHHHhH', 'hHHhHHHhHHHh', 'HHHHhHHHhHHH'],
    f: ['GHGGHGGHGGHG', 'HhHHhHHhHHhH'], l: ['HhHF', 'hHFF'], r: ['FHhH', 'FFHh'], d: 'h' };
  var TUFT = { all: 'H', t: ['HhHhH', 'hHHhH', 'GHGHG'], f: ['GHGHG', 'HhHhH'], d: 'h' };
  var SIDE = { all: 'F', l: ['FhFF', 'FFFF'], r: ['FFhF', 'FFFF'], t: 'F', d: 'F' };
  // black heathered tee with a big circle print a shade darker, the collar's shadow under the chin
  var torso = ['OOOOOOOOOOOO', 'OOOokkkkoOOO', 'OOOOkkkkOOOO', 'OOOkOOOOkOOO', 'OOkOOOOOOkOO',
               'OOOkOOOOkOOO', 'OOOOkkkkOOOO', 'OOOOOOOOOOOO', 'oOOOOOOOOOOo'];
  // short sleeves, bare forearms; the band (1) is drawn on the arm's outer side only (the 'l' face),
  // which only his right arm turns outward: both arms share one texture
  var ARM = ['OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS'];
  return {
    ramps: {
      ghair: ['#4a2e24', '#6e4838', '#845a48', '#9a6e5a', '#b0846e'],   // light-to-mid brown, lifted
      gskin: ['#7a4634', '#c08a6e', '#dcaa8c', '#e9bc9f', '#f2cfb5'],   // sampled #cf9b7f, lifted
      gtop:  ['#2e2b2f', '#4b474c', '#5d585e', '#716c73', '#88838a'],   // black tee, lifted like Midnight
      gpant: ['#2a3346', '#3f4c66', '#4f5e7c', '#627294', '#7a8aab'],   // jeans
      gbrd:  ['#7a4634', '#c08a6e', '#dcaa8c', '#e9bc9f', '#f2cfb5'],
      gxa:   ['#1f5a32', '#2f8048', '#3fa05c', '#5cbb76', '#80d296'],   // the green wristband
      gxd:   ['#4a3c34', '#6e5c50', '#806c60', '#927d70', '#a48f82']    // the greyer clipped sides
    },
    def: { F: 'gxd', b: 'ghair-1', t: 'gskin' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(K.swap(smile, 8, 'SSSSSssSSSSS'), 9, 'SSSmwwwwmSSS'), 10, 'sSSSmmmmSSSs') },
    head: {
      // the temples recede: skin runs up high at the front, short grey-brown sides behind
      r: ['SSHHHHHHHH', 'SSSFFFFFFF', 'SSSFFFFFFF', 'SSSFFFFFFF', 'SSSSFFFFFF', 'SSSSSFFFFF', 'SSSSSFFFFF',
          'SSSSSSFFFF', 'SSSSSSFFFF', 'SSSSSSSFFF', 'sSSSSSSSss', 'ssSSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF',
          'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'FFFFFFFFFFFF', 'sFFFFFFFFFFs', 'ssFFFFFFFFss', 'ssssssssssss'],
      t: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'FHHHHHHHHHHF', 'SFHHHHHHHHFS', 'SSHHHHHHHHSS', 'SSSHHHHHHSSS', 'SSSSHHHHSSSS']   // bare at the temples
    },
    phonesY: HH + 2.1,
    hair: [
      [-6.2, HH - 0.9, -4.8, 6.2, HH + 0.9, 0.8, TOP, 'hair'],               // short on top...
      [-4.8, HH - 0.6, 0.4, 4.8, HH + 1.1, 4.0, TOP, 'hair'],                // ...narrowing toward the front, where the
      [-3.2, HH - 0.3, 3.6, 3.0, HH + 1.3, 6.0, TOP, 'hair'],                // temples recede and the middle comes forward
      [-2.0, HH + 0.7, 3.4, 2.0, HH + 1.8, 6.4, TUFT, 'tuft'],               // pushed up in small points
      [-6.5, 6.8, -4.8, -5.8, HH - 0.4, 1.6, SIDE, 'side'],                 // clipped sides
      [5.8, 6.8, -4.8, 6.5, HH - 0.4, 1.6, SIDE, 'side']
    ],
    torsoW: 5.6,
    torso: { all: 'O', t: 'o', f: torso },
    hem: 'o',
    arm: { all: ARM, l: K.swap(ARM, 7, '1111'), t: 'o', d: 'S' },
    body: [
      [-2.6, 19.6, 2.6, 2.6, 20.5, 3.3, { all: 'o', f: ['kkkkk'] }, 'collar']   // the crew collar, just under the chin
    ],
    gesture: function (p, tp) {                                               // his right hand up beside him
      p.aA = [0.25, 0, -2.15 - 0.22 * Math.sin(tp * 3.0)];
      p.aB = [-0.85, 0, 0.12];
    }
  };
});
