
import { NotFoundException } from '@nestjs/common';
import * as moment from 'moment';

export const randomCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const generateUniqueId = (str?: string) => {
    let id = '';
    const timestamp = moment().unix();
    let randomDigit = '';
    for (let i = 0; i < 2; i++) {
        randomDigit += randomCharacters.charAt(
            Math.floor(Math.random() * randomCharacters.length),
        );
    }
    id = str + timestamp + randomDigit;
    return id;
};

export const checkAndGenerateUniqueId = async (
    model: any,
    str: string,
    uniqueFieldName: string,
) => {
    try {
        let uniqueId: string = await generateUniqueId(str);
        let isIdExists: any = await model.findOne({ [uniqueFieldName]: uniqueId });
        while (isIdExists) {
            uniqueId = await generateUniqueId(str);
            isIdExists = await model.findOne({ [uniqueFieldName]: uniqueId });
        }
        return uniqueId;
    } catch (error) {
        throw new NotFoundException();
    }
};