import { Controller, Post } from "@nestjs/common";
import { DbService } from "./db.service";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@Controller()
export class DbController{
  constructor(
    private readonly dbService: DbService
  ){}

  @Post('db_backup')
  @ApiOperation({ summary: "Db Backup" })
  async dbbackup() {
    let url = await this.dbService.backup_case_1();
    return { url }
  }

}