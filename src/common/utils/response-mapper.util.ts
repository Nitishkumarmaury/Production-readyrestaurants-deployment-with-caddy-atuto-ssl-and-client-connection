import { MaskUtil } from './mask.util'; // Adjust path if needed

type Maskable = {
    phone?: string;
    email?: string;
    country_code?: string;
    vendor?: Maskable[];
    [key: string]: any;
};

export class ResponseMapper {
    static maskSensitiveFields<T extends Maskable>(data: T): T {
        if (!data) return data;

        const clone: any = { ...data };

        // Mask direct fields
        if ('restaurant_phone' in clone && clone.restaurant_phone) {
            clone.restaurant_phone = MaskUtil.maskPhone(clone.restaurant_phone);
        }

        if ('phone' in clone && clone.phone) {
            clone.phone = MaskUtil.maskPhone(clone.phone);
        }

        if ('country_code' in clone && clone.country_code) {
            clone.country_code = MaskUtil.maskCountryCode(clone.country_code);
        }

        if ('email' in clone && clone.email) {
            clone.email = MaskUtil.maskEmail(clone.email);
        }

        // Mask nested vendor array
        if (Array.isArray(clone.vendor)) {
            clone.vendor = clone.vendor.map((v: Maskable) => this.maskSensitiveFields(v));
        }

        return clone;
    }
}
