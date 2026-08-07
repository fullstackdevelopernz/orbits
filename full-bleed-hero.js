const fullBleedCampaigns = [
  {
    key:'zodiac',
    image:'assets/zodiac-collection.png',
    alt:'Zodiac Orbit Collection pop art campaign',
    kicker:'FIRST DROP · PREORDERS OPEN',
    headline:'YOUR SIGN. YOUR ORBIT.',
    copy:'All 12 Zodiac Orbits in one collectible first release.',
    primary:'PREORDER ZODIAC',
    secondary:'MEET ALL 12'
  },
  {
    key:'manifestation',
    image:'assets/manifestation-collection.png',
    alt:'Manifestation Orbit Collection pop art campaign',
    kicker:'FIRST DROP · PREORDERS OPEN',
    headline:'CARRY WHAT YOU WANT TO CREATE.',
    copy:'Twelve intentions. Twelve personalities. One bold Manifestation drop.',
    primary:'PREORDER MANIFESTATION',
    secondary:'MEET ALL 12'
  },
  {
    key:'crystal',
    image:'assets/crystal-collection.png',
    alt:'Crystal Orbit Collection pop art campaign',
    kicker:'FIRST DROP · PREORDERS OPEN',
    headline:'FIND YOUR ENERGY.',
    copy:'Twelve crystal-inspired Orbits made to collect, carry and display.',
    primary:'PREORDER CRYSTAL',
    secondary:'MEET ALL 12'
  }
];

function fullBleedCampaignSlide(slide,index){
  return `<article class="campaign-slide full-bleed-slide ${slide.key}${index===0?' active':''}" data-slide="${index}" aria-hidden="${index===0?'false':'true'}" style="--campaign-image:url('${slide.image}')">
    <img class="campaign-background" src="${slide.image}" alt="" aria-hidden="true">
    <div class="campaign-poster-stage"><img class="campaign-poster" src="${slide.image}" alt="${slide.alt}"></div>
    <div class="campaign-shade" aria-hidden="true"></div>
    <a class="campaign-wordmark" href="#home" aria-label="ORBITS home">ORBITS</a>
    <div class="campaign-message">
      <span class="campaign-kicker">${slide.kicker}</span>
      <h1>${slide.headline}</h1>
      <p>${slide.copy}</p>
      <div class="campaign-actions">
        <a class="hero-cta hero-cta-primary" href="#collection/${slide.key}">${slide.primary}</a>
        <a class="hero-cta hero-cta-secondary" href="#collection/${slide.key}">${slide.secondary}</a>
      </div>
    </div>
  </article>`;
}

homeTemplate = function(){
  return `<section class="campaign-carousel full-bleed-carousel" id="campaignCarousel" aria-roledescription="carousel">
    <div class="campaign-track">${fullBleedCampaigns.map(fullBleedCampaignSlide).join('')}</div>
    <button class="carousel-arrow carousel-prev" type="button" aria-label="Previous collection">‹</button>
    <button class="carousel-arrow carousel-next" type="button" aria-label="Next collection">›</button>
    <div class="carousel-dots" role="tablist">${fullBleedCampaigns.map((s,i)=>`<button type="button" class="carousel-dot${i===0?' active':''}" data-go="${i}" aria-label="Show ${collectionTitle(s.key)}"></button>`).join('')}</div>
  </section>
  <section class="launch-journey section"><div class="section-heading"><div><p class="eyebrow">Choose your world</p><h2>Three collections. Thirty-six Orbits.</h2></div><p>Meet each collection, choose your favourites and preorder from the first ORBITS release.</p></div><div class="collection-grid">${collectionCard('zodiac')}${collectionCard('manifestation')}${collectionCard('crystal')}</div></section>
  <section class="shop-shell"><div class="section-heading"><div><p class="eyebrow">First-release favourites</p><h2>Start your collection</h2></div><a class="secondary" href="#shop">See all 36</a></div>${productGrid(products.slice(0,8))}</section>`;
};

setTimeout(()=>{
  if((location.hash.slice(1)||'home')==='home' && typeof render==='function') render();
},0);
