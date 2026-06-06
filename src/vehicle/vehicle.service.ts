import { Injectable } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class VehicleService {
    constructor(
        private readonly model: DbService,
        private readonly commonService: CommonService,
    ) { }
    async create(createVehicleDto: CreateVehicleDto) {
        try {
            let add = await this.model.vehicle.create(createVehicleDto)
            return { data: add }
        } catch (error) {
            throw error
        }
    }

    async findAll() {
        try {
            let data = await this.model.vehicle.find()
            return { data: data }
        } catch (error) {
            throw error
        }
    }

    async update(id:string, dto: CreateVehicleDto) {
        try {

            await this.model.vehicle.updateOne({_id : id}, {
                $set : dto
            })
            let result = await this.model.vehicle.findById(id)
            return { data: result }
        } catch (error) {
            throw error
        }
    }

    async delete(id:string) {
        try {
            let drivers = await this.model.driver.find({vehicle_id : id});

            // send notification to drivers 
            drivers.map(async (driver) => {
                let session = await this.model.session.find({
                  user_id: driver._id,
                });

                if (session.length > 0) {
                  for (const fcm of session) {
                    console.log('fcm', fcm);
                    console.log('fcm.fcm_token ------->', fcm.fcm_token);
                    
                    // const title_key = 'new_order_restaurant_title';
                    // const description_key = 'new_order_restaurant_description';
                    
                    // const title_localization =
                    //   await this.commonService.localization(title_key);
                    // const description_localization =
                    //   await this.commonService.localization(description_key);
                    
                    let push_content = {
                      title: "Your Vehicle Was Removed",
                      description: "An administrator has removed your vehicle from your account. Please select a new vehicle to continue with your service",
                    };
                    let push_data = {
                        type: 'vehicle_removed',
                        driver_id : driver._id.toString() 
                    };

                    this.commonService.send_notification(
                      push_content,
                      fcm.fcm_token,
                      push_data,
                      driver._id
                    );
                  }
                }
            });

            // update vehicle id 
            await this.model.driver.updateMany({vehicle_id : id}, {
                $set : {
                    vehicle_id : null,
                    status: "offline"
                }
            })

            let result = await this.model.vehicle.deleteOne({_id : id});
            return { data: result };
        
        } catch (error) {
            throw error
        }
    }
}
