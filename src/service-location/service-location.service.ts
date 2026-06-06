import { Injectable } from '@nestjs/common';
import { LocationDto, ServiceLocationDto } from './dto/service-location.dto';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ServiceLocationService {

    constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    ) { }
    
    async createLocationService(user, dto: LocationDto) {
        try {
            let body : any = dto;
            if(!dto.is_global){
                let polygon = await this.commonService.generatePolygonCoordinates(dto.latitude, dto.longitude, dto.serviceRadius);
                body.polygon_coordinates = polygon;
            }
            let serviceLocation = await this.model.ServiceLocationModel.create(body);
            return { data : serviceLocation}
        } catch (error) {
            throw error;
        }
    }

    async deleteLocationService(id: string) {
        try {
            let serviceLocation = await this.model.ServiceLocationModel.findByIdAndDelete(id);
            return { success : true, message : "Service location deleted successfully"}
        } catch (error) {
            throw error;
        }
    }

    async locationService(id: string) {
        try {
            let serviceLocation = await this.model.ServiceLocationModel.findById(id);
            return { data : serviceLocation}
        } catch (error) {
            throw error;
        }
    }


    
    async serviceLocations(dto: ServiceLocationDto) {
        try {
            let {limit, page, is_global} = dto;
            let skip = (page -1) * limit;

            let filter :any = {};
            if(is_global !== undefined){
                filter.is_global = is_global
            }
            let total = await this.model.ServiceLocationModel.countDocuments(filter);
            let serviceLocations = await this.model.ServiceLocationModel.find(filter).sort({createdAt : -1}).limit(limit).skip(skip);
            return { total : total,  data : serviceLocations}
        } catch (error) {
            throw error;
        }
    }


}
