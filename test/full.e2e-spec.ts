import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createHmac } from 'crypto';

describe('Full E2E (REST + GraphQL)', () => {
  let app: INestApplication;
  let server: any;
  let mongo: MongoMemoryServer;

  const gql = async (query: string, variables?: any, token?: string) => {
    const res = await request(server)
      .post('/graphql')
      .set('Content-Type', 'application/json')
      .set('Authorization', token ? `Bearer ${token}` : '')
      .send({ query, variables });
    if (res.body.errors) {
      // Include GraphQL errors in thrown message for easier debug
      throw new Error(JSON.stringify(res.body.errors));
    }
    return res.body.data;
  };

  beforeAll(async () => {
    jest.setTimeout(60000);

    // Start in-memory Mongo and set env BEFORE module init
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGODB_URL = uri;
    process.env.JWT_ACCESS_SECRET = 'test_access_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    process.env.CF_API_VERSION = '2023-08-01';
    process.env.CF_BASE_URL = 'https://sandbox.cashfree.com';
    process.env.CF_WEBHOOK_SECRET = 'whsec_test';

    // Mock fetch for Cashfree network calls
    // @ts-expect-error override global for test
    global.fetch = jest.fn(async (url: string, init?: any) => {
      if (url.includes('/pg/orders/') && (!init || init.method === 'GET')) {
        return {
          ok: true,
          json: async () => ({ order_status: 'PAID' }),
        } as any;
      }
      if (url.endsWith('/pg/orders') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ order_id: 'CF_ORDER_123', payment_session_id: 'sess_456' }),
        } as any;
      }
      if (url.includes('/refunds') && init?.method === 'POST') {
        return { ok: true, json: async () => ({ status: 'SUCCESS' }) } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  it('REST: signup, login, refresh', async () => {
    // Signup restaurant user for admin operations
    const signupRes = await request(server)
      .post('/auth/signup')
      .send({ name: 'Admin Resto', email: 'resto@example.com', password: 'pass123', role: 'restaurant' })
      .expect(201);

    expect(signupRes.body.message).toBeDefined();

    // Login restaurant
    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email: 'resto@example.com', password: 'pass123' })
      .expect(201);

    expect(loginRes.body.tokens?.accessToken).toBeDefined();
    const adminAccess = loginRes.body.tokens.accessToken as string;
    const refreshToken = loginRes.body.tokens.refreshToken as string;

    // Refresh token
    const refreshRes = await request(server)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(refreshRes.body.accessToken || refreshRes.body.tokens?.accessToken).toBeDefined();

    // Signup normal user for placing orders
    await request(server)
      .post('/auth/signup')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'secret', role: 'user' })
      .expect(201);

    const userLogin = await request(server)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'secret' })
      .expect(201);

    expect(userLogin.body.tokens?.accessToken).toBeDefined();
  });

  it('GraphQL: admin menu mutations (protected) and public queries', async () => {
    // Login as restaurant to get token
    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email: 'resto@example.com', password: 'pass123' })
      .expect(201);
    const adminToken = loginRes.body.tokens.accessToken as string;

    // Add menu item
    const addRes = await gql(
      `mutation($input: CreateMenuItemInput!) { addMenuItem(input: $input) { id name price category isAvailable } }`,
      { input: { name: 'Pasta', price: 12.5, category: 'main', isAvailable: true } },
      adminToken,
    );
    expect(addRes.addMenuItem.id).toBeDefined();

    // Public query menuItems
    const menuQuery = await gql(
      `query { menuItems { id name price category isAvailable } }`
    );
    expect(Array.isArray(menuQuery.menuItems)).toBe(true);
    expect(menuQuery.menuItems.length).toBeGreaterThan(0);
  });

  it('GraphQL: order placement and history (protected)', async () => {
    // Login user
    const loginUser = await request(server)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'secret' })
      .expect(201);
    const userToken = loginUser.body.tokens.accessToken as string;

    // Get a menu item to order
    const { menuItems } = await gql(`query { menuItems { id name price } }`);
    const menuItemId = menuItems[0].id as string;

    // Create order
    const createOrder = await gql(
      `mutation($input: CreateOrderInput!) {
        createOrder(input: $input) { orderId userId totalAmount status deliveryAddress { street city state zipCode } }
      }`,
      {
        input: {
          items: [{ menuItemId, quantity: 2 }],
          deliveryAddress: { street: '1 St', city: 'Town', state: 'ST', zipCode: '12345' },
          notes: 'no onions'
        }
      },
      userToken,
    );

    expect(createOrder.createOrder.orderId).toBeDefined();
    const orderId = createOrder.createOrder.orderId as string;

    // User orders
    const uo = await gql(`query { userOrders { orderId status totalAmount } }`, undefined, userToken);
    expect(uo.userOrders.length).toBeGreaterThan(0);

    // Create payment for order (uses mocked fetch)
    const cpf = await gql(
      `mutation($input: CreatePaymentForOrderInput!) { createPaymentForOrder(input: $input) { orderId paymentSessionId } }`,
      { input: { orderId, customerPhone: '9999999999' } },
      userToken,
    );
    expect(cpf.createPaymentForOrder.orderId).toBe('CF_ORDER_123');

    // Confirm payment (pulls mocked PAID status)
    const cp = await gql(
      `mutation($orderId: String!) { confirmPayment(orderId: $orderId) { orderId } }`,
      { orderId },
      userToken,
    );
    expect(cp.confirmPayment.orderId).toBe(orderId);

    // Payment status query
    const ps = await gql(
      `query($orderId: String!) { paymentStatus(orderId: $orderId) }`,
      { orderId },
      userToken,
    );
    expect(typeof ps.paymentStatus).toBe('string');
  });

  it('REST: payments webhook updates paymentStatus', async () => {
    // Get user token & place order to get paymentIntentId first
    const loginUser = await request(server)
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'secret' })
      .expect(201);
    const userToken = loginUser.body.tokens.accessToken as string;

    const { menuItems } = await gql(`query { menuItems { id name } }`);
    const menuItemId = menuItems[0].id as string;

    const makeOrder = await gql(
      `mutation($input: CreateOrderInput!) { createOrder(input: $input) { orderId } }`,
      { input: { items: [{ menuItemId, quantity: 1 }], deliveryAddress: { street: '2 St', city: 'Town', state: 'ST', zipCode: '12345' } } },
      userToken,
    );
    const orderId = makeOrder.createOrder.orderId as string;

    // Create payment for order to set paymentIntentId
    await gql(
      `mutation($input: CreatePaymentForOrderInput!) { createPaymentForOrder(input: $input) { orderId } }`,
      { input: { orderId, customerPhone: '8888888888' } },
      userToken,
    );

    // Construct webhook payload
    const payload = JSON.stringify({ order_id: 'CF_ORDER_123', payment_status: 'SUCCESS' });
    const sig = createHmac('sha256', process.env.CF_WEBHOOK_SECRET as string)
      .update(payload, 'utf8')
      .digest('base64');

    await request(server)
      .post('/payments/webhook')
      .set('x-webhook-signature', sig)
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200);
  });

  it('GraphQL: admin orders queries and stats (protected)', async () => {
    // Login as restaurant
    const loginRes = await request(server)
      .post('/auth/login')
      .send({ email: 'resto@example.com', password: 'pass123' })
      .expect(201);
    const adminToken = loginRes.body.tokens.accessToken as string;

    const all = await gql(`query { allOrders { orderId status } }`, undefined, adminToken);
    expect(Array.isArray(all.allOrders)).toBe(true);

    const byStatus = await gql(
      `query { ordersByStatus(status: "placed") { orderId status } }`,
      undefined,
      adminToken,
    );
    expect(Array.isArray(byStatus.ordersByStatus)).toBe(true);

    const stats = await gql(`query { orderStats { total placed confirmed delivered } }`, undefined, adminToken);
    expect(stats.orderStats.total).toBeGreaterThan(0);
  });
});