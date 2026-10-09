class CartItem {
  constructor(sku, name, unitPrice, qty = 1) {
    if (!sku || typeof sku !== 'string') {
      throw new Error('SKU is required');
    }
    if (!name || typeof name !== 'string') {
      throw new Error('Name is required');
    }
    if (typeof unitPrice !== 'number' || unitPrice <= 0) {
      throw new Error('unitPrice must be > 0');
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error('qty must be positive integer');
    }

    this.sku = sku;
    this.name = name;
    this.unitPrice = unitPrice;
    this.qty = qty;
  }

  get lineTotal() {
    return this.unitPrice * this.qty;
  }
}

class Cart {
  constructor(pricing = {}) {
    // pricing.promoCodes = { CODE: percent }
    this.items = [];
    this.pricing = {
      promoCodes: {
        SALE10: 10,
        FREE100: 100,
        SPRING5: 5,
        ...(pricing.promoCodes || {})
      }
    };
    this.appliedPromo = null;
  }

  addItem(item) {
    if (!(item instanceof CartItem)) {
      throw new Error('item must be CartItem');
    }
    const existing = this.items.find((it) => it.sku === item.sku);
    if (existing) {
      existing.qty += item.qty;
    } else {
      this.items.push(item);
    }
  }

  updateQty(sku, newQty) {
    if (!Number.isInteger(newQty) || newQty <= 0) {
      throw new Error('newQty must be positive integer');
    }
    const item = this.items.find((it) => it.sku === sku);
    if (!item) {
      throw new Error('Item not found');
    }
    item.qty = newQty;
  }

  removeItem(sku) {
    const idx = this.items.findIndex((it) => it.sku === sku);
    if (idx === -1) {
      throw new Error('Item not found');
    }
    this.items.splice(idx, 1);
  }

  getSubtotal() {
    return this.items.reduce((sum, it) => sum + it.lineTotal, 0);
  }

  applyPromo(code) {
    if (!code || typeof code !== 'string') {
      throw new Error('Promo code must be non-empty string');
    }
    const upper = code.trim().toUpperCase();
    const percent = this.pricing.promoCodes[upper];
    if (percent == null) {
      // невалідний промокод — на розсуд: або кидати, або ігнорувати
      // зробимо: кидати, щоб це потестувати
      throw new Error('Invalid promo code');
    }
    if (percent < 0 || percent > 100) {
      throw new Error('Configured promo is out of range 0..100');
    }
    this.appliedPromo = {
      code: upper,
      percent
    };
  }

  getTotal() {
    const subtotal = this.getSubtotal();
    if (!this.appliedPromo) {
      return round2(subtotal);
    }
    const discount = subtotal * (this.appliedPromo.percent / 100);
    const final = subtotal - discount;
    return round2(final < 0 ? 0 : final);
  }
}

function round2(num) {
  return Math.round(num * 100) / 100;
}

module.exports = {
  CartItem,
  Cart,
  round2
};

