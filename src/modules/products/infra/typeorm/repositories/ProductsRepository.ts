import { getRepository, Repository } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsFind = await this.ormRepository.findByIds(products);

    return productsFind;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsReturn: Product[] = [];

    const findProducts: IFindProducts[] = [];

    products.map(product => findProducts.push({ id: product.id }));

    const productsFind = await this.findAllById(findProducts);

    const productsQuantity: Product[] = [];

    productsFind.forEach(productFor => {
      const quantity = products.find(p => p.id === productFor.id);

      if (!quantity) {
        throw new AppError('Insuficient quantity of products');
      }

      productsQuantity.push({
        ...productFor,
        quantity: quantity.quantity,
      });
    });

    await this.ormRepository.save(productsQuantity);

    return productsReturn;
  }
}

export default ProductsRepository;
