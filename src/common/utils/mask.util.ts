export class MaskUtil {
    // Mask all digits except the last 3
    static maskPhone(phone: string): string {
        if (!phone || phone.length <= 3) return '*'.repeat(phone.length);
        const visible = phone.slice(-3);
        return '*'.repeat(phone.length - 3) + visible;
    }

    // Keep first 3 characters of email local part, mask the rest before '@'
    static maskEmail(email: string): string {
        if (!email) return email;

        const [local, domain] = email.split('@');
        const visibleLocal = local.slice(0, 3);
        const totalMaskedLength = local.length - 3 + 1 + domain.length; // -3 from local, +1 for '@', rest for domain

        return visibleLocal + '*'.repeat(Math.max(0, totalMaskedLength));
    }



    // Optional: mask all but the first character in country code
    static maskCountryCode(countryCode: string): string {
        if (!countryCode || countryCode.length <= 1) return countryCode;
        return countryCode[0] + '*'.repeat(countryCode.length - 1);
    }
}
