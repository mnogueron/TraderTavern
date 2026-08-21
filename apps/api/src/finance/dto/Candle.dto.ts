import { ApiProperty } from '@nestjs/swagger';

export class CandleDto {
  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  entry: number;

  @ApiProperty()
  exit: number;

  @ApiProperty()
  low: number;

  @ApiProperty()
  high: number;

  @ApiProperty()
  volume: number;

  constructor(
    startTime: Date,
    endTime: Date,
    entry: number,
    exit: number,
    low: number,
    high: number,
    volume: number,
  ) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.entry = entry;
    this.exit = exit;
    this.low = low;
    this.high = high;
    this.volume = volume;
  }
}
