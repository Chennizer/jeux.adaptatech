/* Shared vector artwork for the live garden and its menu illustration. */
(() => {
  'use strict';

  const kinds = Object.freeze([
    { name: 'bell', light: '#ffb4c3', color: '#ff568b', shade: '#c92762', size: 158, crown: 1.18, cap: .86, fillRadius: 123 },
    { name: 'daisy', light: '#fff5a3', color: '#ffd035', shade: '#e99911', size: 190, crown: 1.22, cap: .88, fillRadius: 116 },
    { name: 'tulip', light: '#d4b5ff', color: '#a96af5', shade: '#7340bd', size: 148, crown: 1.06, cap: .81, fillRadius: 123 },
    { name: 'anemone', light: '#b0f6df', color: '#28d4b2', shade: '#099c89', size: 174, crown: 1.19, cap: .95, fillRadius: 116 },
    { name: 'poppy', light: '#ffd089', color: '#ff9146', shade: '#e45b30', size: 136, crown: 1.28, cap: .73, fillRadius: 131 },
    { name: 'cosmos', light: '#ffc5e9', color: '#f369bd', shade: '#c23991', size: 180, crown: 1.13, cap: .90, fillRadius: 100 }
  ]);

  function crown(index) {
    const kind = kinds[index];
    const id = 'garden-petal-' + kind.name;
    const fill = 'url(#' + id + ')';
    const petal = ' fill="' + fill + '" stroke="' + kind.shade + '" stroke-width="2.8" stroke-linejoin="round"';
    const vein = ' fill="none" stroke="' + kind.shade + '" stroke-width="1.6" stroke-opacity=".4" stroke-linecap="round"';
    let shape;

    if (kind.name === 'bell') {
      shape = '<g transform="rotate(-9 140 140)">' +
        '<path d="M117 64C111 47 124 26 140 20C157 34 169 51 159 66" fill="#489c61"/>' +
        '<path class="petal" d="M70 108C73 66 99 45 138 45C177 45 207 72 208 118C208 141 221 164 240 181C225 197 210 201 189 192C173 210 154 211 136 199C119 211 99 208 85 193C66 202 47 194 37 181C61 161 69 139 70 108Z"' + petal + '/>' +
        '<path d="M99 71C77 103 95 140 68 173" fill="none" stroke="#ffe4e9" stroke-width="10" stroke-opacity=".65" stroke-linecap="round"/>' +
        '<path d="M137 62C120 111 146 154 136 190M172 69C194 117 169 158 188 186"' + vein + '/>' +
        '<path d="M40 179Q64 191 84 181Q110 201 136 188Q161 202 188 182Q215 192 237 179" fill="none" stroke="#a92254" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M139 191V224" stroke="#bd8528" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="139" cy="228" r="12" fill="#ffd976" stroke="#cf982f" stroke-width="2"/>' +
        '<ellipse cx="136" cy="224" rx="4" ry="3" fill="#fff5c9"/></g>';
    } else if (kind.name === 'daisy') {
      const petals = Array.from({ length: 12 }, (_, i) => '<ellipse class="petal" cx="140" cy="78" rx="27" ry="50" transform="rotate(' + (i * 30 + 9) + ' 140 140)"' + petal + '/>').join('');
      const seeds = Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6;
        return '<circle cx="' + (140 + Math.cos(a) * 24).toFixed(2) + '" cy="' + (140 + Math.sin(a) * 24).toFixed(2) + '" r="2.8" fill="#a96821" opacity=".6"/>';
      }).join('');
      shape = petals + '<circle cx="140" cy="140" r="39" fill="#b57a2b"/>' +
        '<circle cx="140" cy="137" r="34" fill="#dfaa45"/>' + seeds +
        '<ellipse cx="132" cy="127" rx="16" ry="10" fill="#f9d579" opacity=".7"/>' +
        '<circle cx="143" cy="141" r="5" fill="#a96821" opacity=".65"/>';
    } else if (kind.name === 'tulip') {
      shape = '<g transform="rotate(7 140 140)">' +
        '<path class="petal" d="M45 75C67 81 86 102 94 114C104 77 118 43 137 28C157 55 169 78 178 105C192 86 212 68 232 64C227 169 192 224 141 228C88 226 53 174 45 75Z"' + petal + '/>' +
        '<path d="M137 30C111 82 105 156 141 224C179 160 168 80 137 30Z" fill="#b28aef" stroke="#8652c6" stroke-width="1.5"/>' +
        '<path d="M111 86C105 129 118 181 137 207" fill="none" stroke="#ddcbff" stroke-width="8" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M49 82C91 122 83 189 139 224M228 72C188 122 195 184 144 225"' + vein + '/>' +
        '<path d="M117 224Q140 240 165 223L155 241H130Z" fill="#489c61"/></g>';
    } else if (kind.name === 'anemone') {
      shape = Array.from({ length: 6 }, (_, i) => '<ellipse class="petal" cx="140" cy="89" rx="45" ry="61" transform="rotate(' + (i * 60 + 12) + ' 140 140)"' + petal + '/>').join('') +
        '<circle cx="140" cy="140" r="38" fill="#e0f4d9"/>' +
        Array.from({ length: 13 }, (_, i) => {
          const a = i * Math.PI * 2 / 13;
          const x = (140 + Math.cos(a) * 31).toFixed(2);
          const y = (140 + Math.sin(a) * 31).toFixed(2);
          return '<path d="M140 140L' + x + ' ' + y + '" stroke="#317e88" stroke-width="2"/><circle cx="' + x + '" cy="' + y + '" r="4" fill="#285e71"/>';
        }).join('') + '<circle cx="140" cy="140" r="19" fill="#39546e"/><ellipse cx="135" cy="134" rx="8" ry="6" fill="#788da8"/>';
    } else if (kind.name === 'poppy') {
      shape = '<path class="petal" d="M139 146C65 174 18 133 29 84C34 59 56 51 78 68C89 24 133 34 151 74C179 29 219 43 218 82C261 76 268 121 240 150C211 181 171 182 139 146Z"' + petal + '/>' +
        '<path class="petal" d="M140 145C105 102 55 107 43 150C27 196 75 235 119 222C136 246 178 243 191 218C234 228 262 192 239 158C218 119 174 115 140 145Z"' + petal + '/>' +
        '<path d="M59 157C54 186 78 204 104 206M73 82C96 87 113 106 119 125" fill="none" stroke="#ffe0ac" stroke-width="8" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M150 149L191 93M150 155L206 190M134 152L89 175"' + vein + '/>' +
        '<circle cx="143" cy="150" r="27" fill="#43535e"/>' +
        Array.from({ length: 9 }, (_, i) => '<ellipse cx="143" cy="130" rx="4" ry="8" fill="#f6d28c" transform="rotate(' + (i * 40) + ' 143 150)"/>').join('') +
        '<circle cx="143" cy="150" r="12" fill="#90a988"/>';
    } else {
      shape = Array.from({ length: 8 }, (_, i) => '<path class="petal" d="M140 141C111 128 101 94 109 63L124 48L137 57L149 45L168 62C178 94 166 125 140 141Z" transform="rotate(' + (i * 45 + 10) + ' 140 140)"' + petal + '/>').join('') +
        Array.from({ length: 8 }, (_, i) => '<path d="M140 135L138 77" transform="rotate(' + (i * 45 + 10) + ' 140 140)"' + vein + '/>').join('') +
        '<circle cx="140" cy="140" r="29" fill="#b75651"/><circle cx="140" cy="137" r="24" fill="#ffd578"/>' +
        '<path d="M125 137H154M140 124V151M130 126L150 146M127 148L152 127" stroke="#e9ad45" stroke-width="3" stroke-linecap="round"/>';
    }

    // Reuse the painted silhouette so highlights never spill into the button area.
    const maskId = 'garden-flower-mask-' + kind.name;
    const glowId = 'garden-flower-glow-' + kind.name;
    const silhouette = shape.replace(/fill="(?!none")[^"]*"/g, 'fill="#fff"').replace(/stroke="(?!none")[^"]*"/g, 'stroke="#fff"');
    return '<svg class="flower-crown" viewBox="0 0 280 280" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + '" x1=".15" y1="0" x2=".85" y2="1"><stop stop-color="' + kind.light + '"/><stop offset=".5" stop-color="' + kind.color + '"/><stop offset="1" stop-color="' + kind.shade + '"/></linearGradient>' +
      '<radialGradient id="' + glowId + '"><stop stop-color="#fffdf0"/><stop offset=".7" stop-color="#ffedbc"/><stop offset="1" stop-color="#ffe09a"/></radialGradient>' +
      '<mask id="' + maskId + '" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="280" height="280">' + silhouette + '</mask>' +
      '</defs><g class="flower-artwork">' + shape + '</g>' +
      '<g class="flower-highlight" mask="url(#' + maskId + ')">' +
      '<rect class="scan-highlight" x="0" y="0" width="280" height="280" fill="url(#' + glowId + ')" opacity="0"/>' +
      '<circle class="gaze-highlight" cx="140" cy="140" r="' + kind.fillRadius + '" fill="url(#' + glowId + ')" stroke="#fff9e7" stroke-width="2.5" opacity="0"/>' +
      '</g></svg>';
  }

  const stemPaths = [
    'M140 340C123 259 157 212 136 131C125 88 137 39 140 0',
    'M140 340C147 246 124 172 139 85C145 52 140 21 140 0',
    'M140 340C127 240 149 178 140 0',
    'M140 340C147 270 123 207 140 130C152 81 141 37 140 0',
    'M140 340C120 272 155 213 135 138C123 90 143 41 140 0',
    'M140 340C154 266 123 198 141 117C149 73 136 31 140 0'
  ];

  function stem(index) {
    const leaf = ' fill="#59bb60" stroke="#318c49" stroke-width="2.6" stroke-linejoin="round"';
    const light = ' fill="#97d36a" stroke="#4c9b4f" stroke-width="2.6" stroke-linejoin="round"';
    let leaves;
    if (index === 2) {
      leaves = '<path d="M137 320C72 289 80 165 61 132C125 152 145 249 137 320Z"' + leaf + '/>' +
        '<path d="M143 297C209 251 197 123 223 85C152 123 147 235 143 297Z"' + light + '/>';
    } else if (index === 5) {
      leaves = '<path d="M140 279L78 192M140 231L206 145" fill="none" stroke="#42875c" stroke-width="4"/>' +
        '<path d="M108 236Q69 233 52 206Q86 203 108 236ZM92 213Q62 194 63 167Q87 180 92 213ZM169 198Q173 157 200 137Q207 171 169 198ZM182 177Q216 178 236 152Q207 143 182 177Z"' + leaf + '/>';
    } else if (index === 4) {
      leaves = '<path d="M134 284L101 257L78 254L86 235L55 216L74 209L64 180L90 190L95 166L114 204L121 222L135 238Z"' + leaf + '/>' +
        '<path d="M145 242L171 206L193 200L186 181L217 156L195 157L204 131L179 144L171 130L163 169L147 194Z"' + light + '/>';
    } else {
      leaves = '<path d="M136 282C89 289 51 253 43 221C85 215 121 244 136 282Z"' + leaf + '/>' +
        '<path d="M142 230C187 225 220 191 227 155C184 158 151 191 142 230Z"' + light + '/>' +
        '<path d="M132 278L67 238M148 225L207 178" fill="none" stroke="#c7e0a1" stroke-opacity=".7" stroke-width="2"/>';
    }
    return '<svg class="stem-art" viewBox="0 0 280 340" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="plant-stem" d="' + stemPaths[index] + '" fill="none" stroke="#36924f" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="' + stemPaths[index] + '" fill="none" stroke="#9edb7a" stroke-width="3.5" stroke-linecap="round"/>' +
      '<g class="leaf-sway">' + leaves + '</g></svg>';
  }

  function roots() {
    return '<svg class="root-art" viewBox="0 0 280 42" preserveAspectRatio="none" aria-hidden="true">' +
      '<ellipse cx="140" cy="24" rx="72" ry="12" fill="#385d3c" opacity=".18"/>' +
      '<ellipse cx="140" cy="20" rx="40" ry="7" fill="#658749" opacity=".35"/>' +
      '<path d="M111 26Q106 10 94 4Q115 10 123 26M129 27Q128 10 138 0Q137 13 138 27M149 27Q160 10 177 5Q166 18 161 27M170 29Q184 17 196 19" fill="#639950"/>' +
      '</svg>';
  }

  function flower(index) {
    return '<span class="plant" aria-hidden="true"><span class="plant-sway"><span class="flower-response">' +
      stem(index) + crown(index) + '</span></span>' + roots() + '</span>';
  }

  const art = Object.freeze({ kinds, crown, stem, roots, flower });
  if (typeof module !== 'undefined' && module.exports) module.exports = art;
  else window.BellGardenArt = art;
})();
