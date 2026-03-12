import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tier, organizationId } = body;

    if (!tier || !organizationId) {
      return NextResponse.json({ error: 'Tier and Organization ID are required' }, { status: 400 });
    }

    const stripe = getStripe();

    // Get the price ID for the selected tier
    const priceId = process.env[`STRIPE_${tier}_PRICE_ID`];

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured for this tier' }, { status: 500 });
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: organizationId, // Assuming this is the Stripe customer ID
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
