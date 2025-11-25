// Import Supabase client
import { supabase } from './lib/supabase.js';

const video = document.getElementById('cam-feed');
const canvas = document.getElementById('canvas');
const shutter = document.getElementById('shutter');
const slot = document.getElementById('slot');
const flash = document.getElementById('flash');
const desk = document.getElementById('desk');
const cameraZone = document.querySelector('.camera-zone');

// Email Modal Elements
const emailModal = document.getElementById('email-modal');
const emailForm = document.getElementById('email-form');
const emailInput = document.getElementById('email-input');
const emailCancel = document.getElementById('email-cancel');
const emailSendBtn = document.getElementById('email-send');
const emailStatus = document.getElementById('email-status');

// Email API endpoint (works for both local dev and Vercel)
const EMAIL_API_URL = '/api/send-email';

// Current polaroid being emailed
let pendingEmailPolaroid = null;

// Disable sound for now - add sound file to public directory if needed
// const printSound = new Audio('/polaroid-camera.mp3');
// printSound.volume = 0.6;

let demosCleared = false;

navigator.mediaDevices
  .getUserMedia({ video: { facingMode: 'user', width: 480, height: 480 } })
  .then((stream) => (video.srcObject = stream))
  .catch((err) => console.error(err));

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

// Demo feature disabled - add demo images to public directory if needed
// const demoDate = getTodayDateString();
// const demos = [
//   { src: '/cat-cute-3.webp', rot: '-5deg', top: '30%', left: '30%' },
//   { src: '/cat-cute-2.webp', rot: '8deg', top: '35%', left: '45%' },
//   { src: '/cat-cute-1.webp', rot: '-12deg', top: '45%', left: '35%' },
// ];

// function spawnDemos() {
//   desk.innerHTML = '';
//   demosCleared = false;
//   demos.forEach((d) => {
//     createPolaroidElement(d.src, demoDate, d.top, d.left, d.rot, true, false);
//   });
// }

// spawnDemos();

function createPolaroidElement(imgSrc, dateStr, top, left, rot, isDemo = false, isNew = false) {
  const MAX_CAPTION_LENGTH = 27;

  const div = document.createElement('div');
  div.className = isDemo ? 'polaroid demo-polaroid' : 'polaroid';
  if (isNew) div.classList.add('developing-start');

  div.innerHTML = `
    <div class="polaroid-inner">
      <div class="polaroid-front">
        <img src="${imgSrc}">
        <div class="polaroid-actions">
            <button class="polaroid-email-btn" title="Send via Email">Email</button>
        </div>
        <button class="flip-btn" title="Flip to back">↻</button>
        <div class="caption-main" contenteditable="true" spellcheck="false"></div>
        <div class="caption-date">${dateStr}</div>
      </div>
    <div class="polaroid-back">
       <div class="polaroid-actions">
            <button class="polaroid-email-btn" title="Send via Email">Email</button>
        </div>
      <button class="flip-btn" title="Flip to front">↻</button>
    </div>
    </div>
  `;

  if (top) div.style.top = top;
  if (left) div.style.left = left;
  if (rot) div.style.transform = `rotate(${rot})`;

  if (isDemo) {
    desk.appendChild(div);
  } else if (isNew) {
    requestAnimationFrame(() => {
      div.offsetWidth;
      div.classList.add('developing-slow');
      div.classList.remove('developing-start');
    });
  }

  const flipBtns = div.querySelectorAll('.flip-btn');
  flipBtns.forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      div.classList.toggle('flipped');
  }));

  const emailBtns = div.querySelectorAll('.polaroid-email-btn');
  emailBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          pendingEmailPolaroid = div;
          openEmailModal();
      });
  });

  const captionMain = div.querySelector('.caption-main');
  if (captionMain) {
    captionMain.addEventListener('input', function () {
      const text = this.textContent;
      if (text.length > MAX_CAPTION_LENGTH) {
        this.textContent = text.substring(0, MAX_CAPTION_LENGTH);
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(this);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });

    captionMain.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') e.preventDefault();
    });

    // Persist caption to database when user finishes editing
    captionMain.addEventListener('blur', function () {
      const caption = this.textContent.trim();
      // Store pending caption on the element (for when upload completes)
      div.dataset.pendingCaption = caption;
      
      const galleryId = div.dataset.galleryId;
      if (galleryId) {
        updatePhotoCaption(galleryId, caption);
      }
      // If galleryId not set yet, uploadPhotoToStorage will handle it when it completes
    });
  }

  makeDraggable(div);
  return div;
}

function clearDemos() {
  const demoItems = document.querySelectorAll('.demo-polaroid');
  demoItems.forEach((item) => {
    item.style.opacity = '0';
    item.style.transform = 'scale(0.8)';
    setTimeout(() => item.remove(), 500);
  });
}


shutter.addEventListener('click', (e) => {
  e.preventDefault();
  // if (!demosCleared) {
  //   clearDemos();
  //   demosCleared = true;
  // }
  flash.classList.add('flash-active');
  setTimeout(() => flash.classList.remove('flash-active'), 100);
  // printSound.currentTime = 0;
  // printSound.play().catch((e) => {});
  const ctx = canvas.getContext('2d');
  const size = Math.min(video.videoWidth, video.videoHeight);
  canvas.width = 400;
  canvas.height = 400;
  ctx.translate(400, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size, 0, 0, 400, 400);
  ejectPhoto(canvas.toDataURL('image/jpeg'));
});

function ejectPhoto(src) {
  if (slot.firstChild) slot.removeChild(slot.firstChild);
  const p = createPolaroidElement(src, getTodayDateString(), null, null, null, false, true);
  p.classList.add('ejecting');
  slot.appendChild(p);
  
  // Auto-upload to Supabase storage in background
  uploadPhotoToStorage(src, p);
}

/**
 * Uploads photo to Supabase storage and records in gallery table.
 * Runs in background (non-blocking) so UI remains responsive.
 * @param {string} dataUrl - Base64 data URL of the photo
 * @param {HTMLElement} polaroidElement - The polaroid DOM element to store the public URL on
 */
async function uploadPhotoToStorage(dataUrl, polaroidElement) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Skip if Supabase is not configured
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon')) {
    console.warn('Supabase not configured - photo will not be persisted');
    return;
  }

  try {
    // Convert data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    // Generate unique filename
    const fileName = `photos/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
    
    // Store public URL on polaroid element for use by email feature
    polaroidElement.dataset.publicUrl = publicUrl;

    // Check if user already entered a caption while uploading
    const pendingCaption = polaroidElement.dataset.pendingCaption || '';
    
    // Insert record into gallery table and get the ID back
    const { data: dbData, error: dbError } = await supabase.from('gallery').insert([{
      url: publicUrl,
      caption: pendingCaption,
      event_id: null,
      created_at: new Date()
    }]).select('id').single();

    if (dbError) throw dbError;

    // Store gallery record ID on polaroid for caption updates
    polaroidElement.dataset.galleryId = dbData.id;

    console.log('Photo saved to Supabase:', publicUrl, 'ID:', dbData.id, 'Caption:', pendingCaption);

  } catch (error) {
    console.error('Auto-upload error:', error);
    // Silent fail - don't disrupt user experience
  }
}

/**
 * Updates the caption for a photo in the gallery table.
 * @param {string} galleryId - The gallery record ID
 * @param {string} caption - The new caption text
 */
async function updatePhotoCaption(galleryId, caption) {
  if (!galleryId) return;
  
  try {
    const { error } = await supabase
      .from('gallery')
      .update({ caption })
      .eq('id', galleryId);

    if (error) throw error;
    console.log('Caption updated for photo:', galleryId);
  } catch (error) {
    console.error('Caption update error:', error);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
      if(emailModal.classList.contains('open')) closeEmailModal();
  }
});

// Email Modal Functions
function openEmailModal() {
  emailModal.classList.add('open');
  emailInput.value = '';
  emailStatus.textContent = '';
  emailStatus.className = 'email-status';
  emailSendBtn.disabled = false;
  emailSendBtn.textContent = 'Send';
  setTimeout(() => emailInput.focus(), 100);
}

function closeEmailModal() {
  emailModal.classList.remove('open');
  pendingEmailPolaroid = null;
  emailInput.value = '';
  emailStatus.textContent = '';
  emailStatus.className = 'email-status';
}

emailCancel.addEventListener('click', closeEmailModal);

emailModal.addEventListener('click', (e) => {
  if (e.target === emailModal) closeEmailModal();
});

emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!pendingEmailPolaroid) {
    emailStatus.textContent = 'Error: No photo selected';
    emailStatus.className = 'email-status error';
    return;
  }

  const email = emailInput.value.trim();
  if (!email) {
    emailStatus.textContent = 'Please enter your email address';
    emailStatus.className = 'email-status error';
    return;
  }

  const img = pendingEmailPolaroid.querySelector('img');
  if (!img) {
    emailStatus.textContent = 'Error: Could not find photo';
    emailStatus.className = 'email-status error';
    return;
  }

  const captionEl = pendingEmailPolaroid.querySelector('.caption-main');
  const caption = captionEl ? captionEl.innerText.trim() : '';

  // Update UI to loading state
  emailSendBtn.disabled = true;
  emailSendBtn.textContent = 'Sending...';
  emailStatus.textContent = '';
  emailStatus.className = 'email-status';

  try {
    // Get photo data (base64)
    let photoData = img.src;
    
    // If it's not already base64, convert it
    if (!photoData.startsWith('data:')) {
      const response = await fetch(photoData);
      const blob = await response.blob();
      photoData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }

    // Send to backend API
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, photoData, caption })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    // Success!
    emailStatus.textContent = '✓ Email sent! Check your inbox.';
    emailStatus.className = 'email-status success';
    
    setTimeout(() => closeEmailModal(), 2000);

  } catch (error) {
    console.error('Email error:', error);
    emailStatus.textContent = error.message || 'Failed to send email. Please try again.';
    emailStatus.className = 'email-status error';
    emailSendBtn.disabled = false;
    emailSendBtn.textContent = 'Send';
  }
});

function makeDraggable(elm) {
  let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

  elm.addEventListener('mousedown', dragStart);
  elm.addEventListener('touchstart', dragStart, { passive: false });

  function dragStart(e) {
    if (
      e.target.closest('.caption-main') ||
      e.target.closest('.polaroid-email-btn') ||
      e.target.closest('.flip-btn')
    ) return;

    e.preventDefault();

    if (elm.classList.contains('developing-slow')) {
      elm.classList.remove('developing-slow');
      void elm.offsetWidth;
      elm.classList.add('developing-fast');
    }

    if (elm.classList.contains('ejecting')) {
      const rect = elm.getBoundingClientRect();
      elm.classList.remove('ejecting');
      document.body.appendChild(elm);
      elm.style.position = 'absolute';
      elm.style.left = rect.left + 'px';
      elm.style.top = rect.top + 'px';
      elm.style.transform = 'rotate(0deg)';
    } else if (elm.parentNode !== document.body) {
      const rect = elm.getBoundingClientRect();
      document.body.appendChild(elm);
      elm.style.left = rect.left + 'px';
      elm.style.top = rect.top + 'px';
    }

    elm.style.zIndex = 10000;
    
    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else {
      startX = e.clientX;
      startY = e.clientY;
    }
    initialLeft = elm.offsetLeft;
    initialTop = elm.offsetTop;

    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('touchmove', dragMove, { passive: false });
  }

  function dragMove(e) {
    e.preventDefault();
    let currentX, currentY;
    if (e.type === 'touchmove') {
      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;
    } else {
      currentX = e.clientX;
      currentY = e.clientY;
    }
    const dx = currentX - startX;
    const dy = currentY - startY;
    elm.style.left = initialLeft + dx + 'px';
    elm.style.top = initialTop + dy + 'px';
    const tilt = Math.max(-8, Math.min(8, dx * 0.1));
    elm.style.transform = `rotate(${tilt}deg) scale(1.05)`;
  }

  function dragEnd() {
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchend', dragEnd);
    document.removeEventListener('touchmove', dragMove);
    elm.classList.add('can-share');
    elm.style.zIndex = 'auto';
    const finalRot = (Math.random() * 20 - 10).toFixed(1);
    elm.style.transition = 'transform 0.2s, box-shadow 0.2s';
    elm.style.transform = `rotate(${finalRot}deg) scale(1)`;
    setTimeout(() => {
      elm.style.transition = '';
    }, 200);
  }
}

