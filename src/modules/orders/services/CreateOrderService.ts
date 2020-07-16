import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IFindProducts {
  id: string;
}

interface IProductOrder {
  product_id: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const findProducts: IFindProducts[] = [];

    products.map(product => findProducts.push({ id: product.id }));

    const productsFind = await this.productsRepository.findAllById(
      findProducts,
    );

    if (productsFind.length !== products.length) {
      throw new AppError('Product not found');
    }

    const productsOrder: IProductOrder[] = [];
    const productsQuantity: IUpdateProductsQuantityDTO[] = [];

    productsFind.forEach(productFor => {
      const quantity = products.find(p => p.id === productFor.id);

      if (!quantity) {
        throw new AppError('Insuficient quantity of products');
      }

      if (quantity.quantity > productFor.quantity) {
        throw new AppError('Insuficient quantity of products');
      }

      productsOrder.push({
        product_id: productFor.id,
        price: productFor.price,
        quantity: quantity.quantity,
      });

      productsQuantity.push({
        id: productFor.id,
        quantity: productFor.quantity - quantity.quantity,
      });
    });

    const createOrder: ICreateOrderDTO = {
      customer,
      products: productsOrder,
    };

    const order = await this.ordersRepository.create(createOrder);

    await this.productsRepository.updateQuantity(productsQuantity);

    return order;
  }
}

export default CreateOrderService;
