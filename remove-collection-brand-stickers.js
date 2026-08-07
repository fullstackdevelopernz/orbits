(function removeCollectionBrandStickers(){
  const strip = () => {
    document.querySelectorAll('.collection-brand-sticker').forEach(el => el.remove());
  };

  strip();

  const app = document.getElementById('app');
  if (app) {
    new MutationObserver(strip).observe(app, { childList: true, subtree: true });
  }

  if (typeof window.collectionPreview === 'function') {
    window.collectionPreview = function(key, context='card'){
      const meta = window.collectionMeta ? window.collectionMeta(key) : { title: key };
      return `<div class="collection-preview collection-preview-${context} ${key}">
        <img class="collection-art" src="assets/${key}-collection.png" alt="${meta.title} Orbit collection">
      </div>`;
    };
    if (typeof window.render === 'function') window.render();
  }
})();
