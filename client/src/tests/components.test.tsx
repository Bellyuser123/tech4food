import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Logo } from '../components/common/Logo.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Card, CardTitle, CardContent } from '../components/common/Card.js';
import { CustomerOrderPage } from '../pages/CustomerOrderPage.js';

describe('Design System Components', () => {
  it('renders Logo with brand name and 360 badge', () => {
    const html = renderToString(<Logo size="md" showSubtitle />);
    expect(html).toContain('Plate');
    expect(html).toContain('Proof');
    expect(html).toContain('360');
    expect(html).toContain('Food Safety &amp; Accountability');
  });

  it('renders Button with variants and sizes', () => {
    const primaryHtml = renderToString(<Button variant="primary">Verify Safety</Button>);
    expect(primaryHtml).toContain('Verify Safety');
    expect(primaryHtml).toContain('bg-burgundy-600');

    const dangerHtml = renderToString(<Button variant="danger">Report Critical</Button>);
    expect(dangerHtml).toContain('bg-red-700');
  });

  it('renders Badge with demo and safety indicators', () => {
    const demoHtml = renderToString(<Badge variant="demo">DEMO DATA</Badge>);
    expect(demoHtml).toContain('DEMO DATA');
    expect(demoHtml).toContain('bg-purple-100');

    const safetyHtml = renderToString(<Badge variant="safety">Clean Certified</Badge>);
    expect(safetyHtml).toContain('Clean Certified');
    expect(safetyHtml).toContain('bg-emerald-50');
  });

  it('renders Card hierarchy with title and content', () => {
    const cardHtml = renderToString(
      <Card variant="default">
        <CardTitle>Kitchen Cold Chain</CardTitle>
        <CardContent>All temperatures logged in range</CardContent>
      </Card>
    );
    expect(cardHtml).toContain('Kitchen Cold Chain');
    expect(cardHtml).toContain('All temperatures logged in range');
  });

  it('renders CustomerOrderPage with dish details, allergen disclosures, and CCP logs', () => {
    const demoOrder: any = {
      orderId: 'ord-test-01',
      orderReference: 'ORD-7294',
      tableNumber: 'Table 04',
      status: 'served',
      placedAt: new Date().toISOString(),
      restaurant: {
        id: 'r1',
        name: 'Osteria Della Spina',
        slug: 'osteria-della-spina',
        address: '42 Corso Venezia',
        phone: '+1 555 019 4820',
        is_verified: true,
      },
      branch: {
        id: 'b1',
        name: 'Central District',
        code: 'BR-01',
        address: '42 Corso Venezia',
        phone: '+1 555 019 4820',
      },
      items: [
        {
          menu_item_id: 'i1',
          name: 'Truffle Tagliolini al Burro',
          price: 24.5,
          quantity: 1,
          special_allergen_notes: 'Table requested no extra butter',
          ingredients: ['Egg pasta', 'Truffle butter', 'Parmigiano Reggiano'],
          allergens: [
            { allergen_code: 'gluten', status: 'contains' },
            { allergen_code: 'dairy', status: 'contains' },
            { allergen_code: 'peanuts', status: 'free_from' },
          ],
          has_unverified_allergens: false,
        },
      ],
      safetyChecks: [
        {
          check_type: 'CCP-2 Internal Core Cook Temperature',
          reading_or_status: '85.4°C',
          target_threshold: 'Min 75.0°C',
          is_safe: true,
          logged_at: '25 mins ago',
          logged_by_role: 'Chef Marco',
        },
      ],
      complaintFilingUrl: '/complaint?orderRef=ORD-7294',
      allergyAdvisoryNotice: 'Please communicate critical allergies directly to kitchen.',
    };

    const html = renderToString(
      <CustomerOrderPage
        orderData={demoOrder}
        onNavigateToMenu={() => {}}
        onNavigateToComplaint={() => {}}
      />
    );

    expect(html).toContain('ORD-7294');
    expect(html).toContain('Table 04');
    expect(html).toContain('Truffle Tagliolini al Burro');
    expect(html).toContain('Contains');
    expect(html).toContain('GLUTEN');
    expect(html).toContain('85.4°C');
    expect(html).toContain('Zero PII');
  });
});
