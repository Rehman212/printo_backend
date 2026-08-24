UPDATE "products"
SET
  "description" = $desc$
<ul>
<li>3 label formats to choose from: singles, roll, sheet</li>
<li>Available in custom shape &amp; 8 standard shapes</li>
<li>A variety of paper &amp; waterproof materials available</li>
<li>Multiple sizes for return addresses, mailing labels, and packaging</li>
<li>Printing turnaround as fast as 1 business day</li>
</ul>
<h2>Save Time with Personalized Return Address Labels</h2>
<p>Skip the hassle of handwriting a mountain of letters. Custom return address labels allow you to quickly peel and stick your address onto packages, invitations, and everyday correspondence. Whether you are sending out hundreds of corporate mailers or addressing annual holiday cards, personalized return address stickers add a polished finishing touch while saving you hours of manual work.</p>
<h3>Professional Custom Mailing Labels for Business</h3>
<p>Establish your brand's authority from the moment your package arrives. Print your company name, return address, and logo on high-quality paper or waterproof BOPP materials.</p>
<h3>Elegant Address Stickers for Weddings &amp; Holidays</h3>
<p>Return address labels aren't just for business—they are an essential part of personal stationery. Coordinate your labels with your event's theme by uploading your own elegant, minimalist, rustic, botanical, or monogrammed address labels. They are perfect for:</p>
<ul>
<li>Wedding invitations and Save-the-Dates</li>
<li>Holiday and Christmas cards</li>
<li>Graduation announcements</li>
<li>Baby shower invitations and Thank You notes</li>
<li>Everyday bill-paying and correspondence</li>
</ul>
<h2>Choose the Right Return Address Label Format</h2>
<p>We offer three distinct formats to suit your order volume and application method.</p>
<h3>Roll Labels for Bulk Mailing</h3>
<p>Roll labels are ideal for fast, high-volume application. Available in quantities of 250 or more, these labels are wound on a standard core and can be applied quickly by hand or with a label gun.</p>
<h3>Sheet Labels for Personal Stationery</h3>
<p>Sheet labels print a specific quantity of labels onto a single page. This format is highly recommended for smaller, personal mailing batches.</p>
<h3>Cut-to-Size Singles for Custom Applications</h3>
<p>Ordered in quantities below 250 pieces, cut-to-size singles are delivered as individually cut labels. These are printed quickly—ready to ship in as little as 1 business day—and are ideal for small, highly customized mailings.</p>
$desc$,
  "shortDescription" = '3 label formats to choose from: singles, roll, sheet. Custom shape and 8 standard shapes, paper and waterproof materials, as fast as 1 business day.',
  "imageUrl" = 'https://staticecp.uprinting.com/6955/700x700/CTS_Shapes_without_lollipop.jpg',
  "pricingSourceUrl" = 'https://www.uprinting.com/return-address-label-printing.html',
  "faqs" = $faqs$[
    {"question":"What is the best sticker format for return address labels?","answer":"If you are sending a small batch of personal mail, sheet labels or cut-to-size singles are the most cost-effective and convenient. If you are a business or sending bulk event invitations (250+ pieces), roll labels are the best choice as they can be rapidly applied with a label gun."},
    {"question":"Do you offer waterproof materials for custom address labels?","answer":"Yes. You can print on waterproof BOPP for your address labels. For orders of 250 and above, the material remains waterproof in both hot and cold water. For smaller quantities (starting at 25 pieces), the label is waterproof in cold or tap water but may peel if submerged in hot water."},
    {"question":"Can I use return address labels as envelope seals?","answer":"Yes. Many customers order circle, oval, or starburst-shaped return address labels and apply them directly over the back flap of the envelope."},
    {"question":"Can I print die-cut or irregularly shaped roll labels?","answer":"Yes. After selecting the Roll format, choose Custom under the shape options, then set width and height. Include a dieline in your artwork file."},
    {"question":"Can I upload my own design file to print address labels?","answer":"Yes. Upload JPG, PNG, TIF, AI, or PUB files. For best quality, submit CMYK artwork at 300dpi with a .125\" bleed on each side."}
  ]$faqs$::jsonb,
  "galleryUrls" = (
    ARRAY['https://staticecp.uprinting.com/6955/700x700/CTS_Shapes_without_lollipop.jpg']::text[]
    || ARRAY(
      SELECT url
      FROM unnest("galleryUrls") AS url
      WHERE url <> 'https://staticecp.uprinting.com/6955/700x700/CTS_Shapes_without_lollipop.jpg'
    )
  )
WHERE slug = 'address-labels-return-address-labels';

UPDATE "product_option_groups" AS groups
SET "sortOrder" = ordering.pos
FROM (
  VALUES
    ('attr0', 0),
    ('attr10', 1),
    ('attr3', 2),
    ('attr765', 3),
    ('attr1', 4),
    ('attr25', 5),
    ('attr1335', 6),
    ('attr17', 7),
    ('attr948', 8),
    ('attr400', 9),
    ('attr5', 10),
    ('attr27', 11),
    ('attr853', 12),
    ('attr6', 13)
) AS ordering(key, pos)
JOIN "products" AS products ON products.slug = 'address-labels-return-address-labels'
WHERE groups."productId" = products.id
  AND groups.key = ordering.key;
