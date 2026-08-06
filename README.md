# Orbit Plush Ecommerce Store

A responsive ecommerce storefront for Eden Toy Co.'s 36 Orbit plush bag charms.

Included:
- Crystal, Manifestation and Zodiac collection landing pages
- 36 individual product records
- 36 cropped product images derived from the supplied collection boards
- Product-detail views
- Collection filtering
- Persistent browser cart
- Mobile-responsive presentation
- NZD prototype pricing

## Run locally

Because the store loads `products.json`, serve it through a local web server rather than opening `index.html` directly.

Python:
```bash
python -m http.server 8080
```

Then open:
`http://localhost:8080`

## Production gates

Before taking live orders:
1. Confirm legal brand name, domain, contact information and policies.
2. Replace prototype NZD $29.99 pricing.
3. Add stock/SKU values and product dimensions.
4. Configure shipping zones and rates.
5. Connect a payment provider.
6. Add order persistence and customer email receipts.
7. Replace cropped catalogue-board images with final individual product photography when samples exist.
