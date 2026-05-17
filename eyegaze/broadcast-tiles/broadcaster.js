(() => {
  const channelName = 'eyegaze-broadcast-tiles';
  const broadcaster = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null;

  const imageInput = document.getElementById('image-input');
  const imageGallery = document.getElementById('image-gallery');
  const noImageThumb = document.getElementById('no-image-thumb');

  const nextButton = document.getElementById('next-to-choices');
  const backButton = document.getElementById('back-to-upload');
  const uploadPanel = document.getElementById('upload-panel');
  const choicesPanel = document.getElementById('choices-panel');
  const stepUpload = document.getElementById('step-upload');
  const stepChoices = document.getElementById('step-choices');

  const choiceCountInput = document.getElementById('choice-count');
  const choiceGrid = document.getElementById('choice-grid');
  const refreshPreviewButton = document.getElementById('refresh-preview');
  const previewGrid = document.getElementById('preview-grid');
  const sendStatus = document.getElementById('send-status');
  const sendTilesButton = document.getElementById('send-tiles');
  const openViewerButton = document.getElementById('open-viewer');
  const tileSizeInput = document.getElementById('tile-size');
  const tileSizeValue = document.getElementById('tile-size-value');

  const uploadedImages = [];

  function setStep(step) {
    if (step === 'upload') {
      uploadPanel.style.display = 'block';
      choicesPanel.style.display = 'none';
      stepUpload.classList.add('active');
      stepChoices.classList.remove('active');
    } else {
      uploadPanel.style.display = 'none';
      choicesPanel.style.display = 'block';
      stepUpload.classList.remove('active');
      stepChoices.classList.add('active');
      buildChoiceCards();
      renderPreview();
    }
  }

  function renderGallery() {
    imageGallery.innerHTML = '';
    if (!uploadedImages.length) {
      imageGallery.appendChild(noImageThumb);
      noImageThumb.style.display = 'block';
      return;
    }

    noImageThumb.style.display = 'none';
    uploadedImages.forEach((img, index) => {
      const card = document.createElement('div');
      card.className = 'thumb';
      card.innerHTML = `
        <img src="${img.data}" alt="${img.name}" />
        <div>${img.name || 'Image ' + (index + 1)}</div>
      `;
      imageGallery.appendChild(card);
    });
  }

  function readFiles(files) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedImages.push({ name: file.name, data: e.target.result });
        renderGallery();
        buildChoiceCards();
      };
      reader.readAsDataURL(file);
    });
  }

  function createChoiceCard(index) {
    const card = document.createElement('div');
    card.className = 'choice-card';
    card.dataset.index = index;

    const title = document.createElement('h3');
    title.textContent = `Choice ${index + 1}`;
    card.appendChild(title);

    const typeRow = document.createElement('div');
    typeRow.className = 'form-row';
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Type';
    typeLabel.setAttribute('for', `type-${index}`);

    const typeSelect = document.createElement('select');
    typeSelect.id = `type-${index}`;
    ['image', 'number', 'text'].forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
      typeSelect.appendChild(opt);
    });
    typeSelect.value = 'image';

    typeRow.appendChild(typeLabel);
    typeRow.appendChild(typeSelect);
    card.appendChild(typeRow);

    const contentRow = document.createElement('div');
    contentRow.className = 'form-row';
    contentRow.dataset.role = 'content-row';
    card.appendChild(contentRow);

    function renderContentRow() {
      contentRow.innerHTML = '';
      if (typeSelect.value === 'image') {
        const label = document.createElement('label');
        label.textContent = 'Image choice';
        label.setAttribute('for', `image-${index}`);

        const select = document.createElement('select');
        select.id = `image-${index}`;
        if (!uploadedImages.length) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Upload images first';
          select.appendChild(opt);
        } else {
          uploadedImages.forEach((img, imgIndex) => {
            const opt = document.createElement('option');
            opt.value = imgIndex;
            opt.textContent = img.name || `Image ${imgIndex + 1}`;
            select.appendChild(opt);
          });
        }

        contentRow.appendChild(label);
        contentRow.appendChild(select);
      } else {
        const label = document.createElement('label');
        label.textContent = typeSelect.value === 'number' ? 'Number' : 'Text';
        label.setAttribute('for', `text-${index}`);
        const input = document.createElement('input');
        input.type = typeSelect.value === 'number' ? 'number' : 'text';
        input.id = `text-${index}`;
        input.placeholder = typeSelect.value === 'number' ? '42' : 'Enter text';
        contentRow.appendChild(label);
        contentRow.appendChild(input);
      }
    }

    typeSelect.addEventListener('change', () => {
      renderContentRow();
      renderPreview();
    });

    renderContentRow();
    return card;
  }

  function buildChoiceCards() {
    const count = Math.max(1, Math.min(6, parseInt(choiceCountInput.value, 10) || 1));
    choiceCountInput.value = count;
    choiceGrid.innerHTML = '';
    for (let i = 0; i < count; i += 1) {
      choiceGrid.appendChild(createChoiceCard(i));
    }
  }

  function collectChoices() {
    const cards = Array.from(choiceGrid.querySelectorAll('.choice-card'));
    return cards.map((card) => {
      const index = parseInt(card.dataset.index, 10);
      const typeSelect = card.querySelector(`#type-${index}`);
      const contentRow = card.querySelector('[data-role="content-row"]');
      const type = typeSelect?.value || 'image';
      if (type === 'image') {
        const select = contentRow.querySelector('select');
        const imageIndex = parseInt(select?.value, 10);
        const chosen = Number.isInteger(imageIndex) ? uploadedImages[imageIndex] : null;
        return { type, image: chosen?.data || '', alt: chosen?.name || `Choice ${index + 1}` };
      }
      const input = contentRow.querySelector('input');
      return { type, text: input?.value || '', alt: input?.value || `Choice ${index + 1}` };
    });
  }

  function renderPreview() {
    const tiles = collectChoices();
    previewGrid.innerHTML = '';
    tiles.forEach((tile, idx) => {
      const tileEl = document.createElement('div');
      tileEl.className = 'tile';
      if (tile.type === 'image' && tile.image) {
        tileEl.style.backgroundImage = `url(${tile.image})`;
      } else {
        tileEl.style.backgroundImage = 'linear-gradient(135deg, #80deea, #0097a7)';
      }
      const caption = document.createElement('div');
      caption.className = 'caption';
      caption.textContent = tile.alt || tile.text || `Choice ${idx + 1}`;
      tileEl.appendChild(caption);
      previewGrid.appendChild(tileEl);
    });
  }

  function sendTiles() {
    const tiles = collectChoices();
    const payload = {
      kind: 'tile-set',
      tiles,
      tileSize: parseInt(tileSizeInput.value, 10) || 36,
      sentAt: Date.now(),
    };

    if (!broadcaster) {
      sendStatus.textContent = 'BroadcastChannel not supported in this browser';
      return;
    }

    broadcaster.postMessage(payload);
    sendStatus.textContent = 'Tiles sent to viewer';
    setTimeout(() => {
      sendStatus.textContent = 'Waiting to send.';
    }, 2000);
  }

  function openViewer() {
    window.open('viewer.html', 'eyegaze-tile-viewer');
  }

  // Event bindings
  imageInput?.addEventListener('change', (event) => {
    if (event.target.files?.length) {
      readFiles(event.target.files);
    }
  });

  nextButton?.addEventListener('click', () => setStep('choices'));
  backButton?.addEventListener('click', () => setStep('upload'));
  refreshPreviewButton?.addEventListener('click', renderPreview);
  sendTilesButton?.addEventListener('click', sendTiles);
  openViewerButton?.addEventListener('click', openViewer);

  choiceCountInput?.addEventListener('input', buildChoiceCards);
  tileSizeInput?.addEventListener('input', (e) => {
    tileSizeValue.textContent = e.target.value;
  });

  // Initialize
  renderGallery();
  buildChoiceCards();
  renderPreview();
  tileSizeValue.textContent = tileSizeInput?.value || '36';
})();
