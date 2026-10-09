const { CartItem, Cart, round2 } = require('./cart');

describe('CartItem', () => {
  describe('Валідація при створенні CartItem', () => {
    test('успішно створює CartItem з валідними даними', () => {
      const item = new CartItem('SKU123', 'Phone', 100, 2);
      expect(item.sku).toBe('SKU123');
      expect(item.name).toBe('Phone');
      expect(item.unitPrice).toBe(100);
      expect(item.qty).toBe(2);
      expect(item.lineTotal).toBe(200);
    });

    test('встановлює qty = 1 за замовчуванням', () => {
      const item = new CartItem('SKU123', 'Phone', 100);
      expect(item.qty).toBe(1);
    });

    test('викидає помилку, якщо SKU відсутній або не є стрічкою', () => {
      expect(() => new CartItem('', 'Phone', 100)).toThrow('SKU is required');
      expect(() => new CartItem(null, 'Phone', 100)).toThrow('SKU is required');
      expect(() => new CartItem(123, 'Phone', 100)).toThrow('SKU is required');
    });

    test('викидає помилку, якщо Name відсутній або не є стрічкою', () => {
      expect(() => new CartItem('SKU123', '', 100)).toThrow('Name is required');
      expect(() => new CartItem('SKU123', null, 100)).toThrow(
        'Name is required',
      );
      expect(() => new CartItem('SKU123', 123, 100)).toThrow(
        'Name is required',
      );
    });

    test('викидає помилку, якщо unitPrice <= 0 або не є числом', () => {
      expect(() => new CartItem('SKU123', 'Phone', 0)).toThrow(
        'unitPrice must be > 0',
      );
      expect(() => new CartItem('SKU123', 'Phone', -10)).toThrow(
        'unitPrice must be > 0',
      );
      expect(() => new CartItem('SKU123', 'Phone', '100')).toThrow(
        'unitPrice must be > 0',
      );
    });

    test('викидає помилку, якщо qty <= 0 або не є цілим числом', () => {
      expect(() => new CartItem('SKU123', 'Phone', 100, 0)).toThrow(
        'qty must be positive integer',
      );
      expect(() => new CartItem('SKU123', 'Phone', 100, -2)).toThrow(
        'qty must be positive integer',
      );
      expect(() => new CartItem('SKU123', 'Phone', 100, 2.5)).toThrow(
        'qty must be positive integer',
      );
      expect(() => new CartItem('SKU123', 'Phone', 100, '1')).toThrow(
        'qty must be positive integer',
      );
    });
  });
});

describe('Cart', () => {
  let cart;

  beforeEach(() => {
    cart = new Cart();
  });

  describe('Операції з кошиком та Валідація', () => {
    test('додає новий CartItem до кошика', () => {
      const item = new CartItem('SKU1', 'Apple', 10, 2);
      cart.addItem(item);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toBe(item);
    });

    test('викидає помилку при спробі додати не-CartItem', () => {
      expect(() =>
        cart.addItem({ sku: 'SKU1', name: 'Apple', unitPrice: 10, qty: 1 }),
      ).toThrow('item must be CartItem');
      expect(() => cart.addItem('not an item')).toThrow(
        'item must be CartItem',
      );
      expect(() => cart.addItem(null)).toThrow('item must be CartItem');
    });

    test('додає той самий SKU → мерджить кількість (qty)', () => {
      const item1 = new CartItem('SKU1', 'Apple', 10, 2);
      const item2 = new CartItem('SKU1', 'Apple', 10, 3);

      cart.addItem(item1);
      cart.addItem(item2);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].qty).toBe(5);
    });

    test('оновлює кількість товару за SKU', () => {
      const item = new CartItem('SKU1', 'Apple', 10, 2);
      cart.addItem(item);

      cart.updateQty('SKU1', 10);
      expect(cart.items[0].qty).toBe(10);
    });

    test('викидає помилку при оновленні кількості невалідними значеннями', () => {
      const item = new CartItem('SKU1', 'Apple', 10, 2);
      cart.addItem(item);

      expect(() => cart.updateQty('SKU1', 0)).toThrow(
        'newQty must be positive integer',
      );
      expect(() => cart.updateQty('SKU1', -5)).toThrow(
        'newQty must be positive integer',
      );
      expect(() => cart.updateQty('SKU1', 1.5)).toThrow(
        'newQty must be positive integer',
      );
      expect(() => cart.updateQty('SKU1', '5')).toThrow(
        'newQty must be positive integer',
      );
    });

    test('викидає помилку при оновленні кількості для неіснуючого SKU', () => {
      expect(() => cart.updateQty('NON_EXISTENT', 5)).toThrow('Item not found');
    });

    test('видаляє товар з кошика за SKU', () => {
      const item1 = new CartItem('SKU1', 'Apple', 10, 1);
      const item2 = new CartItem('SKU2', 'Banana', 20, 1);
      cart.addItem(item1);
      cart.addItem(item2);

      cart.removeItem('SKU1');

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].sku).toBe('SKU2');
    });

    test('викидає помилку при видаленні неіснуючого SKU', () => {
      expect(() => cart.removeItem('NON_EXISTENT')).toThrow('Item not found');
    });
  });

  describe('Розрахунки', () => {
    test('порожній кошик → getSubtotal() повертає 0', () => {
      expect(cart.getSubtotal()).toBe(0);
    });

    test('розраховує getSubtotal() для кількох товарів', () => {
      cart.addItem(new CartItem('SKU1', 'Item 1', 10.5, 2)); // 21
      cart.addItem(new CartItem('SKU2', 'Item 2', 5, 3)); // 15

      expect(cart.getSubtotal()).toBe(36);
    });
  });

  describe('Промокоди', () => {
    test('застосовує валідний промокод (з урахуванням регістру та пробілів)', () => {
      cart.addItem(new CartItem('SKU1', 'Item 1', 100, 1));
      cart.applyPromo(' sale10 ');

      expect(cart.appliedPromo).toEqual({ code: 'SALE10', percent: 10 });
      expect(cart.getTotal()).toBe(90);
    });

    test('викидає помилку при застосуванні невалідного промокоду', () => {
      expect(() => cart.applyPromo('INVALID_CODE')).toThrow(
        'Invalid promo code',
      );
      expect(() => cart.applyPromo('')).toThrow(
        'Promo code must be non-empty string',
      );
      expect(() => cart.applyPromo(123)).toThrow(
        'Promo code must be non-empty string',
      );
    });

    test('обробляє 100% знижку → getTotal() повертає 0', () => {
      cart.addItem(new CartItem('SKU1', 'Item 1', 100, 1));
      cart.applyPromo('FREE100');

      expect(cart.getTotal()).toBe(0);
    });

    test('викидає помилку для промокоду з некоректною конфігурацією (>100% або <0%)', () => {
      const customCart = new Cart({
        promoCodes: {
          SUPER_DISCOUNT: 150,
          NEGATIVE_DISCOUNT: -10,
        },
      });

      expect(() => customCart.applyPromo('SUPER_DISCOUNT')).toThrow(
        'Configured promo is out of range 0..100',
      );
      expect(() => customCart.applyPromo('NEGATIVE_DISCOUNT')).toThrow(
        'Configured promo is out of range 0..100',
      );
    });
  });

  describe('Округлення та суми', () => {
    test('округлює getTotal() до 2 знаків після коми', () => {
      // 10.33 * 3 = 30.99
      cart.addItem(new CartItem('SKU1', 'Item 1', 10.33, 3));
      cart.applyPromo('SPRING5'); // 5% discount: 30.99 * 0.95 = 29.4405 → 29.44

      expect(cart.getTotal()).toBe(29.44);
    });

    test('перевіряє роботу функції round2 окремо', () => {
      expect(round2(10.555)).toBe(10.56);
      expect(round2(10.554)).toBe(10.55);
      expect(round2(10)).toBe(10);
    });
  });
});
