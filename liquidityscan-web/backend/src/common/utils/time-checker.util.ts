/**
 * Time checker utility to match Java bot behavior
 * Java bot uses Asia/Yerevan timezone with working hours 10:00-21:00
 * Kill Zone: 17:00-20:00 (for message modification)
 */

export class TimeCheckerUtil {
  private static readonly YEREVAN_ZONE = 'Asia/Yerevan';
  private static readonly START_TIME = { hour: 10, minute: 0 };
  private static readonly END_TIME = { hour: 21, minute: 0 };
  private static readonly KILL_ZONE_START = { hour: 17, minute: 0 };
  private static readonly KILL_ZONE_END = { hour: 20, minute: 0 };

  /**
   * Check if current time is within allowed working hours (10:00-21:00 Asia/Yerevan)
   * Used for Super Engulfing and RSI Divergence on 1h and 4h timeframes
   */
  static isWithinAllowedTime(): boolean {
    const now = new Date();
    const yerevanTime = new Date(now.toLocaleString('en-US', { timeZone: this.YEREVAN_ZONE }));
    
    const currentHour = yerevanTime.getHours();
    const currentMinute = yerevanTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const startTimeMinutes = this.START_TIME.hour * 60 + this.START_TIME.minute;
    const endTimeMinutes = this.END_TIME.hour * 60 + this.END_TIME.minute;
    
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
  }

  /**
   * Check if current time is within Kill Zone (17:00-20:00 Asia/Yerevan)
   * Used for modifying Super Engulfing messages
   */
  static isKillZone(): boolean {
    const now = new Date();
    const yerevanTime = new Date(now.toLocaleString('en-US', { timeZone: this.YEREVAN_ZONE }));
    
    const currentHour = yerevanTime.getHours();
    const currentMinute = yerevanTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const killZoneStartMinutes = this.KILL_ZONE_START.hour * 60 + this.KILL_ZONE_START.minute;
    const killZoneEndMinutes = this.KILL_ZONE_END.hour * 60 + this.KILL_ZONE_END.minute;
    
    return currentTimeMinutes >= killZoneStartMinutes && currentTimeMinutes < killZoneEndMinutes;
  }

  /**
   * Get current time in Asia/Yerevan timezone
   */
  static getYerevanTime(): Date {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: this.YEREVAN_ZONE }));
  }

  /**
   * Format message with Kill Zone indicator if in Kill Zone
   */
  static formatMessageWithKillZone(message: string): string {
    if (this.isKillZone()) {
      return `🔥 ${message}`;
    }
    return message;
  }
}
