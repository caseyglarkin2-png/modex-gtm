import { describe, it, expect } from 'vitest';
import {
  classifyInboundReply,
  REPLY_REJECTION_REASONS,
  type ReplyPrecisionInput,
} from '@/lib/email/reply-precision';

/**
 * Precision gate for inbound "replies".
 *
 * Context (2026-07-21): /api/cron/check-inbox treated ANY unread inbox message as a
 * prospect reply. On its first run after a 40-day outage it processed 6 "replies":
 * four statuspage.io notifications, a HubSpot marketing blast, and an internal
 * @freightroll.com thread. Each one stamped last_intent_source='email_reply', which
 * is an SQL gate in src/lib/revops/qualification/model.ts hasIntent().
 */

const human = (over: Partial<ReplyPrecisionInput> = {}): ReplyPrecisionInput => ({
  fromEmail: 'jane.ops@kroger.com',
  subject: 'Re: Yard turn times at your Louisville DC',
  headers: {},
  ...over,
});

describe('classifyInboundReply', () => {
  describe('accepts genuine human replies', () => {
    it('accepts a plain typed reply from a prospect', () => {
      const v = classifyInboundReply(human());
      expect(v.isHumanReply).toBe(true);
      expect(v.reason).toBe('human_reply');
      expect(v.confidence).toBe('high');
    });

    it('accepts when Auto-Submitted is explicitly "no" (RFC 3834)', () => {
      const v = classifyInboundReply(human({ headers: { 'Auto-Submitted': 'no' } }));
      expect(v.isHumanReply).toBe(true);
    });

    it('accepts a personal address whose local part merely contains an automated word', () => {
      // "supportive" / "alertson" must not trip the `support` / `alerts` rules
      expect(classifyInboundReply(human({ fromEmail: 'alertson@kroger.com' })).isHumanReply).toBe(true);
      expect(classifyInboundReply(human({ fromEmail: 'j.supportini@sysco.com' })).isHumanReply).toBe(true);
    });

    it('accepts a human at a SaaS vendor domain when the local part is a person', () => {
      const v = classifyInboundReply(human({ fromEmail: 'dana.reeves@hubspot.com' }));
      expect(v.isHumanReply).toBe(true);
    });
  });

  describe('RFC 3834 / auto-responder headers', () => {
    it.each([
      ['auto-replied'],
      ['auto-generated'],
      ['auto-notified'],
    ])('rejects Auto-Submitted: %s', (value) => {
      const v = classifyInboundReply(human({ headers: { 'Auto-Submitted': value } }));
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.AUTO_SUBMITTED);
    });

    it('matches Auto-Submitted case-insensitively on the header NAME', () => {
      const v = classifyInboundReply(human({ headers: { 'auto-submitted': 'auto-replied' } }));
      expect(v.isHumanReply).toBe(false);
    });

    it('rejects X-Autoreply', () => {
      const v = classifyInboundReply(human({ headers: { 'X-Autoreply': 'yes' } }));
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.AUTORESPONDER_HEADER);
    });

    it('rejects X-Autorespond', () => {
      const v = classifyInboundReply(human({ headers: { 'X-Autorespond': 'ooo' } }));
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.AUTORESPONDER_HEADER);
    });

    it.each([['bulk'], ['junk'], ['auto_reply'], ['list']])(
      'rejects Precedence: %s',
      (value) => {
        const v = classifyInboundReply(human({ headers: { Precedence: value } }));
        expect(v.isHumanReply).toBe(false);
        expect(v.reason).toBe(REPLY_REJECTION_REASONS.PRECEDENCE_BULK);
      },
    );

    it('does NOT reject Precedence: normal', () => {
      expect(classifyInboundReply(human({ headers: { Precedence: 'normal' } })).isHumanReply).toBe(true);
    });
  });

  describe('list / marketing mail', () => {
    it('rejects List-Unsubscribe', () => {
      const v = classifyInboundReply(
        human({ headers: { 'List-Unsubscribe': '<https://hs.com/u/1>' } }),
      );
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.LIST_MAIL);
    });

    it('rejects List-Id', () => {
      const v = classifyInboundReply(human({ headers: { 'List-Id': '<news.example.com>' } }));
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.LIST_MAIL);
    });

    it('rejects the real HubSpot marketing blast that slipped through', () => {
      const v = classifyInboundReply({
        fromEmail: 'customermarketing@hubspot.com',
        subject: 'Your July product update',
        headers: { 'List-Unsubscribe': '<mailto:u@hubspot.com>' },
      });
      expect(v.isHumanReply).toBe(false);
    });
  });

  describe('automated local parts', () => {
    it.each([
      'no-reply@statuspage.io',
      'noreply@statuspage.io',
      'donotreply@vendor.com',
      'do-not-reply@vendor.com',
      'notifications@vendor.com',
      'notification@vendor.com',
      'alerts@vendor.com',
      'alert@vendor.com',
      'bounce@vendor.com',
      'bounces@vendor.com',
      'mailer-daemon@vendor.com',
      'postmaster@vendor.com',
      'editors-noreply@linkedin.com',
      'googleaistudio-noreply@google.com',
    ])('rejects %s', (fromEmail) => {
      const v = classifyInboundReply(human({ fromEmail }));
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.AUTOMATED_SENDER);
    });

    it('is case-insensitive on the address', () => {
      expect(classifyInboundReply(human({ fromEmail: 'No-Reply@StatusPage.IO' })).isHumanReply).toBe(false);
    });

    it('strips a +tag before matching', () => {
      expect(classifyInboundReply(human({ fromEmail: 'noreply+abc@vendor.com' })).isHumanReply).toBe(false);
    });
  });

  describe('support@ at monitoring / SaaS vendors', () => {
    it('rejects support@ at a known automated vendor domain', () => {
      const v = classifyInboundReply(human({ fromEmail: 'support@statuspage.io' }));
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.AUTOMATED_SENDER);
    });

    it('rejects team@ at a known automated vendor domain (the easydmarc case)', () => {
      const v = classifyInboundReply(human({ fromEmail: 'team@email.easydmarc.com' }));
      expect(v.isHumanReply).toBe(false);
    });

    it('does NOT reject support@ at a prospect domain (could be a real person)', () => {
      const v = classifyInboundReply(human({ fromEmail: 'support@kroger.com' }));
      expect(v.isHumanReply).toBe(true);
    });
  });

  describe('internal senders', () => {
    it.each([
      'jake@freightroll.com',
      'casey@freightroll.com',
      'someone@yardflow.ai',
      'bot@dwtb.dev',
    ])('rejects internal sender %s', (fromEmail) => {
      const v = classifyInboundReply(human({ fromEmail }));
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.INTERNAL_SENDER);
    });

    it('rejects a subdomain of an internal domain', () => {
      expect(classifyInboundReply(human({ fromEmail: 'a@mail.freightroll.com' })).isHumanReply).toBe(false);
    });

    it('does NOT reject a lookalike external domain', () => {
      expect(classifyInboundReply(human({ fromEmail: 'a@notfreightroll.com' })).isHumanReply).toBe(true);
    });
  });

  describe('out-of-office and bounce subjects', () => {
    // The 2026-07 HubSpot batches: 6 nike.com contacts stamped "replied" within 60
    // seconds of each other, 7 kuehne-nagel.com within 2 minutes. Humans do not reply
    // in machine-timed batches; OOO auto-acks and NDRs do.
    it.each([
      'Automatic reply: Yard turn times',
      'Auto: Out of the office',
      'Out of Office: Re: your note',
      'AutoReply: Re: yards',
      'Undeliverable: Yard turn times',
      'Delivery Status Notification (Failure)',
      'Mail delivery failed: returning message to sender',
      'Returned mail: see transcript for details',
      'Message blocked',
    ])('rejects subject %s', (subject) => {
      const v = classifyInboundReply(human({ subject }));
      expect(v.isHumanReply).toBe(false);
      expect([
        REPLY_REJECTION_REASONS.AUTO_REPLY_SUBJECT,
        REPLY_REJECTION_REASONS.BOUNCE_SUBJECT,
      ]).toContain(v.reason);
    });

    it('does NOT reject a subject that merely mentions the office', () => {
      const v = classifyInboundReply(human({ subject: 'Re: our office is moving, can we push?' }));
      expect(v.isHumanReply).toBe(true);
    });

    // Verified 2026-07-21 against the real casey@freightroll.com mailbox: of 33
    // inbound "replies" to the "48-minute turns" campaign, 31 were autoresponders.
    // These are the exact localized prefixes observed on those messages.
    it.each([
      ['Automatische Antwort: 48-minute turns became 24', 'de'],
      ['Automatisch antwoord: 48-minute turns became 24', 'nl'],
      ['Réponse automatique: 48-minute turns became 24', 'fr'],
      ['Risposta automatica: 48-minute turns became 24', 'it'],
      ['Resposta automática: 48-minute turns became 24', 'pt'],
      ['Respuesta automática: 48-minute turns became 24', 'es'],
      ['Samodejni odgovor: 48-minute turns became 24', 'sl'],
      ['自动答复: Kroger automated first', 'zh'],
      ['自動応答: Kroger automated first', 'ja'],
      ['Automaattinen vastaus: 48-minute turns', 'fi'],
      ['Автоответ: 48-minute turns', 'ru'],
    ])('rejects localized auto-reply subject %s (%s)', (subject) => {
      const v = classifyInboundReply(human({ subject }));
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.AUTO_REPLY_SUBJECT);
    });

    it('rejects a "no longer with the company" departure notice', () => {
      // Two of these were being counted as SQL-promoting replies.
      const v = classifyInboundReply(
        human({ subject: 'Re: yards', bodyText: 'Primoz is no longer with the company. Please contact info@prigo.si.' }),
      );
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.DEPARTURE_NOTICE);
    });

    it('rejects an OOO detected only in the body', () => {
      const v = classifyInboundReply(
        human({ bodyText: 'I am currently out of the office and will return on August 6 with no access to email.' }),
      );
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.AUTO_REPLY_BODY);
    });

    it('does NOT reject a human who mentions being out next week', () => {
      const v = classifyInboundReply(
        human({ bodyText: "We're all out Thursday, but 6/29 or 6/30 would work for a call." }),
      );
      expect(v.isHumanReply).toBe(true);
    });
  });

  describe('malformed input', () => {
    it('rejects an empty sender', () => {
      const v = classifyInboundReply(human({ fromEmail: '' }));
      expect(v.isHumanReply).toBe(false);
      expect(v.reason).toBe(REPLY_REJECTION_REASONS.NO_SENDER);
    });

    it('rejects an address with no domain', () => {
      expect(classifyInboundReply(human({ fromEmail: 'garbage' })).isHumanReply).toBe(false);
    });

    it('tolerates undefined headers and subject', () => {
      const v = classifyInboundReply({ fromEmail: 'jane@kroger.com' });
      expect(v.isHumanReply).toBe(true);
    });
  });

  describe('confidence flagging', () => {
    it('flags an accepted reply as low confidence when there is no HubSpot contact', () => {
      const v = classifyInboundReply(human({ knownContact: false }));
      expect(v.isHumanReply).toBe(true);
      expect(v.confidence).toBe('low');
      expect(v.reason).toBe('human_reply_unknown_sender');
    });

    it('is high confidence when the sender is a known HubSpot contact', () => {
      const v = classifyInboundReply(human({ knownContact: true }));
      expect(v.isHumanReply).toBe(true);
      expect(v.confidence).toBe('high');
    });

    it('never upgrades a rejected message via knownContact', () => {
      const v = classifyInboundReply(human({ fromEmail: 'noreply@statuspage.io', knownContact: true }));
      expect(v.isHumanReply).toBe(false);
    });
  });

  describe('purity', () => {
    it('does not mutate its input', () => {
      const input = human({ headers: { Precedence: 'bulk' } });
      const snapshot = JSON.parse(JSON.stringify(input));
      classifyInboundReply(input);
      expect(input).toEqual(snapshot);
    });

    it('is deterministic', () => {
      const input = human({ fromEmail: 'noreply@vendor.com' });
      expect(classifyInboundReply(input)).toEqual(classifyInboundReply(input));
    });
  });
});
