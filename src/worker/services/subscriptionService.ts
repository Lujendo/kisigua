import { 
  UserSubscription, 
  SubscriptionPlan, 
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  SUBSCRIPTION_PLANS,
  getPlanById 
} from '../types/subscription';

export class SubscriptionService {
  private subscriptions: Map<string, UserSubscription> = new Map();
  private stripeSecretKey: string;

  constructor(stripeSecretKey: string) {
    this.stripeSecretKey = stripeSecretKey;
    this.initializeSampleData();

    // Note: stripeSecretKey would be used for actual Stripe API calls
    // For now it's stored but not used in the demo implementation
  }

  private initializeSampleData() {
    // Create sample subscriptions for test users
    const sampleSubscriptions: UserSubscription[] = [
      {
        id: 'sub-001',
        userId: 'premium-001',
        planId: 'premium',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancelAtPeriodEnd: false,
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date('2024-01-15').toISOString(),
      },
      {
        id: 'sub-002',
        userId: 'supporter-001',
        planId: 'supporter',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancelAtPeriodEnd: false,
        createdAt: new Date('2024-01-20').toISOString(),
        updatedAt: new Date('2024-01-20').toISOString(),
      }
    ];

    sampleSubscriptions.forEach(subscription => {
      this.subscriptions.set(subscription.userId, subscription);
    });
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    return this.subscriptions.get(userId) || null;
  }

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return SUBSCRIPTION_PLANS;
  }

  async createCheckoutSession(userId: string, request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    // In a real implementation, this would create a Stripe checkout session
    // For now, we'll simulate the process

    const plan = getPlanById(request.planId);
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    if (plan.tier === 'free') {
      throw new Error('Cannot create checkout session for free plan');
    }

    // Simulate Stripe checkout session creation
    const sessionId = `cs_${Date.now()}_${userId}`;
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;

    // In a real implementation, you would use this.stripeSecretKey to:
    // 1. Create a Stripe customer if one doesn't exist
    // 2. Create a checkout session with Stripe
    // 3. Return the actual session ID and URL
    console.log(`Using Stripe secret key: ${this.stripeSecretKey.substring(0, 7)}...`);

    return {
      sessionId,
      url: checkoutUrl
    };
  }

  async createSubscription(userId: string, planId: string, stripeSubscriptionId?: string, stripeCustomerId?: string): Promise<UserSubscription> {
    const plan = getPlanById(planId);
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    const subscriptionId = `sub-${Date.now()}`;
    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

    const subscription: UserSubscription = {
      id: subscriptionId,
      userId,
      planId,
      stripeSubscriptionId,
      stripeCustomerId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };

    this.subscriptions.set(userId, subscription);
    return subscription;
  }

  async updateSubscription(userId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | null> {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) {
      return null;
    }

    const updatedSubscription: UserSubscription = {
      ...subscription,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.subscriptions.set(userId, updatedSubscription);
    return updatedSubscription;
  }

  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<UserSubscription | null> {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) {
      return null;
    }

    // In a real implementation, you would cancel the Stripe subscription
    const updatedSubscription: UserSubscription = {
      ...subscription,
      cancelAtPeriodEnd,
      status: cancelAtPeriodEnd ? subscription.status : 'canceled',
      updatedAt: new Date().toISOString(),
    };

    this.subscriptions.set(userId, updatedSubscription);
    return updatedSubscription;
  }

  async reactivateSubscription(userId: string): Promise<UserSubscription | null> {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) {
      return null;
    }

    // In a real implementation, you would reactivate the Stripe subscription
    const updatedSubscription: UserSubscription = {
      ...subscription,
      cancelAtPeriodEnd: false,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };

    this.subscriptions.set(userId, updatedSubscription);
    return updatedSubscription;
  }

  async handleWebhook(event: any): Promise<void> {
    // In a real implementation, this would handle Stripe webhook events
    // such as subscription updates, payment failures, etc.
    
    switch (event.type) {
      case 'customer.subscription.updated':
        // Handle subscription updates
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellations
        break;
      case 'invoice.payment_succeeded':
        // Handle successful payments
        break;
      case 'invoice.payment_failed':
        // Handle failed payments
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  async getSubscriptionStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    premiumSubscriptions: number;
    supporterSubscriptions: number;
    monthlyRevenue: number;
  }> {
    const allSubscriptions = Array.from(this.subscriptions.values());
    const activeSubscriptions = allSubscriptions.filter(sub => sub.status === 'active');
    
    const premiumSubscriptions = activeSubscriptions.filter(sub => sub.planId === 'premium').length;
    const supporterSubscriptions = activeSubscriptions.filter(sub => sub.planId === 'supporter').length;
    
    // Calculate monthly revenue (simplified)
    const premiumPlan = getPlanById('premium');
    const supporterPlan = getPlanById('supporter');
    
    const monthlyRevenue = 
      (premiumSubscriptions * (premiumPlan?.price || 0)) +
      (supporterSubscriptions * (supporterPlan?.price || 0));

    return {
      totalSubscriptions: allSubscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      premiumSubscriptions,
      supporterSubscriptions,
      monthlyRevenue,
    };
  }

  getUserPlan(userId: string): SubscriptionPlan {
    const subscription = this.subscriptions.get(userId);
    if (!subscription || subscription.status !== 'active') {
      return getPlanById('free')!;
    }
    
    return getPlanById(subscription.planId) || getPlanById('free')!;
  }

  canUserCreateListings(userId: string, currentListingsCount: number): boolean {
    const plan = this.getUserPlan(userId);
    return plan.maxListings === -1 || currentListingsCount < plan.maxListings;
  }
}
