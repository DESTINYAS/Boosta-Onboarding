import { IsNotEmpty, IsNumber } from 'class-validator';

export default class UpdateShopValueDTO {
  @IsNumber()
  shopValue: number;
}
