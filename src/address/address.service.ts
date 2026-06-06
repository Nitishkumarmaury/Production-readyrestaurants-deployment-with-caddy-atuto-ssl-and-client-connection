import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';


@Injectable()
export class AddressService {
    constructor(private readonly model: DbService) { }



    async AddAddress(body, user_id) {
        try {
            let customer_id = user_id
                let data = { ...body, customer_id };
                
            let add_address = await this.model.customerAddress.create( data );
           await this.model.customer.updateOne({_id:user_id},{current_address:add_address._id})
            return { data: add_address };
        }
        catch (error) {
            throw error;
        }
    }

    async DeleteAddress(id) {
        try {

            const result = await this.model.customerAddress.deleteOne({ _id: id });

            if (result.deletedCount === 0) {
                return { message: 'Address not found or already deleted' };
            }

            return { message: 'Address deleted successfully' };
        } catch (error) {
            console.error('Error deleting address:', error);
            throw new Error('Failed to delete address');
        }
    }

    async FindAllAddress(req : any) {
        try {
            let user_id = req?.payload?.user_id ?? null;
            let data = null;
            if(user_id){
                data = await this.model.customerAddress.find({ customer_id: user_id });
            }
            return { data: data };
        } catch (error) {
            throw error;
        }
    }

    async UpdateAddress(id, body) {
        try {
            const update = await this.model.customerAddress.updateOne({ _id: id },body)
            return { message: "Successfully updated" }
        } catch (error) {
            throw error

        }
    }

    async UpdateCurrentAddress(id, customer_id) {
        try {

            const update = await this.model.customer.updateOne({ _id: customer_id }, { current_address: id })

            return { message: "Update successfully" }
        } catch (error) {
            throw error;
        }
    }
}
