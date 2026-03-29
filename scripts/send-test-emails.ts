import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const TEST_EMAIL = process.env.TEST_EMAIL || 'casey@freightroll.com';
const FROM_EMAIL = 'Casey Larkin <casey@yardflow.ai>';

interface TestEmail {
  to: string;
  subject: string;
  html: string;
  name: string;
}

const testEmails: TestEmail[] = [
  {
    to: TEST_EMAIL,
    subject: 'YardFlow Network Audit - Initial Outreach (TEST)',
    name: 'Initial Email (Sequence Step 1)',
    html: `
      <p>Hi there,</p>
      <p>I wanted to reach out regarding YardFlow's yard management solution.</p>
      <p>We've helped companies like yours:</p>
      <ul>
        <li>Reduce trailer dwell time by 40%</li>
        <li>Increase throughput predictability</li>
        <li>Optimize cross-dock operations</li>
        <li>Eliminate bottlenecks across multi-facility networks</li>
      </ul>
      <p>Would you be open to a quick 15-minute call next week to explore how this could work for your organization?</p>
      <p>Looking forward to connecting!</p>
      <br/>
      <p><strong>Casey Larkin</strong><br/>
      GTM Lead · <span style="color:#0e7490;">Yard</span><span style="font-weight:600;">Flow</span> by FreightRoll<br/>
      The First Yard Network System. Deterministic throughput across every facility.</p>
      <p>
        <a href="https://yardflow.ai" style="color:#0e7490; text-decoration:none;">yardflow.ai</a> |
        <a href="https://yardflow.ai/roi" style="color:#0e7490; text-decoration:none;">Run ROI</a> |
        <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW" style="color:#0e7490; text-decoration:none;">Book a Network Audit</a>
      </p>
      <hr style="border:none; border-top:1px solid #f0f0f0; margin:24px 0;"/>
      <p style="font-size:12px; color:#9ca3af;">
        FreightRoll Inc. · 123 Logistics Way, Atlanta, GA 30303<br/>
        You're receiving this because we believe YardFlow could help optimize your yard operations.<br/>
        <a href="https://modex-gtm.vercel.app/unsubscribe?email=${TEST_EMAIL}" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a>
      </p>
    `,
  },
  {
    to: TEST_EMAIL,
    subject: 'Re: YardFlow Network Audit - Quick Question (TEST)',
    name: 'Follow-up Email (Sequence Step 2)',
    html: `
      <p>Hi again,</p>
      <p>Quick follow-up on my note from Tuesday. I realized I didn't mention something pretty compelling:</p>
      <p>Most facilities we work with are running 3-4 manual handoffs per trailer. YardFlow deterministically orchestrates these in realtime, which typically cuts dock time from 45 mins to 28 mins avg.</p>
      <p>For a 50-door facility running 150 trailers/day, that's ~200 billable hours recovered per month.</p>
      <p>Would a 15-minute call this week make sense to see if we could find similar gains for you?</p>
      <p>Cheers<br/>
      Casey</p>
      <br/>
      <p><strong>Casey Larkin</strong><br/>
      GTM Lead · <span style="color:#0e7490;">Yard</span><span style="font-weight:600;">Flow</span> by FreightRoll</p>
      <p>
        <a href="https://yardflow.ai" style="color:#0e7490; text-decoration:none;">yardflow.ai</a> |
        <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW" style="color:#0e7490; text-decoration:none;">Book a Network Audit</a>
      </p>
      <hr style="border:none; border-top:1px solid #f0f0f0; margin:24px 0;"/>
      <p style="font-size:12px; color:#9ca3af;">
        FreightRoll Inc. · 123 Logistics Way, Atlanta, GA 30303<br/>
        <a href="https://modex-gtm.vercel.app/unsubscribe?email=${TEST_EMAIL}" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a>
      </p>
    `,
  },
  {
    to: TEST_EMAIL,
    subject: 'Your YardFlow Network Audit Report (TEST)',
    name: 'One-Pager / Meeting Brief',
    html: `
      <p>Hi there,</p>
      <p>As promised, here's the analysis we discussed on our call:</p>
      <p><strong>YardFlow Network Audit Report</strong></p>
      <p><strong>Your Facility Profile:</strong></p>
      <ul>
        <li>Current Avg Dwell Time: 42 minutes</li>
        <li>Daily Throughput: 140 trailers</li>
        <li>Peak Bottleneck: Cross-dock staging</li>
      </ul>
      <p><strong>Projected Impact (First 90 Days):</strong></p>
      <ul>
        <li>Dwell Time Reduction: 42 min → 26 min (-38%)</li>
        <li>Monthly Capacity Gain: +280 billable hours</li>
        <li>Annual Revenue Impact: +$420K</li>
        <li>Implementation Time: 3 weeks</li>
      </ul>
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Technical integration kickoff (Week 1)</li>
        <li>Data sync from your WMS (Week 2)</li>
        <li>Go-live with pilot dock (Week 3)</li>
        <li>Full facility rollout (Week 4)</li>
      </ol>
      <p>I'd like to move forward with a contract review. Are you available Thursday at 2pm ET to finalize?</p>
      <p>Casey</p>
      <br/>
      <p><strong>Casey Larkin</strong><br/>
      GTM Lead · <span style="color:#0e7490;">Yard</span><span style="font-weight:600;">Flow</span> by FreightRoll</p>
      <p>
        <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW" style="color:#0e7490; text-decoration:none;">Schedule Contract Review</a>
      </p>
      <hr style="border:none; border-top:1px solid #f0f0f0; margin:24px 0;"/>
      <p style="font-size:12px; color:#9ca3af;">
        FreightRoll Inc. · 123 Logistics Way, Atlanta, GA 30303<br/>
        <a href="https://modex-gtm.vercel.app/unsubscribe?email=${TEST_EMAIL}" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a>
      </p>
    `,
  },
];

async function runTestEmails() {
  console.log(`📧 Sending ${testEmails.length} test emails from yardflow.ai to ${TEST_EMAIL}...\n`);

  for (const email of testEmails) {
    try {
      console.log(`Sending: ${email.name}`);
      console.log(`   To: ${email.to}`);
      console.log(`   Subject: ${email.subject}`);

      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email.to,
        subject: email.subject,
        html: email.html,
      });

      if (result.error) {
        console.error(`   ❌ Error: ${result.error.message}\n`);
      } else {
        console.log(`   ✅ Sent via Resend (ID: ${result.data?.id})\n`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}\n`);
    }
  }

  console.log('✅ All test emails complete!');
}

runTestEmails();
