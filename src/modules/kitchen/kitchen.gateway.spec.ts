import { Test, TestingModule } from '@nestjs/testing';
import { KitchenGateway } from './kitchen.gateway';
import { KitchenService } from './kitchen.service';
import { Server, Socket } from 'socket.io';

describe('KitchenGateway', () => {
  let gateway: KitchenGateway;
  let kitchenService: KitchenService;
  let server: Server;

  const mockKitchenService = {
    getActiveKitchenOrders: jest.fn(),
    updateOrderItemStatus: jest.fn(),
    updateOrderStatus: jest.fn(),
  };

  const mockSocket = {
    data: { user: { companyId: 'company-1' } },
    emit: jest.fn(),
    join: jest.fn(),
    disconnect: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KitchenGateway,
        {
          provide: KitchenService,
          useValue: mockKitchenService,
        },
      ],
    }).compile();

    gateway = module.get<KitchenGateway>(KitchenGateway);
    kitchenService = module.get<KitchenService>(KitchenService);
    server = gateway.server = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should join company room and emit active orders', async () => {
      const activeOrders = [
        {
          id: 'order-1',
          orderNumber: '001',
          items: [],
          status: 'preparing',
          priority: 'medium' as const,
          estimatedTime: 15,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockKitchenService.getActiveKitchenOrders.mockResolvedValue(activeOrders);

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('company_company-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('kitchen_orders', activeOrders);
    });

    it('should disconnect if user not found', async () => {
      const socketWithoutUser = { ...mockSocket, data: {} };

      await gateway.handleConnection(socketWithoutUser);

      expect(socketWithoutUser.disconnect).toHaveBeenCalled();
    });
  });

  describe('notifyNewOrder', () => {
    it('should emit new order event to company room', async () => {
      const order = {
        id: 'order-1',
        orderNumber: '001',
        tableNumber: '1',
        customerName: 'John Doe',
        items: [],
        status: 'preparing',
        priority: 'medium' as const,
        estimatedTime: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await gateway.notifyNewOrder('company-1', order);

      expect(server.to).toHaveBeenCalledWith('company_company-1');
    });
  });

  describe('notifyOrderCancelled', () => {
    it('should emit order cancelled event', async () => {
      await gateway.notifyOrderCancelled('company-1', 'order-1');

      expect(server.to).toHaveBeenCalledWith('company_company-1');
    });
  });
});

