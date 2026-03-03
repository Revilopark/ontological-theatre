// Auto-generated panel overrides — replaces expired Fal.ai URLs with locally-generated panels
// Generated: 2026-03-03 by Imagen 4 API (imagen-4.0-fast-generate-001)
// Total panels: 70 across episodes 2-9, 12-15
window.CS_PANEL_OVERRIDES = {
  2: [
    './cs-panels/ep02-p1.jpg',
    './cs-panels/ep02-p2.jpg',
    './cs-panels/ep02-p3.jpg',
    './cs-panels/ep02-p4.jpg',
    './cs-panels/ep02-p5.jpg',
    './cs-panels/ep02-p6.jpg'
  ],
  3: [
    './cs-panels/ep03-p1.jpg',
    './cs-panels/ep03-p2.jpg',
    './cs-panels/ep03-p3.jpg',
    './cs-panels/ep03-p4.jpg',
    './cs-panels/ep03-p5.jpg',
    './cs-panels/ep03-p6.jpg'
  ],
  4: [
    './cs-panels/ep04-p1.jpg',
    './cs-panels/ep04-p2.jpg',
    './cs-panels/ep04-p3.jpg',
    './cs-panels/ep04-p4.jpg',
    './cs-panels/ep04-p5.jpg',
    './cs-panels/ep04-p6.jpg'
  ],
  5: [
    './cs-panels/ep05-p1.jpg',
    './cs-panels/ep05-p2.jpg',
    './cs-panels/ep05-p3.jpg',
    './cs-panels/ep05-p4.jpg',
    null,
    './cs-panels/ep05-p6.jpg'
  ],
  6: [
    './cs-panels/ep06-p1.jpg',
    './cs-panels/ep06-p2.jpg',
    null,
    './cs-panels/ep06-p4.jpg',
    './cs-panels/ep06-p5.jpg',
    './cs-panels/ep06-p6.jpg'
  ],
  7: [
    './cs-panels/ep07-p1.jpg',
    './cs-panels/ep07-p2.jpg',
    './cs-panels/ep07-p3.jpg',
    './cs-panels/ep07-p4.jpg',
    './cs-panels/ep07-p5.jpg',
    './cs-panels/ep07-p6.jpg'
  ],
  8: [
    './cs-panels/ep08-p1.jpg',
    './cs-panels/ep08-p2.jpg',
    './cs-panels/ep08-p3.jpg',
    './cs-panels/ep08-p4.jpg',
    './cs-panels/ep08-p5.jpg',
    './cs-panels/ep08-p6.jpg'
  ],
  9: [
    './cs-panels/ep09-p1.jpg',
    './cs-panels/ep09-p2.jpg',
    './cs-panels/ep09-p3.jpg',
    './cs-panels/ep09-p4.jpg',
    './cs-panels/ep09-p5.jpg',
    './cs-panels/ep09-p6.jpg'
  ],
  12: [
    './cs-panels/ep12-p1.jpg',
    './cs-panels/ep12-p2.jpg',
    './cs-panels/ep12-p3.jpg',
    './cs-panels/ep12-p4.jpg',
    './cs-panels/ep12-p5.jpg',
    './cs-panels/ep12-p6.jpg'
  ],
  13: [
    './cs-panels/ep13-p1.jpg',
    './cs-panels/ep13-p2.jpg',
    null,
    './cs-panels/ep13-p4.jpg',
    './cs-panels/ep13-p5.jpg',
    './cs-panels/ep13-p6.jpg'
  ],
  14: [
    './cs-panels/ep14-p1.jpg',
    './cs-panels/ep14-p2.jpg',
    './cs-panels/ep14-p3.jpg',
    './cs-panels/ep14-p4.jpg',
    './cs-panels/ep14-p5.jpg',
    './cs-panels/ep14-p6.jpg'
  ],
  15: [
    './cs-panels/ep15-p1.jpg',
    './cs-panels/ep15-p2.jpg',
    './cs-panels/ep15-p3.jpg',
    null,
    './cs-panels/ep15-p5.jpg',
    './cs-panels/ep15-p6.jpg',
    './cs-panels/ep15-p7.jpg',
    './cs-panels/ep15-p8.jpg'
  ]
};

(function applyOverrides() {
  function tryApply() {
    if (!window.EPISODES) { setTimeout(tryApply, 100); return; }
    Object.entries(window.CS_PANEL_OVERRIDES).forEach(([epId, urls]) => {
      const ep = window.EPISODES.find(e => e.id === parseInt(epId));
      if (ep) urls.forEach((url, i) => { if (ep.panels[i] && url) ep.panels[i].img = url; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryApply);
  else tryApply();
})();
