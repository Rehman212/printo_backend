const BASE = 'http://localhost:4000/api';

async function main() {
  const login = await fetch(`${BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rehmanwebs@gmail.com',
      password: '786786',
    }),
  }).then((r) => r.json());

  if (!login?.data?.accessToken) {
    console.error('Login failed', login);
    process.exit(1);
  }
  const token = login.data.accessToken;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const checkout = await fetch(`${BASE}/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      items: [
        {
          productSlug: 'custom-stickers',
          name: 'Custom Stickers',
          quantity: 1,
          unitPrice: 45.4,
        },
      ],
      subtotal: 45.4,
      shipping: 12.99,
      tax: 3.75,
      discount: 0,
      total: 62.14,
      shippingName: 'Rehman',
      shippingEmail: 'rehmanwebs@gmail.com',
      artworkFile: 'fiverr-auto-refresh-extension.zip',
    }),
  }).then((r) => r.json());

  console.log('checkout', JSON.stringify(checkout, null, 2));

  const list = await fetch(`${BASE}/admin/orders`, { headers }).then((r) =>
    r.json(),
  );
  console.log('admin orders count', list.data?.length);
  console.log('first', list.data?.[0]);

  const id = list.data?.[0]?.id;
  if (id) {
    const upd = await fetch(`${BASE}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'PRINTING' }),
    }).then((r) => r.json());
    console.log('status update', upd.data);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
