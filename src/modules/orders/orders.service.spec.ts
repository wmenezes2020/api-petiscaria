import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment } from '../../entities/payment.entity';
import { Recipe } from '../../entities/recipe.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { KitchenGateway } from '../kitchen/kitchen.gateway';
import { CreateOrderDto, OrderStatus, OrderChannel } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;
  let paymentRepository: Repository<Payment>;
  let recipeRepository: Repository<Recipe>;
  let ingredientRepository: Repository<Ingredient>;
  let kitchenGateway: KitchenGateway;

  const mockOrder: Order = {
    id: '1',
    status: OrderStatus.OPEN,
    channel: OrderChannel.TABLE,
    notes: 'Test order',
    subtotal: 50,
    discount: 5,
    tax: 10,
    total: 55,
    numberOfPeople: 2,
    estimatedReadyTime: new Date(),
    readyTime: null,
    deliveredTime: null,
    closedTime: null,
    cancelledTime: null,
    cancellationReason: null,
    metadata: null,
    companyId: 'company-1',
    tableId: 'table-1',
    customerId: 'customer-1',
    createdBy: 'user-1',
    closedBy: null,
    cancelledBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItems: [],
    createdByUser: null,
    canBeModified: jest.fn(() => true),
    canBeCancelled: jest.fn(() => true),
  } as any;

  const mockOrderItem: OrderItem = {
    id: '1',
    productId: 'product-1',
    productName: 'Test Product',
    productDescription: 'Test Description',
    unitPrice: 25,
    quantity: 2,
    discount: 0,
    tax: 5,
    totalPrice: 55,
    notes: null,
    specialInstructions: null,
    isReady: false,
    readyTime: null,
    deliveredTime: null,
    preparationTime: 15,
    modifications: null,
    metadata: null,
    orderId: '1',
    companyId: 'company-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    sentToKitchenAt: null,
  } as any;

  const mockRepositories = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Recipe),
          useValue: mockRepositories,
        },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: mockRepositories,
        },
        {
          provide: KitchenGateway,
          useValue: {
            notifyNewOrder: jest.fn(),
            notifyOrderUpdate: jest.fn(),
            notifyOrderCancelled: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = module.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    recipeRepository = module.get<Repository<Recipe>>(getRepositoryToken(Recipe));
    ingredientRepository = module.get<Repository<Ingredient>>(getRepositoryToken(Ingredient));
    kitchenGateway = module.get<KitchenGateway>(KitchenGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const createOrderDto: CreateOrderDto = {
      channel: OrderChannel.TABLE,
      orderItems: [
        {
          productId: 'product-1',
          productName: 'Test Product',
          unitPrice: 25,
          quantity: 2,
          modifications: [],
        },
      ],
      discount: 0,
      tax: 5,
      numberOfPeople: 2,
      tableId: 'table-1',
      customerId: 'customer-1',
      notes: 'Test order',
    };

    it('should create an order successfully', async () => {
      // Mock repositories
      mockRepositories.findOne.mockResolvedValueOnce(null); // Recipe não existe
      mockRepositories.save.mockResolvedValueOnce(mockOrder);
      mockRepositories.create.mockReturnValue(mockOrder);

      // Mock findOne para buscar o pedido criado
      mockRepositories.findOne.mockResolvedValueOnce({
        ...mockOrder,
        orderItems: [mockOrderItem],
        createdByUser: { id: 'user-1', name: 'Test User' },
      });

      const result = await service.createOrder(createOrderDto, 'user-1', 'company-1');

      expect(result).toBeDefined();
      expect(mockRepositories.save).toHaveBeenCalled();
      expect(kitchenGateway.notifyNewOrder).toHaveBeenCalled();
    });

    it('should throw error if order not found', async () => {
      mockRepositories.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', 'company-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return an order', async () => {
      mockRepositories.findOne.mockResolvedValue({
        ...mockOrder,
        orderItems: [mockOrderItem],
      });

      const result = await service.findOne('1', 'company-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if order not found', async () => {
      mockRepositories.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', 'company-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOrder', () => {
    const updateOrderDto: UpdateOrderDto = {
      status: OrderStatus.CLOSED,
    };

    it('should update order status', async () => {
      mockRepositories.findOne.mockResolvedValue(mockOrder);
      mockRepositories.find.mockResolvedValue([
        { id: 'payment-1', amount: 55, orderId: '1' },
      ]);
      mockRepositories.update.mockResolvedValue(undefined);

      await service.updateOrder('1', updateOrderDto, 'user-1', 'company-1');

      expect(mockRepositories.update).toHaveBeenCalled();
    });

    it('should throw error if order cannot be modified', async () => {
      const lockedOrder = { ...mockOrder, canBeModified: () => false };
      mockRepositories.findOne.mockResolvedValue(lockedOrder);

      await expect(
        service.updateOrder('1', updateOrderDto, 'user-1', 'company-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if closing order without payment', async () => {
      const orderWithoutPayment = { ...mockOrder, total: 100 };
      mockRepositories.findOne.mockResolvedValue(orderWithoutPayment);
      mockRepositories.find.mockResolvedValue([
        { id: 'payment-1', amount: 50, orderId: '1' },
      ]);

      await expect(
        service.updateOrder('1', { status: OrderStatus.CLOSED }, 'user-1', 'company-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteOrder', () => {
    it('should soft delete an order', async () => {
      mockRepositories.findOne.mockResolvedValue(mockOrder);
      mockRepositories.update.mockResolvedValue(undefined);

      await service.deleteOrder('1', 'company-1');

      expect(mockRepositories.update).toHaveBeenCalledWith('1', {
        status: OrderStatus.CANCELLED,
        cancelledTime: expect.any(Date),
      });
    });

    it('should throw error if order cannot be cancelled', async () => {
      const lockedOrder = { ...mockOrder, canBeCancelled: () => false };
      mockRepositories.findOne.mockResolvedValue(lockedOrder);

      await expect(
        service.deleteOrder('1', 'company-1')
      ).rejects.toThrow(BadRequestException);
    });
  });
});

