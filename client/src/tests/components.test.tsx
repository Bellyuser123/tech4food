import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Logo } from '../components/common/Logo.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Card, CardTitle, CardContent } from '../components/common/Card.js';

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
});
