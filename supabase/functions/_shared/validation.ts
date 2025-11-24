/**
 * Input validation utilities for Edge Functions
 * Using simple validation without external dependencies
 */

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidatorError extends Error {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super("Validation failed");
    this.errors = errors;
    this.name = "ValidatorError";
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Basic phone validation (at least 10 digits)
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

export const validatePositiveNumber = (value: any): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

export const validateOrderData = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!validateRequired(data.customer_name)) {
    errors.push({ field: 'customer_name', message: 'Customer name is required' });
  }

  if (!validateRequired(data.customer_email)) {
    errors.push({ field: 'customer_email', message: 'Customer email is required' });
  } else if (!validateEmail(data.customer_email)) {
    errors.push({ field: 'customer_email', message: 'Invalid email format' });
  }

  if (!validateRequired(data.customer_phone)) {
    errors.push({ field: 'customer_phone', message: 'Customer phone is required' });
  } else if (!validatePhone(data.customer_phone)) {
    errors.push({ field: 'customer_phone', message: 'Invalid phone number format' });
  }

  if (!validateRequired(data.delivery_address)) {
    errors.push({ field: 'delivery_address', message: 'Delivery address is required' });
  }

  if (!validateRequired(data.delivery_method)) {
    errors.push({ field: 'delivery_method', message: 'Delivery method is required' });
  }

  if (!validatePositiveNumber(data.total_amount)) {
    errors.push({ field: 'total_amount', message: 'Total amount must be a positive number' });
  }

  if (!validatePositiveNumber(data.delivery_price)) {
    errors.push({ field: 'delivery_price', message: 'Delivery price must be a positive number' });
  }

  return errors;
};

export const validateOrderItems = (items: any[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!Array.isArray(items)) {
    errors.push({ field: 'items', message: 'Items must be an array' });
    return errors;
  }

  if (items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required' });
    return errors;
  }

  items.forEach((item, index) => {
    if (!validateRequired(item.product_id)) {
      errors.push({ field: `items[${index}].product_id`, message: 'Product ID is required' });
    }

    if (!validateRequired(item.product_name)) {
      errors.push({ field: `items[${index}].product_name`, message: 'Product name is required' });
    }

    if (!validatePositiveNumber(item.price)) {
      errors.push({ field: `items[${index}].price`, message: 'Price must be a positive number' });
    }

    if (!validatePositiveNumber(item.quantity)) {
      errors.push({ field: `items[${index}].quantity`, message: 'Quantity must be a positive number' });
    }
  });

  return errors;
};
