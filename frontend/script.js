const API_BASE_URL = 'http://54.211.188.243:2222';
async function loadMenu() {
  const menuList = document.getElementById('menu-list');
  if (!menuList) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/menu`);
    const items = await response.json();

    menuList.innerHTML = items.map((item) => `
      <article class="menu-card">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="price">$${Number(item.price).toFixed(2)}</div>
      </article>
    `).join('');
  } catch (error) {
    menuList.innerHTML = '<p>Unable to load menu right now.</p>';
  }
}

const form = document.getElementById('order-form');
const message = document.getElementById('order-message');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const payload = {
      customerName: data.get('customerName'),
      itemName: data.get('itemName')
    };

      try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      message.textContent = result.message || 'Order received.';
      form.reset();
    } catch (error) {
      message.textContent = 'Something went wrong. Please try again.';
    }
  });
}

loadMenu();
