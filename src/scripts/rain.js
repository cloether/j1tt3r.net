;// noinspection LongLine
(function () {
  'use strict';

  // noinspection JSUnusedLocalSymbols
  window.requestAnimFrame = (function (callback) {
    // noinspection OverlyComplexBooleanExpressionJS,JSUnresolvedVariable
    return window.requestAnimationFrame
      || window.webkitRequestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.oRequestAnimationFrame
      || window.msRequestAnimationFrame
      || function (callback) {
        // noinspection DynamicallyGeneratedCodeJS
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  let drops = [];
  let frame = 1;
  let canvas;
  let ctx;
  let pwa = 0;
  let fontSize = getLocalStorage("fs", 10);
  let fillChars = getLocalStorage("fc", '0,1').split(",") || ['0', '1'];

  // event listeners
  window.addEventListener("load", initCanvas);
  window.addEventListener("load", init);
  window.addEventListener("resize", resize);

  /**
   * Get the URL parameters
   *
   * @link: https://css-tricks.com/snippets/javascript/get-url-variables/
   * @param  {String} url
   * @return {Object.<string,string>} URL parameters
   */
  let getParams = function (url) {
    const params = {};
    const parser = document.createElement('a');
    parser.href = url;
    const vars = parser.search.substring(1).split('&');
    for (let i = 0; i < vars.length; i++) {
      let parts = vars[i].split('=');
      params[parts[0]] = decodeURIComponent(parts[1]);
    }
    return params;
  };

  /**
   * Draw Canvas
   */
  let draw = function () {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(0, 255, 0, 0.5)`;
    ctx.font = `${fontSize}px arial`;
    for (let i = 0; i < drops.length; i++) {
      let text = fillChars[Math.floor(Math.random() * fillChars.length)];
      let y = drops[i] * fontSize;
      ctx.fillText(text, i * fontSize, y);
      if (Math.random() > 0.956 && canvas.height < y) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  /**
   * Re-Draw Canvas
   */
  let redraw = function () {
    // 1: draw, 2: reset, 3: write
    if (frame === 1) {
      draw();
    } else {
      if (frame === 2) {
        // noinspection ReuseOfLocalVariableJS
        frame = 0;
      }
    }
    frame++;
    window.requestAnimationFrame(redraw)
  }

  /**
   * Get value from local storage.
   *
   * @returns value if key exists otherwise defaultValue.
   */
  function getLocalStorage(key, defaultValue) {
    return localStorage.getItem(key) || defaultValue;
  }

  /**
   * Get current mouse position
   */
  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};
  }

  /**
   * Resize Event Handler
   */
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let n = Math.ceil(canvas.width / fontSize) - drops.length;

    if (n > 0) {
      // The slice() method returns a shallow copy of a portion
      // of an array into a new array object selected from begin
      // to end (end not included), where begin and end represent
      // the index of items in that array. The original array will
      // not be modified.
      let index = Math.max(drops.length - n, 1);

      drops.slice(index).forEach((i) => drops.push(i))
    } else if (n < 0) {
      for (let i = 0; i < n; i++) {
        drops.pop();
      }
    }
  }

  // noinspection LongLine
  function initCanvas() {
    // https://codedraken.github.io/canvas-coords/
    // http://www.html5canvastutorials.com/
    // https://codeburst.io/creating-and-drawing-on-an-html5-canvas-using-javascript-93da75f001c1
    canvas = document.querySelector('canvas');

    if (!(canvas instanceof HTMLCanvasElement)) {
      canvas = document.createElement("canvas");
      // canvas.style.display = "none";  // the canvas should not be visible
      let body = document.getElementsByTagName("body")[0];
      body.insertBefore(canvas, body.firstChild);
    }

    // if working with 3D you would use WebGL.
    ctx = canvas.getContext('2d');

    canvas.addEventListener('dblclick', (evt) => {
      const {x, y} = getMousePos(canvas, evt);
      console.debug(`Mouse position: ${x}, ${y}`)
      // TODO: Ripple
    }, false);
  }

  /**
   * Initialize
   */
  function init() {
    const params = getParams(window.location.href);
    pwa = params.pwa || 0;
    console.debug("PWA:", pwa)
    fontSize = params.fs || params.fontSize || fontSize;
    fillChars = params.fc || params.fillChars || fillChars;
    localStorage.setItem("fs", fontSize);
    localStorage.setItem("fc", fillChars);
    for (let i = 0; i < Math.ceil(window.innerWidth / fontSize); i++) {
      drops[i] = 1;
    }
    resize() || redraw()
  }
})();
