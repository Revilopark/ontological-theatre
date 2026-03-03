/**
 * Ontological Theatre — Video Generation Module
 * Supports: Seedance v1 (ByteDance), Kling v2, Wan 2.1 i2v, Minimax Video-01
 * All routes: FAL_KEY → Proxy → Direct API
 * 
 * Usage:
 *   const video = await OTVideo.imageToVideo(imageUrl, prompt, {model:'seedance', duration:5});
 *   const episodeVideo = await OTVideo.sequenceEpisode(panelUrls, episodeTitle, {style:'cinematic'});
 */

const OTVideo = (() => {
  const PROXY = 'https://awareness-proxy-328246068140.us-central1.run.app';

  // Model registry — ranked by quality/cost
  const MODELS = {
    seedance: {
      name: 'Seedance v1 Pro',
      endpoint: 'fal-ai/bytedance/seedance-v1-pro',
      lite: 'fal-ai/bytedance/seedance-v1-lite',
      durations: [4, 8],
      resolutions: ['480p', '720p'],
      default_duration: 5,
      motion_desc: 'Cinematic fluid motion, natural scene physics, photorealistic'
    },
    kling: {
      name: 'Kling v2 Standard',
      endpoint: 'fal-ai/kling-video/v2/standard/image-to-video',
      pro: 'fal-ai/kling-video/v2/pro/image-to-video',
      durations: [5, 10],
      resolutions: ['720p', '1080p'],
      default_duration: 5,
      motion_desc: 'Smooth cinematic camera movement, dramatic motion, high fidelity'
    },
    wan: {
      name: 'Wan 2.1 i2v',
      endpoint: 'fal-ai/wan/v2.1/i2v',
      turbo: 'fal-ai/wan-t2v-turbo',
      durations: [4, 8],
      resolutions: ['480p', '720p'],
      default_duration: 4,
      motion_desc: 'Artistic motion, stylized animation, creative visual storytelling'
    },
    minimax: {
      name: 'Minimax Video-01',
      endpoint: 'fal-ai/minimax/video-01',
      durations: [6],
      resolutions: ['720p'],
      default_duration: 6,
      motion_desc: 'High quality realistic motion, scene coherence'
    }
  };

  // Camera movement vocabulary — matched to Clarksdale era/mood
  const CAMERA_MOVES = {
    wpa: 'slow push in, camera rising slightly, warm amber light flickering, dust motes floating',
    harlem_renaissance: 'elegant lateral drift, golden hour light shifting, figures emerging from shadow',
    mid_century: 'confident zoom in on central subject, sharp mid-century focus pull',
    jacob_lawrence: 'geometric pan across flat color planes, bold and deliberate movement',
    sacred_profane: 'slow oscillation between two light sources — gold and red — spiritual and earthly',
    civil_rights: 'dignified still hold then slow upward tilt, monumental framing',
    hiphop: 'handheld energy, slight shake, golden California sunset bloom',
    funk_afrofuturist: 'cosmic zoom out revealing the mothership, swirling purple nebula clouds',
    art_deco: 'elegant pull back revealing the full architectural grandeur, amber lamplight',
    indigenous: 'slow drift across the land as protagonist, earth breathing beneath',
    psychedelic: 'vibrating zoom, complementary colors pulsing, electric energy',
    noir: 'slow push into the shadow, moonlight creeping, mystery deepening',
    mythology: 'god-eye descend, each figure lit like a constellation, golden and inevitable'
  };

  // JLo era camera moves
  const JLO_CAMERA_MOVES = {
    bronx: 'handheld street energy, golden hour flare, fire escape shadows scrolling',
    selena: 'concert push-in toward the stage, rhinestones catching the light, crowd revealed',
    on6: 'red carpet dolly shot, slow motion camera drift, flash photography bokeh',
    jlo: 'celebrity candid handheld, paparazzi flare, golden Malibu light',
    marc: 'romantic slow orbit around candlelit table, Spanish moss swaying',
    idol: 'stage reveal — wide shot then push in to face, standing ovation wave',
    hustlers: 'cold static wide, blue neon pulse, character walks directly at camera',
    timn: 'dawn time-lapse, aurora colors shifting, volcanic mist rising, full circle'
  };

  function getFalKey() {
    return localStorage.getItem('fal_key') ||
           localStorage.getItem('cs_fal_key') ||
           localStorage.getItem('jlo_fal_key') ||
           null;
  }

  async function callFal(modelEndpoint, body, statusCallback) {
    const falKey = getFalKey();

    // Route 1: Direct Fal.ai with user's key
    if (falKey) {
      try {
        if (statusCallback) statusCallback(`Calling ${modelEndpoint} directly...`);
        const r = await fetch(`https://fal.run/${modelEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
          body: JSON.stringify(body)
        });
        if (r.ok) {
          const d = await r.json();
          if (d.video?.url) return d.video.url;
          if (d.request_id) return await pollFalResult(d.request_id, modelEndpoint, falKey, statusCallback);
        }
      } catch(e) { console.warn('Direct Fal failed:', e.message); }
    }

    // Route 2: Through proxy
    try {
      if (statusCallback) statusCallback('Routing through proxy...');
      const r = await fetch(`${PROXY}/fal/generate-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelEndpoint, ...body })
      });
      if (r.ok) {
        const d = await r.json();
        if (d.video?.url) return d.video.url;
        if (d.request_id) return await pollProxyResult(d.request_id, modelEndpoint, statusCallback);
      }
    } catch(e) { console.warn('Proxy Fal failed:', e.message); }

    if (!falKey) {
      const msg = '⚠️ Fal.ai key required for video generation. Open ⚙️ Settings and enter your key.';
      if (statusCallback) statusCallback(msg);
      throw new Error('NO_FAL_KEY');
    }
    throw new Error('Video generation failed on all routes');
  }

  async function pollFalResult(requestId, model, falKey, statusCallback, maxMs=120000) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      await new Promise(r => setTimeout(r, 3000));
      if (statusCallback) statusCallback(`Processing... ${Math.round((Date.now()-start)/1000)}s`);
      try {
        const r = await fetch(`https://queue.fal.run/${model}/requests/${requestId}`, {
          headers: { 'Authorization': `Key ${falKey}` }
        });
        const d = await r.json();
        if (d.status === 'COMPLETED') return d.output?.video?.url || null;
        if (d.status === 'FAILED') throw new Error('Generation failed: ' + d.error);
      } catch(e) { if (e.message.includes('FAILED')) throw e; }
    }
    throw new Error('Video generation timed out');
  }

  async function pollProxyResult(requestId, model, statusCallback, maxMs=120000) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      await new Promise(r => setTimeout(r, 3000));
      if (statusCallback) statusCallback(`Processing via proxy... ${Math.round((Date.now()-start)/1000)}s`);
      try {
        const r = await fetch(`${PROXY}/fal/status?request_id=${encodeURIComponent(requestId)}&model=${encodeURIComponent(model)}`);
        const d = await r.json();
        if (d.video?.url) return d.video.url;
        if (d.status === 'COMPLETED') {
          const rr = await fetch(`${PROXY}/fal/result?request_id=${encodeURIComponent(requestId)}&model=${encodeURIComponent(model)}`);
          const rd = await rr.json();
          return rd.video?.url || null;
        }
      } catch(e) { /* continue polling */ }
    }
    throw new Error('Video generation timed out');
  }

  /**
   * Animate a single image into a video clip
   * @param {string} imageUrl - URL or data URI of the source image
   * @param {string} prompt - Motion description
   * @param {object} opts - {model, duration, era, style}
   */
  async function imageToVideo(imageUrl, prompt, opts = {}) {
    const model = MODELS[opts.model || 'seedance'] || MODELS.seedance;
    const cameraMove = opts.era ? (CAMERA_MOVES[opts.era] || CAMERA_MOVES.noir) : (opts.jloEra ? JLO_CAMERA_MOVES[opts.jloEra] : '');
    const fullPrompt = `${prompt}. ${cameraMove}. Cinematic quality, no text, no watermarks.`;

    const body = {
      image_url: imageUrl,
      prompt: fullPrompt,
      duration: opts.duration || model.default_duration,
      resolution: opts.resolution || model.resolutions[0],
    };

    return await callFal(model.endpoint, body, opts.onStatus);
  }

  /**
   * Generate a full episode video from panel images
   * Sequences all panels with era-appropriate motion and transitions
   * Returns array of video clip URLs (one per panel)
   */
  async function sequenceEpisode(panels, episodeTitle, opts = {}) {
    const clips = [];
    const onStatus = opts.onStatus || console.log;

    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      onStatus(`Animating panel ${i+1}/${panels.length}: ${panel.caption || '...'}`);
      try {
        const clipUrl = await imageToVideo(
          panel.img,
          `${episodeTitle} — ${panel.caption || 'Delta blues scene'}`,
          { era: opts.era, model: opts.model || 'seedance', duration: opts.clipDuration || 5, onStatus }
        );
        clips.push({ panelIdx: i, url: clipUrl, caption: panel.caption });
        onStatus(`✓ Panel ${i+1} animated`);
        // Rate limit between clips
        await new Promise(r => setTimeout(r, 2000));
      } catch(e) {
        onStatus(`✗ Panel ${i+1} failed: ${e.message}`);
        clips.push({ panelIdx: i, url: null, caption: panel.caption, error: e.message });
      }
    }
    return clips;
  }

  /**
   * Check if video generation is available
   */
  function isAvailable() {
    return !!getFalKey();
  }

  function getStatus() {
    const key = getFalKey();
    if (key) return { available: true, message: 'Ready — Fal.ai key configured', key: '••••' + key.slice(-4) };
    return { available: false, message: 'Fal.ai key required — open ⚙️ Settings to add' };
  }

  return { imageToVideo, sequenceEpisode, isAvailable, getStatus, MODELS, CAMERA_MOVES, JLO_CAMERA_MOVES };
})();

// Export for Node.js
if (typeof module !== 'undefined') module.exports = OTVideo;
