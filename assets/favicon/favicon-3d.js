(() => {
  const link = document.getElementById('dynamic-favicon');
  if (!link || !document.createElement('canvas').getContext) return;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const scale = size / 1024;
  const targetVertices = [
    [512, 8.54],
    [107.313, 791.734],
    [916.687, 791.734],
    [512, 1017.66]
  ];
  const tetrahedron = [
    [0, -1, 0],
    [-0.8660254, 0.5, -0.5],
    [0.8660254, 0.5, -0.5],
    [0, 0.5, 1]
  ];
  const edges = [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [1, 3], [2, 3]
  ];
  const orientation = -0.255;
  const orientedAtRest = tetrahedron.map((vertex) => rotateX(vertex, orientation));
  const horizontalScale = (targetVertices[2][0] - targetVertices[1][0]) /
    (orientedAtRest[2][0] - orientedAtRest[1][0]);
  const verticalScale = (targetVertices[3][1] - targetVertices[0][1]) /
    (orientedAtRest[3][1] - orientedAtRest[0][1]);
  const horizontalOffset = targetVertices[0][0] - orientedAtRest[0][0] * horizontalScale;
  const verticalOffset = targetVertices[0][1] - orientedAtRest[0][1] * verticalScale;
  let start = performance.now();
  let animationFrame;
  let pausedAt;
  let lastDraw = -Infinity;
  const frameInterval = 1000 / 15;

  function rotateX([x, y, z], angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x, y * cos - z * sin, y * sin + z * cos];
  }

  function rotateY([x, y, z], angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [x * cos + z * sin, y, -x * sin + z * cos];
  }

  function project(vertex, angle) {
    const spun = rotateY(vertex, angle);
    const oriented = rotateX(spun, orientation);
    return [
      (horizontalOffset + oriented[0] * horizontalScale) * scale,
      (verticalOffset + oriented[1] * verticalScale) * scale,
      oriented[2]
    ];
  }

  function draw(now) {
    if (now - lastDraw < frameInterval) {
      animationFrame = requestAnimationFrame(draw);
      return;
    }
    lastDraw = now;
    const angle = ((now - start) / 8000) * Math.PI * 2;
    const projected = tetrahedron.map((vertex) => project(vertex, angle));

    context.fillStyle = '#141E1E';
    context.fillRect(0, 0, size, size);

    const baseEdges = [3, 4, 5];
    const farthestBaseEdge = baseEdges.reduce((farthest, edgeIndex) => {
      const [from, to] = edges[edgeIndex];
      const depth = (projected[from][2] + projected[to][2]) / 2;
      return depth < farthest.depth ? { edgeIndex, depth } : farthest;
    }, { edgeIndex: baseEdges[0], depth: Infinity }).edgeIndex;

    context.lineWidth = 50 * scale;
    context.lineJoin = 'round';
    edges.forEach(([from, to], edgeIndex) => {
      context.beginPath();
      context.moveTo(projected[from][0], projected[from][1]);
      context.lineTo(projected[to][0], projected[to][1]);
      context.strokeStyle = edgeIndex === farthestBaseEdge
        ? 'rgba(255, 255, 255, 0.6)'
        : '#fff';
      context.stroke();
    });

    context.fillStyle = '#fff';
    projected.forEach(([x, y]) => {
      context.beginPath();
      context.arc(x, y, 25 * scale, 0, Math.PI * 2);
      context.fill();
    });

    link.href = canvas.toDataURL('image/png');
    animationFrame = requestAnimationFrame(draw);
  }

  function pause() {
    if (pausedAt !== undefined) return;
    pausedAt = performance.now();
    cancelAnimationFrame(animationFrame);
  }

  function resume() {
    if (pausedAt === undefined || document.hidden) return;
    const pausedDuration = performance.now() - pausedAt;
    start += pausedDuration;
    pausedAt = undefined;
    animationFrame = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else resume();
  });
  window.addEventListener('blur', pause);
  window.addEventListener('focus', resume);

  animationFrame = requestAnimationFrame(draw);
})();
