/**
 * Email Service using Resend
 * 
 * Handles sending alert notifications when sensor readings breach thresholds.
 * 
 * Required environment variables:
 * - RESEND_API_KEY: Your Resend API key
 * - ALERT_EMAIL_TO: Email address to receive alerts (comma-separated for multiple)
 * - ALERT_EMAIL_FROM: Sender email (default: onboarding@resend.dev for testing)
 */

const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an alert email when a threshold is breached
 * @param {Object} alertData - Alert information
 * @param {number} alertData.tank_id - Tank ID
 * @param {string} alertData.tank_name - Tank name
 * @param {string} alertData.sensor_type - Sensor type (temperature, ph, tds, water_level)
 * @param {string} alertData.alert_type - Alert type (high or low)
 * @param {string} alertData.message - Alert message
 * @param {number} alertData.value - Recorded value
 * @param {number} alertData.threshold_min - Minimum threshold
 * @param {number} alertData.threshold_max - Maximum threshold
 * @param {string} alertData.unit - Unit of measurement
 */
async function sendAlertEmail(alertData) {
  // Check if email is configured
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not configured, skipping email');
    return { skipped: true, reason: 'API key not configured' };
  }

  if (!process.env.ALERT_EMAIL_TO) {
    console.log('[Email] ALERT_EMAIL_TO not configured, skipping email');
    return { skipped: true, reason: 'Recipient not configured' };
  }

  const {
    tank_id,
    tank_name,
    sensor_type,
    alert_type,
    message,
    value,
    threshold_min,
    threshold_max,
    unit,
    created_at
  } = alertData;

  // Format sensor type for display
  const sensorLabel = {
    'temperature': 'Temperature',
    'ph': 'pH Level',
    'tds': 'TDS (Total Dissolved Solids)',
    'water_level': 'Water Level'
  }[sensor_type] || sensor_type;

  // Determine severity color
  const severityColor = alert_type === 'high' ? '#dc2626' : '#2563eb';
  const severityText = alert_type === 'high' ? 'Above Maximum' : 'Below Minimum';

  // Build email HTML
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: ${severityColor}; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
        Aquaponics Alert
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">
        ${tank_name} - ${sensorLabel}
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px;">
      <!-- Alert Badge -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background: ${severityColor}15; color: ${severityColor}; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px;">
          ${severityText}
        </span>
      </div>
      
      <!-- Reading Value -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; font-weight: 700; color: ${severityColor};">
          ${value}${unit}
        </div>
        <div style="color: #6b7280; margin-top: 4px;">
          Current Reading
        </div>
      </div>
      
      <!-- Threshold Info -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
          Safe Range
        </h3>
        <div style="display: flex; justify-content: space-between;">
          <div>
            <div style="color: #6b7280; font-size: 12px;">Minimum</div>
            <div style="font-size: 20px; font-weight: 600; color: #1f2937;">${threshold_min}${unit}</div>
          </div>
          <div style="text-align: right;">
            <div style="color: #6b7280; font-size: 12px;">Maximum</div>
            <div style="font-size: 20px; font-weight: 600; color: #1f2937;">${threshold_max}${unit}</div>
          </div>
        </div>
      </div>
      
      <!-- Message -->
      <p style="color: #4b5563; line-height: 1.6; margin: 0;">
        ${message}
      </p>
      
      <!-- Timestamp -->
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">
        Alert generated at ${new Date(created_at).toLocaleString()}
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        FlowFarm Aquaponics Monitoring System
      </p>
    </div>
  </div>
</body>
</html>
  `;

  // Plain text version
  const emailText = `
AQUAPONICS ALERT - ${tank_name}

${sensorLabel} is ${severityText.toLowerCase()}!

Current Value: ${value}${unit}
Safe Range: ${threshold_min}${unit} - ${threshold_max}${unit}

${message}

Alert Time: ${new Date(created_at).toLocaleString()}

---
FlowFarm Aquaponics Monitoring System
  `;

  try {
    const recipients = process.env.ALERT_EMAIL_TO.split(',').map(e => e.trim());
    
    const { data, error } = await resend.emails.send({
      from: process.env.ALERT_EMAIL_FROM || 'FlowFarm Alerts <onboarding@resend.dev>',
      to: recipients,
      subject: `[Alert] ${tank_name}: ${sensorLabel} ${severityText}`,
      html: emailHtml,
      text: emailText
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      throw new Error(error.message);
    }

    console.log(`[Email] Alert sent successfully to ${recipients.join(', ')}, ID: ${data.id}`);
    return { success: true, emailId: data.id };

  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
    throw err;
  }
}

/**
 * Send a test email to verify configuration
 */
async function sendTestEmail(toEmail) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const { data, error } = await resend.emails.send({
    from: process.env.ALERT_EMAIL_FROM || 'FlowFarm Alerts <onboarding@resend.dev>',
    to: toEmail,
    subject: 'FlowFarm - Email Configuration Test',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Email Configuration Successful!</h2>
        <p>Your FlowFarm aquaponics monitoring system is now configured to send email alerts.</p>
        <p>You will receive notifications when sensor readings exceed your configured thresholds.</p>
      </div>
    `
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, emailId: data.id };
}

module.exports = {
  sendAlertEmail,
  sendTestEmail
};
