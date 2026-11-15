# EU Label Kit

Self-serve document generator for sellers outside the EU. Fill one form, print four documents: GPSR product label, EU responsible person mandate, declaration of conformity, listing compliance block. Batch mode turns a CSV of SKUs into a print-ready label sheet. One-time $9 licence, no account, no calls.

## Why somebody pays

Since 13 December 2024 the General Product Safety Regulation applies to every consumer product sold in the EU, including distance sales. Marketplaces check three things: a named EU responsible person, traceability on the product, warnings in the local language. Sellers outside the EU do not have the first one and do not know the format of the other two. The pain is per-listing and searchable.

## Files

    index.html         landing, form, batch panel, print pack skeleton
    styles.css         screen styles plus the @media print page rules
    app.js             requirement engine, CSV parser, label and document renderers, licence gate
    tools/keygen.mjs   prints licence keys in the accepted format

Four files, no build step, no dependency, no server.

## Price: $9 on purpose

$9 is a demand test, not a valuation. At this price the question is only whether strangers buy without a conversation. If 300 visitors produce no sale, the problem is the offer, not the traffic. When the first 20 sales exist, raise to $29 and add a $199 catalogue plan (see roadmap).

## Go live in 30 seconds

Live now at https://shiyangh76-max.github.io/eu-label-kit/ (GitHub Pages, main branch, root).
The repo is public, so the source is readable. That is a deliberate trade-off for the demand test: the paywall is client side and could be bypassed anyway. If the product sells, move it to a private host (Cloudflare Pages with a private repo) and rotate the licence check.

## Take money (Lemon Squeezy, 15 minutes)

1. Store at lemonsqueezy.com, product "EU Label Kit", one-time $9.
2. Product settings, enable **License keys**, activation limit 1.
3. Copy the checkout URL and the product ID.
4. Paste into `CONFIG` at the top of `app.js`:

       var CONFIG = {
         buyUrl: 'https://YOURSTORE.lemonsqueezy.com/checkout/buy/UUID',
         validateUrl: 'https://api.lemonsqueezy.com/v1/licenses/validate',
         productId: '123456',
         price: '$9'
       };

5. Redeploy. The Activate field then validates real keys against the Lemon Squeezy API; buyers get the key by email in seconds.

Lemon Squeezy is merchant of record and remits EU VAT. Buyers are EU sellers and will expect a VAT invoice.

Fallback without a payment provider: `node tools/keygen.mjs 20 > keys.txt`, hand one key per sale. That check is a checksum, friction not security.

## Batch mode

Switch to Batch in the header. CSV columns:

    product,brand,model,batch,quantity
    Ceramic mug 350 ml,Northline,NL-MUG-350,2026-11-A,8
    Linen tote bag,Northline,NL-TOTE-01,2026-11-B,12

Quantity is optional and defaults to 1, capped at 50 per row and 600 labels per run. Quoted fields with commas work. The pack prints 8 labels per A4 page at 70 × 50 mm, then a manifest page with the SKU table and the listing block. The manufacturer and responsible person block is shared across the batch, which is how a real seller works.

## Editing the rules

In `app.js`: `MARKETS` (country, warning language, EPR registers), `requirements()` (the cards, each with the article and an EUR-Lex or register link), `CATS` (which categories are CE marked). The "rules reviewed" chip is a literal string in `index.html`. Update it whenever you edit content. Freshness is the product.

## Deliberately missing

No transmission to Peppol or a national platform (needs accreditation). No registration on the buyer's behalf. No legal opinion: every card links to the regulation, the footer says templates only.

## Roadmap

1. Start now: $9, one product, one audience.
2. At 20 sales: raise to $29, keep the old price for the first buyers as a thank-you note.
3. At 100 sales: catalogue plan at $199 (batch plus per-country label variants and recycled-content statements).
4. Then a paid rules-update subscription. Renewal is the business; the one-time price is the filter.
