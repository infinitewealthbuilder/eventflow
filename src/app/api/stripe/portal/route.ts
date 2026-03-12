import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const stripe = getStripe();

    // Create a Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: organizationId, // Assuming this is the Stripe customer ID
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
