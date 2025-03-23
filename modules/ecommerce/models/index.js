/**
 * Exportação centralizada de modelos do E-commerce Manager Core
 */

const Product = require('./Product');
const Category = require('./Category');
const Order = require('./Order');
const Customer = require('./Customer');
const Discount = require('./Discount');

module.exports = {
  Product,
  Category,
  Order,
  Customer,
  Discount
};