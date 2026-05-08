import { supabase } from './supabase';
import { IngestionEngine } from './ingestion-engine';

export class EmailService {
  static async pollNewEmails() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Filter by known financial senders as per spendng-sms-email-ingestion.md
    const senders = [
      'alerts@gtbank.com',
      'notifications@kuda.co',
      'alerts@opay.africa',
      'hello@grey.co'
    ];

    try {
      // In a real implementation, we would call the Gmail/Outlook API here
      // using the OAuth tokens stored in the Keychain.
      // For each matching email:
      // await IngestionEngine.processAlert(email.body, email.from, email.timestamp);
      
      console.log('SpendNG: Email polling complete');
    } catch (error) {
      console.error('Email polling failed', error);
    }
  }
}
