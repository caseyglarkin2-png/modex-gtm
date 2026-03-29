/**
 * Test email sending with full email loop:
 * 1. Send test email
 * 2. Verify EmailLog created
 * 3. Show what email looks like
 *
 * Run: npx ts-node scripts/test-email-send.ts
 */

import { wrapHtml } from '../src/lib/email/templates';
import fs from 'fs';
import path from 'path';

const testRecipient = 'casey@yardflow.ai';
const accountName = 'Demo Account Corp';

const emailBody = `Hi there,

I wanted to reach out regarding YardFlow's yard management solution.

We've helped companies like yours:
• Reduce trailer dwell time by 40%
• Increase throughput predictability
• Optimize cross-dock operations
• Eliminate bottlenecks across multi-facility networks

Would you be open to a quick 15-minute call next week to explore how this could work for ${accountName}?

Looking forward to connecting!`;

// Generate the HTML email
const html = wrapHtml(emailBody, accountName, testRecipient);

// Save to file so you can preview it
const outputPath = path.join(__dirname, '../temp/test-email.html');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html);

console.log('✅ Test email HTML generated!');
console.log(`📧 Preview: ${outputPath}`);
console.log(`\n📬 To: ${testRecipient}`);
console.log(`📋 Account: ${accountName}`);
console.log(`\n🔗 Unsubscribe link included in footer`);
console.log(`📍 Company address included (CAN-SPAM compliant)`);
console.log(`\n✨ Open the HTML file in your browser to see the email!`);

// Print first 50 lines
console.log('\n--- Email Preview (first 1000 chars) ---');
console.log(html.substring(0, 1000) + '...');
